import i18n from '../../../i18n';
import { fetch } from '@tauri-apps/plugin-http';
import { nanoid } from 'nanoid';
import md5 from 'md5';

export async function translate(text, from, to, options = {}) {
    const { config } = options;

    const { appid, secret, field } = config;

    const url = 'https://fanyi-api.baidu.com/api/trans/vip/fieldtranslate';

    const salt = nanoid();
    if (appid === '' || secret === '') {
        throw i18n.t('services.translate.baidu_field.appid_secret_required');
    }

    const str = appid + text + salt + field + secret;
    const sign = md5(str);

    const query = new URLSearchParams({
        q: text,
        from: from,
        to: to,
        appid: appid,
        salt: salt,
        sign: sign,
        domain: field,
    });

    let res = await fetch(`${url}?${query.toString()}`, {
        method: 'GET',
    });

    if (res.ok) {
        let result = await res.json();
        let target = '';

        const { trans_result } = result;
        if (trans_result) {
            for (let i in trans_result) {
                target = target + trans_result[i]['dst'] + '\n';
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
