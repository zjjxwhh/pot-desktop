import { appCacheDir, appConfigDir, join } from '@tauri-apps/api/path';
import { readFile, readTextFile } from '@tauri-apps/plugin-fs';
import { fetch as tauriHttpFetch } from '@tauri-apps/plugin-http';
import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';
import CryptoJS from 'crypto-js';
import { osType } from './env';

// External .potext plugins were written against Tauri 1's osType values, so map
// the Tauri 2 value back at this boundary to keep them working. Internal app
// code uses the raw Tauri 2 value ('windows' | 'macos' | 'linux').
const legacyOsTypeMap = {
    windows: 'Windows_NT',
    macos: 'Darwin',
    linux: 'Linux',
};

// ==== Tauri 1.x compatible HTTP layer (for external .potext plugins) ====
// External plugins expect the Tauri 1 `http.fetch` signature (Body.json/text/form,
// query, responseType) and the `{ ok, status, data, headers, url }` response shape.
// This wrapper reproduces that on top of the Tauri 2 plugin-http fetch.

export const ResponseType = { JSON: 1, Text: 2, Binary: 3 };

export class Body {
    constructor(type, payload) {
        this.type = type;
        this.payload = payload;
    }
    static json(data) {
        return new Body('Json', data);
    }
    static text(value) {
        return new Body('Text', value);
    }
    static form(data) {
        return new Body('Form', data);
    }
    static bytes(bytes) {
        return new Body('Bytes', bytes);
    }
}

function findHeader(headers, name) {
    const lower = name.toLowerCase();
    for (const key in headers) {
        if (key.toLowerCase() === lower) {
            return key;
        }
    }
    return null;
}

function buildBody(rawBody, headers) {
    if (rawBody === undefined || rawBody === null) {
        return undefined;
    }
    // Normalize both `Body.xxx()` instances and raw `{ type, payload }` objects
    const type = rawBody.type;
    const payload = 'payload' in rawBody ? rawBody.payload : undefined;

    switch (type) {
        case 'Json':
        case 'json': {
            if (!findHeader(headers, 'content-type')) {
                headers['Content-Type'] = 'application/json';
            }
            return JSON.stringify(payload);
        }
        case 'Text':
        case 'text':
            return payload;
        case 'Bytes':
        case 'bytes':
            return payload instanceof Uint8Array ? payload : new Uint8Array(payload);
        case 'Form':
        case 'form': {
            const ctKey = findHeader(headers, 'content-type');
            const ct = ctKey ? headers[ctKey] : '';
            if (ct && ct.includes('x-www-form-urlencoded')) {
                const usp = new URLSearchParams();
                for (const k in payload) {
                    usp.append(k, payload[k]);
                }
                return usp.toString();
            }
            // multipart/form-data — let the runtime set the boundary
            const fd = new FormData();
            for (const k in payload) {
                const v = payload[k];
                if (v && typeof v === 'object' && 'file' in v) {
                    const bytes = v.file instanceof Uint8Array ? v.file : new Uint8Array(v.file);
                    const blob = new Blob([bytes], { type: v.mime || 'application/octet-stream' });
                    fd.append(k, blob, v.fileName || 'file');
                } else {
                    fd.append(k, v);
                }
            }
            if (ctKey) {
                delete headers[ctKey];
            }
            return fd;
        }
        default:
            // Not a Body wrapper — pass through (string / FormData / etc.)
            return rawBody;
    }
}

export async function tauriFetch(url, options = {}) {
    const { method = 'GET', headers = {}, query, body, responseType = ResponseType.JSON } = options;

    let finalUrl = url;
    if (query) {
        const usp = new URLSearchParams();
        for (const k in query) {
            usp.append(k, query[k]);
        }
        const qs = usp.toString();
        if (qs) {
            finalUrl += (url.includes('?') ? '&' : '?') + qs;
        }
    }

    const finalHeaders = { ...headers };
    const finalBody = buildBody(body, finalHeaders);

    const res = await tauriHttpFetch(finalUrl, {
        method,
        headers: finalHeaders,
        body: finalBody,
    });

    let data;
    if (responseType === ResponseType.Text) {
        data = await res.text();
    } else if (responseType === ResponseType.Binary) {
        data = new Uint8Array(await res.arrayBuffer());
    } else {
        const text = await res.text();
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    const respHeaders = {};
    res.headers.forEach((value, key) => {
        respHeaders[key] = value;
    });

    return {
        url: res.url,
        status: res.status,
        ok: res.ok,
        headers: respHeaders,
        data,
    };
}

const http = {
    fetch: tauriFetch,
    Body,
    ResponseType,
};

export async function invoke_plugin(pluginType, pluginName) {
    let configDir = await appConfigDir();
    let cacheDir = await appCacheDir();
    let pluginDir = await join(configDir, 'plugins', pluginType, pluginName);
    let entryFile = await join(pluginDir, 'main.js');
    let script = await readTextFile(entryFile);
    async function run(cmdName, args) {
        return await invoke('run_binary', {
            pluginType,
            pluginName,
            cmdName,
            args,
        });
    }
    const utils = {
        tauriFetch,
        http,
        readBinaryFile: readFile,
        readTextFile,
        Database,
        CryptoJS,
        run,
        cacheDir, // String
        pluginDir, // String
        osType: legacyOsTypeMap[osType] ?? osType, // "Windows_NT", "Darwin", "Linux"
    };
    return [eval(`${script} ${pluginType}`), utils];
}
