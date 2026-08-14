import i18n from '../../../i18n';
import { fetch } from '@tauri-apps/plugin-http';

export async function translate(text, from, to, options = {}) {
    const { config } = options;

    const { token } = config;

    const url = 'https://api.interpreter.caiyunai.com/v1/translator';

    if (token === '') {
        throw i18n.t('services.translate.caiyun.token_required');
    }

    const body = {
        source: [text],
        trans_type: `${from}2${to}`,
        request_id: 'demo',
        detect: true,
    };

    const headers = {
        'content-type': 'application/json',
        'x-authorization': 'token ' + token,
    };

    let res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
    });

    if (res.ok) {
        let result = await res.json();
        const { target } = result;
        if (target[0]) {
            return target[0];
        } else {
            throw i18n.t('config.service.service_request_error', { detail: JSON.stringify(result) });
        }
    } else {
        throw i18n.t('config.service.http_request_error', { status: res.status, detail: JSON.stringify(await res.json()) });
    }
}

export * from './Config';
export * from './info';
