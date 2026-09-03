import i18n from '../../../i18n';
import { fetch } from '@tauri-apps/plugin-http';
import { Language } from './info';

// Interactions API：Google 官方当前的默认接口
const INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

export async function translate(text, from, to, options = {}) {
    const { config, setResult, detect } = options;

    const { apiKey, stream, promptList } = config;
    const model = (config.model ?? '').trim();
    if (!model) {
        throw i18n.t('services.translate.gemini.invalid_model_empty');
    }

    const items = (promptList ?? []).map((item) => {
        return {
            role: item.role,
            text: item.content
                .replaceAll('$text', text)
                .replaceAll('$from', from)
                .replaceAll('$to', to)
                .replaceAll('$detect', Language[detect]),
        };
    });

    const systemInstruction = items
        .filter((item) => item.role === 'system' && item.text.trim())
        .map((item) => item.text.trim())
        .join('\n\n');
    const inputText = items
        .filter((item) => item.role !== 'system' && item.text.trim())
        .map((item) => item.text.trim())
        .join('\n\n');

    const headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
    };
    const body = {
        model,
        input: inputText,
        store: false,
        stream: stream === true,
        generation_config: { thinking_level: 'minimal' },
    };
    if (systemInstruction) {
        body.system_instruction = systemInstruction;
    }

    if (stream) {
        const res = await fetch(`${INTERACTIONS_ENDPOINT}?alt=sse`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw i18n.t('config.service.http_request_error', { status: res.status, detail: await res.text() });
        }

        let target = '';
        let errorDetail = '';
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const handleEvent = (ev) => {
            if (ev.event_type === 'step.delta') {
                const delta = ev.delta;
                if (delta && delta.type === 'text' && delta.text != null) {
                    target += delta.text;
                    if (setResult) {
                        setResult(target + '_');
                    }
                }
            } else if (
                ev.event_type === 'error' ||
                (ev.event_type === 'interaction.status_update' &&
                    ['failed', 'cancelled'].includes(ev.status ?? ev.interaction?.status))
            ) {
                errorDetail = JSON.stringify(ev);
            }
        };
        try {
            let buffer = '';
            const consumeLine = (line) => {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) {
                    return;
                }
                const payload = trimmed.slice(5).trim();
                if (!payload || payload === '[DONE]') {
                    return;
                }
                try {
                    handleEvent(JSON.parse(payload));
                } catch {
                    // 忽略无法解析的中间块
                }
            };
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
                let newline = buffer.indexOf('\n');
                while (newline !== -1) {
                    consumeLine(buffer.slice(0, newline));
                    buffer = buffer.slice(newline + 1);
                    newline = buffer.indexOf('\n');
                }
            }
            if (buffer.trim()) {
                consumeLine(buffer);
            }
        } finally {
            reader.releaseLock();
        }
        if (errorDetail) {
            throw i18n.t('config.service.service_request_error', { detail: errorDetail });
        }
        if (setResult) {
            setResult(target.trim());
        }
        return target.trim();
    } else {
        const res = await fetch(INTERACTIONS_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw i18n.t('config.service.http_request_error', { status: res.status, detail: await res.text() });
        }
        const result = await res.json();
        const status = result.status;
        if (status && status !== 'completed') {
            throw i18n.t('config.service.service_request_error', { detail: JSON.stringify(result) });
        }
        let target = '';
        for (const step of result.steps ?? []) {
            if (step.type === 'model_output') {
                for (const block of step.content ?? []) {
                    if (block.type === 'text' && block.text) {
                        target += block.text;
                    }
                }
            }
        }
        target = target.trim();
        if (target) {
            if (target.startsWith('"')) {
                target = target.slice(1);
            }
            if (target.endsWith('"')) {
                target = target.slice(0, -1);
            }
            return target.trim();
        }
        throw i18n.t('config.service.service_request_error', { detail: JSON.stringify(result) });
    }
}

export * from './Config';
export * from './info';
