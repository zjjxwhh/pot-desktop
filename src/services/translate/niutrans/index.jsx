import i18n from '../../../i18n';
import { fetch } from '@tauri-apps/plugin-http';

export async function translate(text, from, to, options = {}) {
    const { config } = options;

    const { https, apikey } = config;

    const url = `${https ? 'https' : 'http'}://api.niutrans.com/NiuTransServer/translation`;

    let res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: from,
            to: to,
            apikey: apikey,
            src_text: text,
        }),
    });

    // 返回翻译结果
    if (res.ok) {
        let result = await res.json();
        if (result && result['tgt_text']) {
            return result['tgt_text'].trim();
        } else {
            throw i18n.t('config.service.service_request_error', { detail: JSON.stringify(result) });
        }
    } else {
        throw i18n.t('config.service.http_request_error', { status: res.status, detail: JSON.stringify(await res.json()) });
    }
}

export * from './Config';
export * from './info';
