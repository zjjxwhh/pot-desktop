import { useCallback, useEffect } from 'react';
import { listen, emit } from '@tauri-apps/api/event';
import { useGetState } from './useGetState';
import { store } from '../utils/store';
import { debounce } from '../utils';

export const useConfig = (key, defaultValue, options = {}) => {
    const [property, setPropertyState, getProperty] = useGetState(null);
    // persistDefault：store 中读不到 key 时，是否把默认值写回 store。
    // 默认跟随 sync —— sync:false 的配置（如服务实例配置）只在保存时持久化，
    // 初始化时自然也不该写入。只读取现有配置的场景（如列表项、模态框标题栏图标）
    // 应显式传 persistDefault:false，避免打开界面就产生孤儿 key。
    const { sync = true, persistDefault = sync } = options;

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
                    if (persistDefault) {
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
