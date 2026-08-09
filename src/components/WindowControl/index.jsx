import { IconX, IconMinimize, IconMaximize, IconMinus } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { listen } from '@tauri-apps/api/event';
import { Button } from '@heroui/react';

import { osType } from '../../utils/env';
import './style.css';

const appWindow = getCurrentWebviewWindow();

export default function WindowControl() {
    const [isMax, setIsMax] = useState(false);

    useEffect(() => {
        listen('tauri://resize', async () => {
            if (await appWindow.isMaximized()) {
                setIsMax(true);
            } else {
                setIsMax(false);
            }
        });
    }, []);

    return (
        <div>
            <Button
                isIconOnly
                variant='ghost'
                className='w-8.75 h-8.75 rounded-none'
                onPress={() => appWindow.minimize()}
            >
                <IconMinus />
            </Button>
            <Button
                isIconOnly
                variant='ghost'
                className='w-8.75 h-8.75 rounded-none'
                onPress={() => {
                    if (isMax) {
                        appWindow.unmaximize();
                    } else {
                        appWindow.maximize();
                    }
                }}
            >
                {isMax ? <IconMinimize /> : <IconMaximize />}
            </Button>
            <Button
                isIconOnly
                variant='ghost'
                className={`w-8.75 h-8.75 rounded-none window-close-button ${osType === 'linux' && 'rounded-tr-[10px]'}`}
                onPress={() => appWindow.close()}
            >
                <IconX />
            </Button>
        </div>
    );
}
