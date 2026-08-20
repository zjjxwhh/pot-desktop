import { arch as archFn, type as osTypeFn, version } from '@tauri-apps/plugin-os';
import { getVersion } from '@tauri-apps/api/app';

export let osType = '';
export let arch = '';
export let osVersion = '';
export let appVersion = '';

export async function initEnv() {
    [osType, arch, osVersion, appVersion] = await Promise.all([
        osTypeFn(),
        archFn(),
        version(),
        getVersion(),
    ]);
}
