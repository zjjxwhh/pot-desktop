import { useLocation, useRoutes } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Surface, Separator, Toast } from '@heroui/react';
import { useTranslation } from 'react-i18next';

import WindowControl from '../../components/WindowControl';
import SideBar from './components/SideBar';
import { osType } from '../../utils/env';
import { mark, flushMarks } from '../../utils/perf';
import { useConfig } from '../../hooks';
import routes from './routes';
import './style.css';

const appWindow = getCurrentWebviewWindow();

let firstRenderMarked = false;

export default function Config() {
    if (!firstRenderMarked) {
        firstRenderMarked = true;
        mark('Config first render');
    }

    const [transparent] = useConfig('transparent', true);
    const [appTheme] = useConfig('app_theme', 'system');
    const { t } = useTranslation();
    const location = useLocation();
    const page = useRoutes(routes);
    const revealed = useRef(false);

    useEffect(() => {
        mark('Config subtree mounted');
    }, []);

    useEffect(() => {
        if (appWindow.label !== 'config' || revealed.current) return;
        if (transparent === null || appTheme === null) return;
        mark('appearance config ready');
        revealed.current = true;
        requestAnimationFrame(() => {
            requestAnimationFrame(async () => {
                mark('two frames painted');
                await appWindow.show();
                mark('appWindow.show() resolved');
                await appWindow.setFocus();
                mark('appWindow.setFocus() resolved');
                flushMarks('config window reveal');
            });
        });
    }, [transparent, appTheme]);

    return (
        <>
            <Toast.Provider placement='top' />
            <div className='flex h-screen'>
                <Surface
                    className={`flex flex-col ${
                        transparent ? 'bg-background/90' : 'bg-surface'
                    } w-57.5 shrink-0 h-screen rounded-none p-0 gap-0 shadow-none ${
                        osType === 'linux' && 'rounded-s-[10px] border'
                    } border-e border-border select-none cursor-default`}
                >
                    <div className='h-8.75 p-1.25'>
                        <div
                            className='w-full h-full'
                            data-tauri-drag-region='true'
                        />
                    </div>
                    <div className='p-1.25'>
                        <div data-tauri-drag-region='true'>
                            <img
                                src='icon.svg'
                                className='h-15 w-15 m-auto mb-7.5'
                                draggable={false}
                            />
                        </div>
                    </div>
                    <SideBar />
                </Surface>
                <div
                    className={`bg-background flex-1 min-w-0 h-screen select-none cursor-default flex flex-col ${
                        osType === 'linux' && 'rounded-e-[10px] border border-s-0 border-border'
                    }`}
                >
                    <div
                        data-tauri-drag-region='true'
                        className='top-1.25 start-58.75 end-1.25 h-7.5 fixed'
                    />
                    <div className='h-8.75 flex justify-between'>
                        <div className='flex'>
                            <h2 className='m-auto ms-2.5'>{t(`config.${location.pathname.slice(1)}.title`)}</h2>
                        </div>

                        <div className='flex'>{osType !== 'macos' && <WindowControl />}</div>
                    </div>
                    <Separator />
                    <div className='p-2.5 overflow-y-auto flex-1 min-h-0'>{page}</div>
                </div>
            </div>
        </>
    );
}
