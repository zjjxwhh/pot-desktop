import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// tesseract.js 的 worker 与 WASM core 需要随包一起分发，否则运行时会回退到 unpkg CDN，
// 桌面端离线不可用。这两个文件与已安装的 tesseract.js 版本绑定，升级后必须同步替换。
const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(projectRoot, 'public');
const tesseractDir = path.dirname(require.resolve('tesseract.js/package.json'));

const assets = [
    {
        name: 'worker.min.js',
        source: path.join(tesseractDir, 'dist', 'worker.min.js'),
    },
    {
        name: 'tesseract-core-simd-lstm.wasm.js',
        // core 是 tesseract.js 的依赖而非本项目直接依赖，需从 tesseract.js 所在目录解析，
        // 以保证拿到的版本与其匹配。
        source: require.resolve('tesseract.js-core/tesseract-core-simd-lstm.wasm.js', { paths: [tesseractDir] }),
    },
];

async function sha256(file) {
    return createHash('sha256')
        .update(await readFile(file))
        .digest('hex');
}

let updated = 0;

for (const asset of assets) {
    const target = path.join(publicDir, asset.name);
    const sourceHash = await sha256(asset.source);
    const targetHash = await sha256(target).catch(() => null);

    if (sourceHash === targetHash) {
        continue;
    }

    await copyFile(asset.source, target);
    console.log(`[tesseract] synced public/${asset.name}`);
    updated += 1;
}

if (updated === 0) {
    console.log('[tesseract] assets already in sync');
}
