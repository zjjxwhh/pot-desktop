import i18n from '../../../i18n';
import { fetch } from '@tauri-apps/plugin-http';
import { v4 as uuidv4 } from 'uuid';

export async function translate(text, from, to) {
    const url = 'https://translate.yandex.net/api/v1/tr.json/translate';
    const query = new URLSearchParams({
        id: uuidv4().replaceAll('-', '') + '-0-0',
        srv: 'android',
    });
    const res = await fetch(`${url}?${query.toString()}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            source_lang: from,
            target_lang: to,
            text,
        }).toString(),
    });
    if (res.ok) {
        const result = await res.json();
        if (result.text) {
            return result.text[0];
        } else {
            throw i18n.t('config.service.service_request_error', { detail: JSON.stringify(result) });
        }
    } else {
        throw i18n.t('config.service.http_request_error', { status: res.status, detail: JSON.stringify(await res.json()) });
    }
}

export * from './Config';
export * from './info';
