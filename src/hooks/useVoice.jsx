import { useCallback } from 'react';
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let source = null;

export const useVoice = () => {
    const playOrStop = useCallback((data) => {
        if (source) {
            // 如果正在播放，停止播放
            source.stop();
            source.disconnect();
            source = null;
        } else {
            // 如果没在播放，开始播放
            audioContext.decodeAudioData(new Uint8Array(data).buffer, (buffer) => {
                const sourceNode = audioContext.createBufferSource();
                sourceNode.buffer = buffer;
                sourceNode.connect(audioContext.destination);
                // onended 引用局部 sourceNode：旧音频被 stop() 时其 onended 会延迟派发，
                // 若闭包读共享变量 source，可能误断开之后才播放的新音频
                sourceNode.onended = () => {
                    sourceNode.disconnect();
                    if (source === sourceNode) {
                        source = null;
                    }
                };
                sourceNode.start();
                source = sourceNode;
            });
        }
    });

    return playOrStop;
};
