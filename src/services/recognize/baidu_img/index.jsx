import i18n from '../../../i18n';
import { readFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { nanoid } from 'nanoid';
import md5 from 'md5';

export async function recognize(base64, language, options = {}) {
    const { config } = options;

    const { appid, secret } = config;

    const url = 'https://fanyi-api.baidu.com/api/trans/sdk/picture';

    const salt = nanoid();
    if (appid === '' || secret === '') {
        throw i18n.t('services.recognize.baidu_img_ocr.appid_secret_required');
    }

    let file = await readFile('pot_screenshot_cut.png', { baseDir: BaseDirectory.AppCache });
    const str = appid + md5(file) + salt + 'APICUIDmac' + secret;
    const sign = md5(str);

    const form = new FormData();
    form.append('image', new Blob([file], { type: 'image/png' }), 'pot_screenshot_cut.png');
    form.append('from', 'auto');
    form.append('to', language === 'auto' ? 'zh' : language);
    form.append('appid', appid);
    form.append('salt', salt);
    form.append('cuid', 'APICUID');
    form.append('mac', 'mac');
    form.append('version', '3');
    form.append('sign', sign);

    let res = await fetch(url, {
        method: 'POST',
        body: form,
    });

    if (res.ok) {
        let result = await res.json();
        if (result['data'] && result['data']['sumSrc'] && result['data']['sumDst']) {
            if (language === 'auto') {
                return result['data']['sumSrc'].trim();
            } else {
                return result['data']['sumDst'].trim();
            }
        } else {
            throw i18n.t('config.service.service_request_error', { detail: JSON.stringify(result) });
        }
    } else {
        throw i18n.t('config.service.http_request_error', { status: res.status, detail: JSON.stringify(await res.json()) });
    }
}

export * from './Config';
export * from './info';
