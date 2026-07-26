import { fetch } from '@tauri-apps/plugin-http';

export async function recognize(base64, language, options = {}) {
    const { config } = options;

    const { client_id, client_secret } = config;

    const url = 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic';
    const token_url = 'https://aip.baidubce.com/oauth/2.0/token';

    const tokenQuery = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
    }).toString();
    const token_res = await fetch(`${token_url}?${tokenQuery}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    if (token_res.ok) {
        const tokenData = await token_res.json();
        if (tokenData.access_token) {
            let token = tokenData.access_token;

            const queryParams = new URLSearchParams({
                access_token: token,
            });
            const res = await fetch(`${url}?${queryParams.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    language_type: language,
                    detect_direction: 'false',
                    image: base64,
                }).toString(),
            });
            if (res.ok) {
                let result = await res.json();
                if (result['words_result']) {
                    let target = '';
                    for (let i of result['words_result']) {
                        target += i['words'] + '\n';
                    }
                    return target.trim();
                } else {
                    throw JSON.stringify(result);
                }
            } else {
                throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(await res.json())}`;
            }
        } else {
            throw 'Get Access Token Failed!';
        }
    } else {
        throw `Http Request Error\nHttp Status: ${token_res.status}\n${JSON.stringify(await token_res.json())}`;
    }
}

export * from './Config';
export * from './info';
