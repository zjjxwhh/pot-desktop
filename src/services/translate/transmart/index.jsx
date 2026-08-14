import i18n from '../../../i18n';
import { fetch } from '@tauri-apps/plugin-http';

export async function translate(text, from, to, options = {}) {
    const { config } = options;

    const { username: user, token } = config;

    let header = {};
    if (user !== '' && token !== '') {
        header['user'] = user;
        header['token'] = token;
    }

    const url = 'https://transmart.qq.com/api/imt';

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            header: {
                fn: 'auto_translation',
                ...header,
            },
            type: 'plain',
            source: {
                lang: from,
                text_list: [text],
            },
            target: {
                lang: to,
            },
        }),
    });
    if (res.ok) {
        const result = await res.json();
        if (result['auto_translation']) {
            let target = '';
            for (let line of result['auto_translation']) {
                target += line;
                target += '\n';
            }
            return target.trim();
        } else {
            throw i18n.t('config.service.service_request_error', { detail: JSON.stringify(result) });
        }
    } else {
        throw i18n.t('config.service.http_request_error', { status: res.status, detail: JSON.stringify(await res.json()) });
    }
}

export * from './Config';
export * from './info';
