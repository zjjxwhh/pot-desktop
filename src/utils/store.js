import { LazyStore } from '@tauri-apps/plugin-store';
import { appConfigDir, join } from '@tauri-apps/api/path';
import { watch } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';

export let store = new LazyStore('config.json');
let appConfigPath = null;

export async function initStore() {
    const appConfigDirPath = await appConfigDir();
    appConfigPath = await join(appConfigDirPath, 'config.json');
    store = new LazyStore(appConfigPath);
}

export async function watchStore() {
    if (appConfigPath === null) {
        throw new Error('watchStore() must be called after initStore()');
    }
    await watch(appConfigPath, async () => {
        await store.reload();
        await invoke('reload_store');
    });
}
