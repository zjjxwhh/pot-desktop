import { invoke } from '@tauri-apps/api/core';

export async function backup(endpoint, region, bucket, accessKey, secretKey, pathStyle, name) {
    return await invoke('s3', {
        operate: 'put',
        endpoint,
        region,
        bucket,
        accessKey,
        secretKey,
        pathStyle,
        name,
    });
}

export async function list(endpoint, region, bucket, accessKey, secretKey, pathStyle) {
    const backup_list_text = await invoke('s3', {
        operate: 'list',
        endpoint,
        region,
        bucket,
        accessKey,
        secretKey,
        pathStyle,
    });
    let backup_list = JSON.parse(backup_list_text);
    return backup_list.filter((key) => {
        return key.endsWith('.zip');
    });
}

export async function get(endpoint, region, bucket, accessKey, secretKey, pathStyle, name) {
    return await invoke('s3', {
        operate: 'get',
        endpoint,
        region,
        bucket,
        accessKey,
        secretKey,
        pathStyle,
        name,
    });
}

export async function remove(endpoint, region, bucket, accessKey, secretKey, pathStyle, name) {
    return await invoke('s3', {
        operate: 'delete',
        endpoint,
        region,
        bucket,
        accessKey,
        secretKey,
        pathStyle,
        name,
    });
}
