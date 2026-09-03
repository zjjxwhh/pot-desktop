use whatlang::Lang;

#[tauri::command]
pub fn lang_detect(text: &str) -> Result<&'static str, ()> {
    let Some(info) = whatlang::detect(text) else {
        return Ok("en");
    };
    Ok(match info.lang() {
        Lang::Cmn => "zh_cn",
        Lang::Jpn => "ja",
        Lang::Kor => "ko",
        Lang::Eng => "en",
        Lang::Fra => "fr",
        Lang::Deu => "de",
        Lang::Spa => "es",
        Lang::Rus => "ru",
        Lang::Ita => "it",
        Lang::Por => "pt_pt",
        Lang::Tur => "tr",
        Lang::Ara => "ar",
        Lang::Vie => "vi",
        Lang::Tha => "th",
        Lang::Ind => "id",
        Lang::Hin => "hi",
        Lang::Nob => "nb_no",
        Lang::Pes => "fa",
        Lang::Ukr => "uk",
        _ => "en",
    })
}
