import { useCallback } from 'react';

import { getAudioContext, startBuffer } from '../utils/audio_output';

let source = null;
let sourceKey = null;
let playToken = 0;

function stopCurrent() {
    if (source) {
        source.stop();
        source.disconnect();
        source = null;
        sourceKey = null;
    }
}

export const useVoice = () => {
    // key 标识音频来源：同一来源再次点击表示停止，来源不同则换成新音频继续播放
    // 不区分来源的话，点另一个朗读按钮只会停掉正在播的那条，新音频被丢弃
    const playOrStop = useCallback((data, key = null) => {
        const stopOnly = source !== null && sourceKey === key;
        stopCurrent();
        playToken += 1;
        if (stopOnly) {
            return;
        }
        const token = playToken;
        getAudioContext().decodeAudioData(
            new Uint8Array(data).buffer,
            (buffer) => {
                // 已被后续点击取代，丢弃这次解码结果
                if (token !== playToken) {
                    return;
                }
                const sourceNode = startBuffer(buffer);
                // onended 引用局部 sourceNode：旧音频被 stop() 时其 onended 会延迟派发，
                // 若闭包读共享变量 source，可能误断开之后才播放的新音频
                sourceNode.onended = () => {
                    sourceNode.disconnect();
                    if (source === sourceNode) {
                        source = null;
                        sourceKey = null;
                    }
                };
                source = sourceNode;
                sourceKey = key;
            },
            () => {
                // 解码失败（例如音频数据损坏），让问题可感知
                console.error('TTS audio decode failed');
            }
        );
    }, []);

    return playOrStop;
};
