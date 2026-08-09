import { Card, Button, Tooltip } from '@heroui/react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import React, { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { IconCopy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { atom, useAtom } from 'jotai';

import { useConfig } from '../../../hooks';

const appWindow = getCurrentWebviewWindow();

export const base64Atom = atom('');
let unlisten = null;

export default function ImageArea() {
    const [hideWindow] = useConfig('recognize_hide_window', false);
    const [base64, setBase64] = useAtom(base64Atom);
    const imgRef = useRef();
    const { t } = useTranslation();
    const load_img = () => {
        invoke('get_base64').then((v) => {
            setBase64(v);
            if (hideWindow) {
                appWindow.hide();
            } else {
                appWindow.show();
                appWindow.setFocus(true);
            }
        });
    };

    useEffect(() => {
        if (hideWindow !== null) {
            load_img();
            if (unlisten) {
                unlisten.then((f) => {
                    f();
                });
            }
            unlisten = listen('new_image', (_) => {
                load_img();
            });
        }
    }, [hideWindow]);

    return (
        <Card className='bg-surface h-full ml-3 mr-1.5'>
            <Card.Content className='bg-surface h-full p-0'>
                {base64 !== '' && (
                    <img
                        ref={imgRef}
                        draggable={false}
                        className='object-contain h-full w-full'
                        src={'data:image/png;base64,' + base64}
                    />
                )}
            </Card.Content>
            <Card.Footer className='bg-surface flex justify-start'>
                <Tooltip>
                    <Button
                        isIconOnly
                        size='sm'
                        variant='tertiary'
                        onPress={async () => {
                            await invoke('copy_img', {
                                width: imgRef.current.naturalWidth,
                                height: imgRef.current.naturalHeight,
                            });
                        }}
                    >
                        <IconCopy />
                    </Button>
                    <Tooltip.Content>
                        <p>{t('recognize.copy_img')}</p>
                    </Tooltip.Content>
                </Tooltip>
            </Card.Footer>
        </Card>
    );
}
