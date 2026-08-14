import i18n from '../../../i18n';
import { fetch } from '@tauri-apps/plugin-http';

export async function translate(text, _from, _to) {
    const res = await fetch(`https://pot-app.com/api/dict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });

    if (res.ok) {
        let result = await res.json();
        return result;
    } else {
        throw i18n.t('config.service.http_request_error', { status: res.status, detail: JSON.stringify(await res.json()) });
    }
}

export * from './Config';
export * from './info';
