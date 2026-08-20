import { debug } from '@tauri-apps/plugin-log';

const marks = [];

export function mark(name) {
    marks.push({ name, at: performance.now() });
}

export function flushMarks(label) {
    if (marks.length === 0) {
        return;
    }
    const width = marks.reduce((acc, m) => Math.max(acc, m.name.length), 0);
    let prev = 0;
    const lines = marks.map((m) => {
        const delta = (m.at - prev).toFixed(1).padStart(8);
        const absolute = m.at.toFixed(1).padStart(8);
        prev = m.at;
        return `  ${m.name.padEnd(width)}  +${delta}ms   @${absolute}ms`;
    });
    const total = marks[marks.length - 1].at;
    marks.length = 0;
    void debug(`[perf] ${label}  (total ${total.toFixed(1)}ms since navigation)\n${lines.join('\n')}`);
}
