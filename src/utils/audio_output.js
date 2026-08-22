// 全应用共用同一个 AudioContext：每新建一个都要重新等一次音频输出设备打开，
// 而那正是首次播放开头被吞的来源
let audioContext = null;

export function getAudioContext() {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    return audioContext;
}

// 提前推一帧静音，把音频输出设备先打开。设备并不是在构造 AudioContext 时打开的，
// 而是等到真正有音频要渲染时才打开，这段耗时会吃掉音频开头的一截
export function warmUpAudioOutput() {
    const context = getAudioContext();
    // 自动播放策略会让 context 停在 suspended，不 resume 则设备不会打开。
    // 尚无用户手势时 resume 会被拒，忽略即可，下次调用会再试
    context.resume().catch(() => {});
    // 时长取 0.2 秒这个量级：太短（例如 1 个 sample）可能在设备真正打开前就渲染完
    const silence = context.createBufferSource();
    silence.buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.2), context.sampleRate);
    silence.connect(context.destination);
    silence.onended = () => silence.disconnect();
    silence.start();
}

// 播放一段已解码的音频，返回创建出的 source 节点，由调用方自行管理停止/替换
export function startBuffer(buffer) {
    const context = getAudioContext();
    const sourceNode = context.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.connect(context.destination);
    sourceNode.start();
    return sourceNode;
}

// 应用加载时先热一次。此时通常还没有用户手势、resume 可能被拒，
// 那就等后续每次调用重试
warmUpAudioOutput();
