import i18n from '../../../i18n';
import { fetch } from '@tauri-apps/plugin-http';
import { Language } from './info';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';

export async function translate(text, from, to, options) {
    const { config, setResult, detect } = options;

    let { model, apiKey, stream, promptList, requestArguments } = config;

    promptList = promptList.map((item) => {
        return {
            ...item,
            content: item.content
                .replaceAll('$text', text)
                .replaceAll('$from', from)
                .replaceAll('$to', to)
                .replaceAll('$detect', Language[detect]),
        };
    });

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
    };
    const body = {
        ...JSON.parse(requestArguments),
        stream: stream,
        messages: promptList,
        model: model,
        thinking: {
            type: 'disabled',
        },
    };
    if (stream) {
        const res = await fetch(DEEPSEEK_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
        });
        if (res.ok) {
            let target = '';
            const reader = res.body.getReader();
            try {
                let temp = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        setResult(target.trim());
                        return target.trim();
                    }
                    const str = new TextDecoder().decode(value);
                    let datas = str.split('data:');
                    for (let data of datas) {
                        if (data.trim() !== '' && data.trim() !== '[DONE]') {
                            try {
                                if (temp !== '') {
                                    data = temp + data.trim();
                                    let result = JSON.parse(data.trim());
                                    if (result.choices[0].delta.content) {
                                        target += result.choices[0].delta.content;
                                        if (setResult) {
                                            setResult(target + '_');
                                        } else {
                                            return '[STREAM]';
                                        }
                                    }
                                    temp = '';
                                } else {
                                    let result = JSON.parse(data.trim());
                                    if (result.choices[0].delta.content) {
                                        target += result.choices[0].delta.content;
                                        if (setResult) {
                                            setResult(target + '_');
                                        } else {
                                            return '[STREAM]';
                                        }
                                    }
                                }
                            } catch {
                                temp = data.trim();
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } else {
            throw i18n.t('config.service.http_request_error', { status: res.status, detail: JSON.stringify(await res.json()) });
        }
    } else {
        let res = await fetch(DEEPSEEK_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
        });
        if (res.ok) {
            let result = await res.json();
            const { choices } = result;
            if (choices) {
                let target = choices[0].message.content.trim();
                if (target) {
                    if (target.startsWith('"')) {
                        target = target.slice(1);
                    }
                    if (target.endsWith('"')) {
                        target = target.slice(0, -1);
                    }
                    return target.trim();
                } else {
                    throw JSON.stringify(choices);
                }
            } else {
                throw i18n.t('config.service.service_request_error', { detail: JSON.stringify(result) });
            }
        } else {
            throw i18n.t('config.service.http_request_error', { status: res.status, detail: JSON.stringify(await res.json()) });
        }
    }
}

export * from './Config';
export * from './info';
