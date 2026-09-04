import { useAtom } from 'jotai';

import { useGetState } from './useGetState';

export const useSyncAtom = (atom) => {
    const [atomValue, setAtomValue] = useAtom(atom);
    const [localValue, setLocalValue, getLocalValue] = useGetState(atomValue);

    const syncAtom = () => setAtomValue(getLocalValue());

    const setBothValue = (value, sync) => {
        setLocalValue(value);
        if (sync) {
            setAtomValue(typeof value === 'function' ? value(getLocalValue()) : value);
        }
    };

    return [localValue, setBothValue, syncAtom];
};
