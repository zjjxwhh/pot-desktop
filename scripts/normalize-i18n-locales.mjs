import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 以 en_US.json 为唯一字段来源整理各语言文件：已有译文保持不变，缺失字段补空串占位，
// 所有层级的字段按字母序排列。i18n 初始化时设置了 returnEmptyString: false，
// 空串会自动回退到 en，因此占位字段不会在界面上留白。
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localesDir = path.join(projectRoot, 'src', 'i18n', 'locales');
const sourceName = 'en_US.json';
const indent = 4;

const knownFlags = new Set(['--check', '--keep-extra']);
const flags = new Set(process.argv.slice(2));
const unknownFlags = [...flags].filter((flag) => !knownFlags.has(flag));

if (unknownFlags.length > 0) {
    console.error(`[i18n] 无法识别的参数：${unknownFlags.join(' ')}`);
    console.error(`[i18n] 可用参数：${[...knownFlags].join(' ')}`);
    process.exit(2);
}

const checkOnly = flags.has('--check');
const keepExtra = flags.has('--keep-extra');

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

        // 只有 --keep-extra 时才会走到这里：en_US 中已不存在的字段原样保留
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
const sourceRaw = await readFile(path.join(localesDir, sourceName), 'utf8');
const source = JSON.parse(sourceRaw);
const sortedSource = merge(source, source, '', { added: [], removed: [], conflicts: [], untranslated: [] });

const changed = [];

for (const file of files) {
    const filePath = path.join(localesDir, file);
    const raw = file === sourceName ? sourceRaw : await readFile(filePath, 'utf8');
    const stats = { added: [], removed: [], conflicts: [], untranslated: [] };
    const output = file === sourceName ? sortedSource : merge(sortedSource, JSON.parse(raw), '', stats);
    const content = serialize(output);
    const isDirty = content !== raw;

    if (isDirty) {
        changed.push(file);
        if (!checkOnly) {
            await writeFile(filePath, content);
        }
    }

    const summary = file === sourceName ? '源文件' : describe(stats);
    console.log(`[i18n] ${file.padEnd(12)} ${isDirty ? '✓' : '·'} ${summary}`);

    for (const keyPath of stats.conflicts) {
        console.log(`[i18n]   ! 结构与 en_US 不一致，已按源重建：${keyPath}`);
    }
    for (const keyPath of stats.removed) {
        console.log(`[i18n]   - 源中已不存在，已移除：${keyPath}`);
    }
}

if (checkOnly && changed.length > 0) {
    console.error(`[i18n] 以下文件需要整理：${changed.join(' ')}`);
    console.error('[i18n] 执行 pnpm i18n:sync 后重新提交');
    process.exit(1);
}

console.log(
    changed.length > 0
        ? `[i18n] ${checkOnly ? '待更新' : '已更新'} ${changed.length} 个文件`
        : '[i18n] 所有语言文件已同步'
);
