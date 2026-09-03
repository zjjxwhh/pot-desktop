import i18n from '../../../i18n';
import { Language } from './info';
import { fetch } from '@tauri-apps/plugin-http';

export async function translate(text, from, to, options = {}) {
    const { config, setResult, detect } = options;

    let { model, apiKey, promptList } = config;

    promptList = promptList
        .filter((item) => !(item.role === 'system' && !item.content.trim()))
        .map((item) => {
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
        model: model,
        messages: promptList,
        stream: true,
        thinking: {
            type: "disabled",
        }
    };

    let result = '';
    try {
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw i18n.t('config.service.http_request_error', { status: response.status, detail: await response.text() });
        }

        let buffer = '';
        // Function to process the stream data
        const processChatStream = async (reader, decoder) => {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Convert binary data to string
                buffer += decoder.decode(value, { stream: true });
                
                // Process complete events
                const boundary = buffer.lastIndexOf('\n\n');
                if (boundary !== -1) {
                    const event = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);
                    const chunks = event.split('\n\n');
                    
                    for (const chunk of chunks) {
                        const text = chunk.replace(/^data:/, '').trim();
                        if (text === '[DONE]') {
                            continue;
                        }
                        const data = JSON.parse(text);
                        result += data.choices[0].delta.content;
                        if (setResult) {
                            setResult(result + '_');
                        }
                    }
                }
            }
        };

        await processChatStream(response.body.getReader(), new TextDecoder());
    } catch (error) {
        return Promise.reject(error);
    }
    
    return result;
}

export * from './Config';
export * from './info';
