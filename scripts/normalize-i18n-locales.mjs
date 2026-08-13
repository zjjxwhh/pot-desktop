import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 语言文件整理脚本，三种模式互斥（不指定时默认 --sync）：
//   --check  以基准语言为基准检查各语言文件：缺失字段、多余字段、顺序不对都算差异，只报告不写入，有差异时退出码为 1
//   --sync   以基准语言为唯一字段来源整理各语言文件：缺失字段补空串占位、多余字段移除、所有层级字段按字母序排列
//   --format 仅将字段按字母序重排，不改动任何字段内容
//   --keep-extra  整理时保留目标语言中基准不存在的字段（默认移除，仅对 --check / --sync 生效）
// 空串占位依赖 i18n 的 returnEmptyString: false（空串自动回退到 fallback 语言），因此不会在界面上留白。
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localesDir = path.join(projectRoot, 'src', 'i18n', 'locales');
const indent = 4;

const MODE_FLAGS = ['--check', '--sync', '--format'];

function usage() {
    console.error('用法：node scripts/normalize-i18n-locales.mjs [--check | --sync | --format] [选项]');
    console.error('');
    console.error('  --check          检查语言文件是否与基准语言一致（不写入，有差异时退出码为 1）');
    console.error('  --sync           补全语言文件缺失的字段（默认模式，会写入）');
    console.error('  --format         仅按字母序排列字段（会写入）');
    console.error('  --base <语言>    以该语言文件为字段基准（仅 --check / --sync 有效，默认 en_US）');
    console.error('  --langs <列表>   指定要处理的语言，逗号分隔（默认处理全部语言）');
    console.error('  --lang <列表>    --langs 的别名');
    console.error('  --keep-extra     保留目标语言中基准不存在的字段（仅 --check / --sync 有效，默认移除）');
}

const args = process.argv.slice(2);
let mode = null;
let baseName = 'en_US';
let keepExtra = false;
const targetNames = [];

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (MODE_FLAGS.includes(arg)) {
        if (mode) {
            console.error(`[i18n] 参数冲突：${mode} 与 ${arg} 不能同时使用`);
            usage();
            process.exit(2);
        }
        mode = arg;
        continue;
    }
    if (arg === '--keep-extra') {
        keepExtra = true;
        continue;
    }
    if (arg === '--base') {
        baseName = args[i + 1];
        if (!baseName || baseName.startsWith('--')) {
            console.error('[i18n] --base 需要指定语言名，例如 --base zh_CN');
            usage();
            process.exit(2);
        }
        i++;
        continue;
    }
    if (arg === '--langs' || arg === '--lang') {
        const values = [];
        while (i + 1 < args.length && !args[i + 1].startsWith('--')) {
            i++;
            values.push(...args[i].split(','));
        }
        const clean = values.filter((value) => value !== '');
        if (clean.length === 0) {
            console.error('[i18n] --langs 需要指定至少一种语言，例如 --langs zh_CN,ja_JP');
            usage();
            process.exit(2);
        }
        targetNames.push(...clean);
        continue;
    }
    console.error(`[i18n] 无法识别的参数：${arg}`);
    usage();
    process.exit(2);
}

if (!mode) {
    mode = '--sync';
}

if (keepExtra && mode === '--format') {
    console.warn('[i18n] 提示：--keep-extra 仅对 --check / --sync 生效，--format 模式下忽略');
}

// 字段均为小写字母、数字和下划线，按 code point 排序即字母序，
// 且不依赖运行环境的 ICU 排序规则，结果稳定可复现。
const byKey = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function leafPaths(value, prefix) {
    if (!isPlainObject(value)) {
        return [prefix];
    }
    return Object.entries(value).flatMap(([key, child]) => leafPaths(child, `${prefix}.${key}`));
}

// 以 source 的字段结构为准，将 target 的译文并入：缺失字段补空串、多余字段移除（--keep-extra 时保留）、
// 所有层级按键名排序。source 与 target 是同一对象时得到一份按字母序排列的副本。
function merge(source, target, prefix, stats) {
    const current = isPlainObject(target) ? target : {};
    const keys = Object.keys(source);

    for (const key of Object.keys(current)) {
        if (key in source) {
            continue;
        }
        const keyPath = prefix ? `${prefix}.${key}` : key;
        if (keepExtra) {
            keys.push(key);
        } else {
            stats.removed.push(...leafPaths(current[key], keyPath));
        }
    }

    const result = {};

    for (const key of keys.sort(byKey)) {
        const keyPath = prefix ? `${prefix}.${key}` : key;
        const sourceValue = source[key];
        const targetValue = current[key];

        // 只有 --keep-extra 时才会走到这里：基准中已不存在的字段原样保留（嵌套对象递归排序）
        if (!(key in source)) {
            result[key] = isPlainObject(targetValue) ? merge(targetValue, targetValue, keyPath, stats) : targetValue;
            continue;
        }

        if (isPlainObject(sourceValue)) {
            // 源是分组而目标是译文（或反之）时以源为准，冲突的旧值丢弃并单独提示
            if (key in current && !isPlainObject(targetValue)) {
                stats.conflicts.push(keyPath);
            }
            result[key] = merge(sourceValue, targetValue, keyPath, stats);
            continue;
        }

        if (typeof targetValue === 'string') {
            result[key] = targetValue;
            if (targetValue === '') {
                stats.untranslated.push(keyPath);
            }
            continue;
        }

        if (key in current) {
            stats.conflicts.push(keyPath);
        }
        result[key] = '';
        stats.added.push(keyPath);
    }

    return result;
}

// 仅重排键顺序，不改动任何值（--format 模式用）。
function sortKeys(value) {
    if (!isPlainObject(value)) {
        return value;
    }
    const result = {};
    for (const key of Object.keys(value).sort(byKey)) {
        result[key] = sortKeys(value[key]);
    }
    return result;
}

const emptyStats = () => ({ added: [], removed: [], conflicts: [], untranslated: [] });

function serialize(value) {
    return `${JSON.stringify(value, null, indent)}\n`;
}

function describe(stats) {
    const parts = [];
    if (stats.added.length > 0) {
        parts.push(`新增 ${stats.added.length}`);
    }
    if (stats.removed.length > 0) {
        parts.push(`移除 ${stats.removed.length}`);
    }
    if (stats.conflicts.length > 0) {
        parts.push(`结构冲突 ${stats.conflicts.length}`);
    }
    const untranslated = stats.added.length + stats.untranslated.length;
    if (untranslated > 0) {
        parts.push(`待翻译 ${untranslated}`);
    }
    return parts.length > 0 ? parts.join('，') : '已是最新';
}

const files = (await readdir(localesDir)).filter((file) => file.endsWith('.json')).sort(byKey);

const baseFile = `${baseName}.json`;
if (!files.includes(baseFile)) {
    console.error(`[i18n] 基准语言文件不存在：${baseFile}`);
    process.exit(2);
}

let targets = files;
if (targetNames.length > 0) {
    targets = targetNames.map((name) => `${name}.json`);
    for (const file of targets) {
        if (!files.includes(file)) {
            console.error(`[i18n] 语言文件不存在：${file}`);
            process.exit(2);
        }
    }
    targets = [...new Set(targets)].sort(byKey);
}

const baseRaw = await readFile(path.join(localesDir, baseFile), 'utf8');
const baseData = JSON.parse(baseRaw);
const sortedBase = merge(baseData, baseData, '', emptyStats());

const changed = [];

for (const file of targets) {
    const filePath = path.join(localesDir, file);
    const raw = await readFile(filePath, 'utf8');
    const stats = emptyStats();
    let output;

    if (mode === '--format') {
        output = sortKeys(JSON.parse(raw));
    } else if (file === baseFile) {
        output = sortedBase;
    } else {
        output = merge(sortedBase, JSON.parse(raw), '', stats);
    }

    const content = serialize(output);
    const isDirty = content !== raw;

    if (isDirty) {
        changed.push(file);
        if (mode !== '--check') {
            await writeFile(filePath, content);
        }
    }

    let summary;
    if (mode === '--format') {
        summary = isDirty ? '已按字母序排列' : '已是最新';
    } else if (file === baseFile) {
        summary = '源文件';
    } else if (isDirty && stats.added.length === 0 && stats.removed.length === 0 && stats.conflicts.length === 0) {
        summary = '仅顺序变化';
    } else {
        summary = describe(stats);
    }
    console.log(`[i18n] ${file.padEnd(12)} ${isDirty ? '✓' : '·'} ${summary}`);

    for (const keyPath of stats.conflicts) {
        console.log(`[i18n]   ! 结构与基准 ${baseFile} 不一致，已按基准重建：${keyPath}`);
    }
    for (const keyPath of stats.removed) {
        console.log(`[i18n]   - 基准中已不存在，已移除：${keyPath}`);
    }
}

if (mode === '--check' && changed.length > 0) {
    console.error(`[i18n] 以下文件与基准 ${baseFile} 不一致：${changed.join(' ')}`);
    const syncArgs = [];
    if (baseName !== 'en_US') {
        syncArgs.push(`--base ${baseName}`);
    }
    if (targetNames.length > 0) {
        syncArgs.push(`--langs ${targetNames.join(',')}`);
    }
    console.error(
        syncArgs.length > 0
            ? `[i18n] 执行 node scripts/normalize-i18n-locales.mjs --sync ${syncArgs.join(' ')} 后重新提交`
            : '[i18n] 执行 pnpm i18n:sync 后重新提交'
    );
    process.exit(1);
}

console.log(
    changed.length > 0
        ? `[i18n] 已更新 ${changed.length} 个文件`
        : `[i18n] ${targetNames.length > 0 ? '所选语言文件已同步' : '所有语言文件已同步'}`
);
