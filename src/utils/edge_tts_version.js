import { fetch } from '@tauri-apps/plugin-http';
import { store } from './store';

const EDGE_UPDATE_API = 'https://edgeupdates.microsoft.com/api/products';
const STORE_KEY = 'edge_tts_chromium_version';
const FALLBACK_VERSION = '151.0.4129.78';
const FETCH_TIMEOUT_MS = 10_000;

// 获取 Windows x64 Stable 版本并持久化
export async function initEdgeTtsVersion() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(EDGE_UPDATE_API, { signal: controller.signal });
            if (!res.ok) {
                throw `Http Status: ${res.status}`;
            }
            const products = await res.json();
            const stable = products.find((product) => product.Product === 'Stable');
            const windowsRelease = stable?.Releases?.find(
                (release) => release.Platform === 'Windows' && release.Architecture === 'x64'
            );
            const version = windowsRelease?.ProductVersion;
            if (!version) {
                throw 'No Windows x64 Stable version found';
            }
            store.set(STORE_KEY, version);
            await store.save();
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (e) {
        console.warn('Failed to fetch Edge version, use persisted value or fallback:', e);
    }
}

// 读取当前应使用的版本：持久化的值优先，没有则用兜底版本
export async function getEdgeTtsVersion() {
    const cached_version = await store.get(STORE_KEY);
    if (typeof cached_version === 'string' && cached_version) {
        return cached_version;
    }
    return FALLBACK_VERSION;
}
