import i18n from '../../../i18n';
import { fetch } from '@tauri-apps/plugin-http';

export async function tts(text, lang, options = {}) {
    const { config } = options;
    let requestPath = config['requestPath'];

    if (!requestPath) {
        throw i18n.t('services.tts.lingva_tts.request_path_required');
    }

    if (!requestPath.startsWith('http')) {
        requestPath = 'https://' + requestPath;
    }
    const res = await fetch(`${requestPath}/api/v1/audio/${lang}/${encodeURIComponent(text)}`);

    if (res.ok) {
        const result = await res.json();
        return result['audio'];
    }
}

export * from './Config';
export * from './info';
