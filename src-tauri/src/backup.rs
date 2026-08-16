use crate::error::Error;
use dirs::config_dir;
use log::info;
use reqwest_dav::{Auth, ClientBuilder, Depth};
use s3::bucket::Bucket;
use s3::creds::Credentials;
use s3::region::Region;
use std::io::Write;
use walkdir::WalkDir;
use zip::read::ZipArchive;
use zip::write::SimpleFileOptions;

fn config_dir_path() -> Result<std::path::PathBuf, Error> {
    match config_dir() {
        Some(v) => Ok(v.join("com.pot-app.desktop")),
        None => Err(Error::Error("Get Config Dir Error".into())),
    }
}

// 将 config.json / history.db / plugins 打包为 zip 字节
fn create_archive() -> Result<Vec<u8>, Error> {
    let config_dir_path = config_dir_path()?;
    let config_path = config_dir_path.join("config.json");
    let database_path = config_dir_path.join("history.db");
    let plugin_path = config_dir_path.join("plugins");

    let mut zip = zip::ZipWriter::new(std::io::Cursor::new(Vec::new()));
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);
    zip.start_file("config.json", options)?;
    zip.write(&std::fs::read(&config_path)?)?;
    if database_path.exists() {
        zip.start_file("history.db", options)?;
        zip.write(&std::fs::read(&database_path)?)?;
    }
    if plugin_path.exists() {
        for entry in WalkDir::new(plugin_path) {
            let entry = entry?;
            let path = entry.path();
            let file_name = match path.strip_prefix(&config_dir_path)?.to_str() {
                Some(v) => v,
                None => return Err(Error::Error("Strip Prefix Error".into())),
            };
            if path.is_file() {
                info!("adding file {path:?} as {file_name:?} ...");
                zip.start_file(file_name, options)?;
                zip.write(&std::fs::read(entry.path())?)?;
            }
        }
    }
    let cursor = zip.finish()?;
    Ok(cursor.into_inner())
}

// 将 zip 字节写入 archive.zip 并解压到配置目录
fn restore_archive(zip_bytes: &[u8]) -> Result<(), Error> {
    let config_dir_path = config_dir_path()?;
    let zip_path = config_dir_path.join("archive.zip");

    let mut zip_file = std::fs::File::create(&zip_path)?;
    zip_file.write_all(zip_bytes)?;
    let mut zip_file = std::fs::File::open(&zip_path)?;
    let mut zip = ZipArchive::new(&mut zip_file)?;
    zip.extract(config_dir_path)?;
    Ok(())
}

#[tauri::command(async)]
pub async fn webdav(
    operate: &str,
    url: String,
    username: String,
    password: String,
    name: Option<String>,
) -> Result<String, Error> {
    // build a client
    let client = ClientBuilder::new()
        .set_host(url.clone())
        .set_auth(Auth::Basic(username.clone(), password.clone()))
        .build()?;
    client.mkcol("/pot-app").await.unwrap_or_default();
    let client = ClientBuilder::new()
        .set_host(format!("{}/pot-app", url.trim_end_matches("/")))
        .set_auth(Auth::Basic(username, password))
        .build()?;
    match operate {
        "list" => {
            let res = client.list("/", Depth::Number(1)).await?;
            let result = serde_json::to_string(&res)?;
            Ok(result)
        }
        "get" => {
            let res = client.get(&format!("/{}", name.unwrap())).await?;
            let data = res.bytes().await?;
            restore_archive(&data)?;
            Ok("".to_string())
        }
        "put" => {
            let bytes = create_archive()?;
            match client
                .put(&format!("/{}", name.unwrap()), bytes)
                .await
            {
                Ok(()) => return Ok("".to_string()),
                Err(e) => {
                    return Err(Error::Error(format!("WebDav Put Error: {}", e).into()));
                }
            }
        }

        "delete" => match client.delete(&format!("/{}", name.unwrap())).await {
            Ok(()) => return Ok("".to_string()),
            Err(e) => {
                return Err(Error::Error(format!("WebDav Delete Error: {}", e).into()));
            }
        },
        _ => {
            return Err(Error::Error(
                format!("WebDav Operate Error: {}", operate).into(),
            ));
        }
    }
}

#[tauri::command(async)]
pub async fn local(operate: &str, path: String) -> Result<String, Error> {
    match operate {
        "put" => {
            let bytes = create_archive()?;
            std::fs::write(&path, bytes)?;
            Ok("".to_string())
        }
        "get" => {
            let data = std::fs::read(&path)?;
            restore_archive(&data)?;
            Ok("".to_string())
        }
        _ => {
            return Err(Error::Error(
                format!("Local Operate Error: {}", operate).into(),
            ));
        }
    }
}

#[tauri::command(async)]
pub async fn s3(
    operate: &str,
    endpoint: String,
    region: String,
    bucket: String,
    access_key: String,
    secret_key: String,
    path_style: bool,
    name: Option<String>,
) -> Result<String, Error> {
    let region = Region::Custom {
        region,
        endpoint: endpoint.trim_end_matches('/').to_string(),
    };
    let credentials = Credentials::new(Some(&access_key), Some(&secret_key), None, None, None)
        .map_err(|e| Error::Error(Box::new(e) as Box<dyn std::error::Error>))?;
    let bucket = Bucket::new(&bucket, region, credentials)?;
    let bucket = if path_style {
        bucket.with_path_style()
    } else {
        bucket
    };
    match operate {
        "list" => {
            let results = bucket.list(String::new(), None).await?;
            let mut keys = Vec::new();
            for result in results {
                for obj in result.contents {
                    keys.push(obj.key);
                }
            }
            Ok(serde_json::to_string(&keys)?)
        }
        "get" => {
            let name = name.unwrap_or_default();
            let res = bucket.get_object(format!("/{name}")).await?;
            let data = res.to_vec();
            restore_archive(&data)?;
            Ok("".to_string())
        }
        "put" => {
            let name = name.unwrap_or_default();
            let bytes = create_archive()?;
            bucket.put_object(format!("/{name}"), &bytes).await?;
            Ok("".to_string())
        }
        "delete" => {
            let name = name.unwrap_or_default();
            bucket.delete_object(format!("/{name}")).await?;
            Ok("".to_string())
        }
        _ => {
            return Err(Error::Error(
                format!("S3 Operate Error: {}", operate).into(),
            ));
        }
    }
}
