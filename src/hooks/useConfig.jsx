import { useCallback, useEffect } from 'react';
import { listen, emit } from '@tauri-apps/api/event';
import { useGetState } from './useGetState';
import { store } from '../utils/store';
import { debounce } from '../utils';

export const useConfig = (key, defaultValue, options = {}) => {
    const [property, setPropertyState, getProperty] = useGetState(null);
    const { sync = true } = options;

    // 同步到Store (State -> Store)
    const syncToStore = useCallback(
        debounce((v) => {
            store.set(key, v);
            store.save();
            let eventKey = key.replaceAll('.', '_').replaceAll('@', ':');
            emit(`${eventKey}_changed`, v);
        }),
        []
    );

    // 同步到State (Store -> State)
    const syncToState = useCallback((v) => {
        if (v !== null) {
            setPropertyState(v);
        } else {
            store.get(key).then((v) => {
                if (v === null || v === undefined) {
                    setPropertyState(defaultValue);
                    // 默认值仅在必要时才写入 store，避免打开配置模态框就持久化默认值，
                    // 取消后残留孤儿 key：
                    // - sync:false 的配置（如服务实例配置）只在保存时持久化
                    // - 空对象默认值（如模态框只读图标用的 useConfig(key, {})）无需写入
                    if (
                        sync &&
                        !(
                            defaultValue !== null &&
                            typeof defaultValue === 'object' &&
                            !Array.isArray(defaultValue) &&
                            Object.keys(defaultValue).length === 0
                        )
                    ) {
                        store.set(key, defaultValue);
                        store.save();
                    }
                } else {
                    setPropertyState(v);
                }
            });
        }
    }, []);

    const setProperty = useCallback((v, forceSync = false) => {
        setPropertyState(v);
        const isSync = forceSync || sync;
        isSync && syncToStore(v);
    }, []);

    // 初始化
    useEffect(() => {
        syncToState(null);
        const eventKey = key.replaceAll('.', '_').replaceAll('@', ':');
        const unlisten = listen(`${eventKey}_changed`, (e) => {
            syncToState(e.payload);
        });
        return () => {
            unlisten.then((f) => {
                f();
            });
        };
    }, []);

    return [property, setProperty, getProperty];
};

export const deleteKey = async (key) => {
    if (await store.has(key)) {
        await store.delete(key);
        await store.save();
    }
};
