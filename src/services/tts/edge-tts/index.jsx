import i18n from '../../../i18n';
import WebSocket from '@tauri-apps/plugin-websocket';
import { v4 as uuidv4 } from 'uuid';
import SHA256 from 'crypto-js/sha256';

import { getDefaultVoice } from './voices';
import { getEdgeTtsVersion } from '../../../utils/edge_tts_version';
import { Language } from './info';

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const SYNTHESIS_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';

// 服务端只接受当前在用的 Edge 版本：Sec-MS-GEC-Version 与 User-Agent 必须同时是该版本，
// 否则握手直接返回 403。版本号由 edge_tts_version 模块在启动时从 Edge 更新接口动态获取，
// 避免硬编码版本被微软下线后失效。
const WSS_HEADERS = {
    Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    'Accept-Language': 'en-US,en;q=0.9',
};

// 1601-01-01 到 1970-01-01 的秒数差，用于换算 Windows FileTime
const WIN_EPOCH = 11644473600n;
// 服务端对单次请求的合成时长有 10 分钟上限（音频恰好截断在 3600000 字节 @48kbps），
// 超出会以 1007 关闭连接。这里按约 3~4 分钟音频的正文量分片，留足余量：
// 3000 字节约合 1000 个汉字或 3000 个英文字符。
const MAX_CHUNK_BYTES = 3000;
// 空闲超时：只要还在持续收到数据就不算超时，避免长文本合成被中途掐断
const IDLE_TIMEOUT = 20000;

const SPEECH_CONFIG = JSON.stringify({
    context: {
        synthesis: {
            audio: {
                metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
                outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
            },
        },
    },
});

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 服务端要求的鉴权参数：把当前时间向下取整到 5 分钟的 FileTime 与 token 拼接后取 SHA256。
// 数值超出 Number 安全整数范围，必须用 BigInt 计算，否则末尾精度丢失会导致校验失败。
function generateSecMsGec() {
    let ticks = BigInt(Math.floor(Date.now() / 1000)) + WIN_EPOCH;
    ticks -= ticks % 300n;
    ticks *= 10000000n;
    return SHA256(`${ticks}${TRUSTED_CLIENT_TOKEN}`).toString().toUpperCase();
}

function connectId() {
    return uuidv4().replaceAll('-', '');
}

// 服务端期望的时间戳格式，等价于 JS 在 UTC 时区下的 Date.toString()
function timestamp() {
    const now = new Date();
    const pad = (value) => `${value}`.padStart(2, '0');
    return (
        `${WEEKDAYS[now.getUTCDay()]} ${MONTHS[now.getUTCMonth()]} ${pad(now.getUTCDate())} ${now.getUTCFullYear()} ` +
        `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} ` +
        `GMT+0000 (Coordinated Universal Time)`
    );
}

// 选定音色：优先取用户为该语言配置的音色，否则回退到该语言的默认音色
function resolveVoice(lang, config) {
    const custom = (config?.voiceConfig ?? []).find((item) => item?.voice && Language[item?.language] === lang);
    return custom?.voice ?? getDefaultVoice(lang);
}

function buildSSML(voice, text) {
    // 音色名形如 en-GB-SoniaNeural，前两段即其区域标识
    const locale = voice.split('-').slice(0, 2).join('-');
    const escaped = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return (
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${locale}'>` +
        `<voice name='${voice}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escaped}</prosody></voice></speak>`
    );
}

// 按字节预算切分长文本：先在标点/空白处断开，单段仍超限时再按字符硬切
function splitText(text, maxBytes) {
    const encoder = new TextEncoder();
    if (encoder.encode(text).length <= maxBytes) {
        return [text];
    }

    const pieces = text.match(/[^\s。．！？!?;；]*[\s。．！？!?;；]*/g)?.filter(Boolean) ?? [text];
    const chunks = [];
    let current = '';
    let currentBytes = 0;

    const flush = () => {
        if (current !== '') {
            chunks.push(current);
            current = '';
            currentBytes = 0;
        }
    };

    for (const piece of pieces) {
        const pieceBytes = encoder.encode(piece).length;
        if (pieceBytes > maxBytes) {
            flush();
            for (const char of piece) {
                const charBytes = encoder.encode(char).length;
                if (currentBytes + charBytes > maxBytes) {
                    flush();
                }
                current += char;
                currentBytes += charBytes;
            }
            continue;
        }
        if (currentBytes + pieceBytes > maxBytes) {
            flush();
        }
        current += piece;
        currentBytes += pieceBytes;
    }
    flush();

    return chunks;
}

function mergeAudio(parts) {
    const audio = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
    let offset = 0;
    for (const part of parts) {
        audio.set(part, offset);
        offset += part.length;
    }
    return audio;
}

// 依次把各段 SSML 发往同一条连接，收齐音频后合并返回。
// 二进制帧结构为：2 字节大端头长度 + 头部文本 + 音频数据。
async function synthesize(ssmlList) {
    // 动态获取当前有效的 Edge 版本：User-Agent 与 Sec-MS-GEC-Version 必须与该版本一致，
    // 版本号从内存缓存/持久化缓存读取，几乎无开销
    const fullVersion = await getEdgeTtsVersion();
    const majorVersion = fullVersion.split('.')[0];

    const url =
        `${SYNTHESIS_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
        `&Sec-MS-GEC=${generateSecMsGec()}&Sec-MS-GEC-Version=1-${fullVersion}&ConnectionId=${connectId()}`;

    // WebView 无法为 WebSocket 自定义请求头，因此连接走 Rust 侧的 websocket 插件，
    // 这样才能带上服务端要求的 Edge User-Agent。
    const headers = {
        ...WSS_HEADERS,
        'User-Agent':
            `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ` +
            `Chrome/${majorVersion}.0.0.0 Safari/537.36 Edg/${majorVersion}.0.0.0`,
    };

    const socket = await WebSocket.connect(url, { headers });

    try {
        return await new Promise((resolve, reject) => {
            const parts = [];
            let index = 0;
            let settled = false;
            let unlisten = () => {};
            let timer = null;

            const settle = (action, value) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                unlisten();
                action(value);
            };
            const resetIdleTimer = () => {
                clearTimeout(timer);
                timer = setTimeout(() => settle(reject, i18n.t('services.tts.edge_tts.request_timeout')), IDLE_TIMEOUT);
            };
            resetIdleTimer();

            const sendCurrent = () =>
                socket.send(
                    `X-RequestId:${connectId()}\r\nContent-Type:application/ssml+xml\r\n` +
                        `X-Timestamp:${timestamp()}Z\r\nPath:ssml\r\n\r\n${ssmlList[index]}`
                );

            unlisten = socket.addListener((message) => {
                resetIdleTimer();
                if (message.type === 'Text') {
                    if (!message.data.includes('Path:turn.end')) {
                        return;
                    }
                    index += 1;
                    if (index < ssmlList.length) {
                        sendCurrent().catch((e) => settle(reject, e));
                    } else if (parts.length === 0) {
                        settle(reject, i18n.t('services.tts.edge_tts.no_audio_data'));
                    } else {
                        settle(resolve, mergeAudio(parts));
                    }
                    return;
                }
                if (message.type === 'Binary') {
                    const frame = Uint8Array.from(message.data);
                    const headerLength = (frame[0] << 8) | frame[1];
                    const header = new TextDecoder().decode(frame.subarray(2, 2 + headerLength));
                    if (header.includes('Path:audio')) {
                        parts.push(frame.subarray(2 + headerLength));
                    }
                    return;
                }
                if (message.type === 'Close') {
                    settle(
                        reject,
                        i18n.t('services.tts.edge_tts.connection_closed', { detail: `${message.data?.code ?? ''} ${message.data?.reason ?? ''}`.trim() })
                    );
                }
            });

            socket
                .send(
                    `X-Timestamp:${timestamp()}\r\nContent-Type:application/json; charset=utf-8\r\n` +
                        `Path:speech.config\r\n\r\n${SPEECH_CONFIG}`
                )
                .then(sendCurrent)
                .catch((e) => settle(reject, e));
        });
    } finally {
        await socket.disconnect().catch(() => {});
    }
}

export async function tts(text, lang, options = {}) {
    const { config } = options;

    const voice = resolveVoice(lang, config);
    if (!voice) {
        throw i18n.t('services.tts.edge_tts.unsupported_language', { lang });
    }
    // 去掉 XML 不接受的控制字符，避免服务端直接断开连接
    const content = text.replace(/\p{Cc}/gu, ' ').trim();
    if (content === '') {
        throw i18n.t('services.tts.edge_tts.text_empty');
    }

    return await synthesize(splitText(content, MAX_CHUNK_BYTES).map((chunk) => buildSSML(voice, chunk)));
}

export * from './Config';
export * from './voices';
export * from './info';
