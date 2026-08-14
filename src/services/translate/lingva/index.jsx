import i18n from '../../../i18n';
import { fetch } from '@tauri-apps/plugin-http';

export async function translate(text, from, to) {
    let plain_text = text.replaceAll('/', '@@');
    let encode_text = encodeURIComponent(plain_text);
    const res = await fetch(`https://lingva.pot-app.com/api/v1/${from}/${to}/${encode_text}`, {
        method: 'GET',
    });

    if (res.ok) {
        let result = await res.json();
        const { translation } = result;
        if (translation) {
            return translation.replaceAll('@@', '/');
        } else {
            throw i18n.t('config.service.service_request_error', { detail: JSON.stringify(result) });
        }
    } else {
        throw i18n.t('config.service.http_request_error', { status: res.status, detail: JSON.stringify(await res.json()) });
    }
}

export * from './Config';
export * from './info';
