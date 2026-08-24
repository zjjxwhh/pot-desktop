// ISO-639-1 + Country Code (Option)
// https://zh.wikipedia.org/wiki/ISO_639-1%E4%BB%A3%E7%A0%81%E8%A1%A8
export const languageList = [
    'zh_cn',
    'zh_tw',
    'mn_mo',
    'en',
    'ja',
    'ko',
    'fr',
    'es',
    'ru',
    'de',
    'it',
    'tr',
    'pt_pt',
    'pt_br',
    'vi',
    'id',
    'th',
    'ms',
    'ar',
    'hi',
    'km',
    'mn_cy',
    'nb_no',
    'nn_no',
    'fa',
    'sv',
    'pl',
    'nl',
    'uk',
    'he',
];

// https://flagicons.lipis.dev/
export enum LanguageFlag {
    auto = 'un',
    zh_cn = 'cn',
    zh_tw = 'cn',
    mn_mo = 'cn',
    en = 'gb',
    ja = 'jp',
    ko = 'kr',
    fr = 'fr',
    es = 'es',
    ru = 'ru',
    de = 'de',
    it = 'it',
    tr = 'tr',
    pt_pt = 'pt',
    pt_br = 'br',
    vi = 'vn',
    id = 'id',
    th = 'th',
    ms = 'ms',
    ar = 'ae',
    hi = 'in',
    km = 'kh',
    mn_cy = 'mn',
    nb_no = 'no',
    nn_no = 'no',
    fa = 'ir',
    sv = 'se',
    pl = 'pl',
    nl = 'nl',
    uk = 'ua',
    he = 'il',
}

export enum LanguageDirection {
    auto = 'ltr',
    zh_cn = 'ltr',
    zh_tw = 'ltr',
    mn_mo = 'ltr',
    en = 'ltr',
    ja = 'ltr',
    ko = 'ltr',
    fr = 'ltr',
    es = 'ltr',
    ru = 'ltr',
    de = 'ltr',
    it = 'ltr',
    tr = 'ltr',
    pt_pt = 'ltr',
    pt_br = 'ltr',
    vi = 'ltr',
    id = 'ltr',
    th = 'ltr',
    ms = 'ltr',
    ar = 'rtl',
    hi = 'ltr',
    km = 'ltr',
    mn_cy = 'ltr',
    nb_no = 'ltr',
    nn_no = 'ltr',
    fa = 'rtl',
    sv = 'ltr',
    pl = 'ltr',
    nl = 'ltr',
    uk = 'ltr',
    he = 'rtl',
}

export function resolveLanguageDirection(language: string): LanguageDirection {
    return LanguageDirection[language as keyof typeof LanguageDirection] ?? LanguageDirection.auto;
}

// i18n 语言标识用下划线分隔（zh_cn），React Aria 需要 BCP 47 风格（zh-CN）
export function resolveAriaLocale(language: string): string {
    return (language || 'en').replaceAll('_', '-');
}

export function resolveTargetLanguage(
    sourceLanguage: string,
    targetLanguage: string,
    detectLanguage: string,
    secondLanguage: string
): string {
    if (!secondLanguage) {
        return targetLanguage;
    }
    return sourceLanguage === 'auto' && targetLanguage === detectLanguage ? secondLanguage : targetLanguage;
}
