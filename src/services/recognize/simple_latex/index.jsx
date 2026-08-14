import i18n from '../../../i18n';
import { readFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';

export async function recognize(base64, language, options = {}) {
    const { config } = options;

    const { token } = config;

    const url = 'https://server.simpletex.cn/api/latex_ocr/v2';

    let file = await readFile('pot_screenshot_cut.png', { baseDir: BaseDirectory.AppCache });

    const form = new FormData();
    form.append('file', new Blob([file], { type: 'image/png' }), 'pot_screenshot_cut.png');

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            token,
        },
        body: form,
    });
    if (res.ok) {
        let result = await res.json();
        if (result['res'] && result['res']['latex']) {
            return result['res']['latex'].trim();
        } else {
            throw i18n.t('config.service.service_request_error', { detail: JSON.stringify(result) });
        }
    } else {
        throw i18n.t('config.service.http_request_error', { status: res.status, detail: JSON.stringify(await res.json()) });
    }
}

export * from './Config';
export * from './info';
