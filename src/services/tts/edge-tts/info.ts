export const info = {
    name: 'edge_tts',
    icon: 'logo/edge.svg',
};

// 值为 Edge TTS 使用的 BCP-47 区域标识，同时作为 voices.ts 中音色目录的键。
// 挪威书面语和新挪威语共用 nb-NO 音色，Edge 没有提供 nn-NO 发音人。
// mn_mo（传统蒙文）未列入：Edge 只有西里尔蒙文音色，无法正确朗读传统蒙文。
export enum Language {
    zh_cn = 'zh-CN',
    zh_tw = 'zh-TW',
    en = 'en-US',
    ja = 'ja-JP',
    ko = 'ko-KR',
    fr = 'fr-FR',
    es = 'es-ES',
    ru = 'ru-RU',
    de = 'de-DE',
    it = 'it-IT',
    tr = 'tr-TR',
    pt_pt = 'pt-PT',
    pt_br = 'pt-BR',
    vi = 'vi-VN',
    id = 'id-ID',
    th = 'th-TH',
    ms = 'ms-MY',
    ar = 'ar-SA',
    hi = 'hi-IN',
    km = 'km-KH',
    mn_cy = 'mn-MN',
    nb_no = 'nb-NO',
    nn_no = 'nb-NO',
    fa = 'fa-IR',
    sv = 'sv-SE',
    pl = 'pl-PL',
    nl = 'nl-NL',
    uk = 'uk-UA',
    he = 'he-IL',
}
