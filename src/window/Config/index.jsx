import { useLocation, useRoutes } from 'react-router-dom';
import React, { useEffect } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Card, Separator, Toast } from '@heroui/react';
import { useTranslation } from 'react-i18next';

import WindowControl from '../../components/WindowControl';
import SideBar from './components/SideBar';
import { osType } from '../../utils/env';
import { useConfig } from '../../hooks';
import routes from './routes';
import './style.css';

const appWindow = getCurrentWebviewWindow();

export default function Config() {
    const [transparent] = useConfig('transparent', true);
    const { t } = useTranslation();
    const location = useLocation();
    const page = useRoutes(routes);

    useEffect(() => {
        if (appWindow.label === 'config') {
            appWindow.show();
        }
    }, []);

    return (
        <>
            <Toast.Provider placement='top' />
            <Card
                className={`${
                    transparent ? 'bg-background/90' : 'bg-surface'
                } float-left w-57.5 h-screen rounded-none p-0 gap-0 shadow-none ${
                    osType === 'linux' && 'rounded-l-[10px] border'
                } border-r border-border select-none cursor-default`}
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
            </Card>
            <div
                className={`bg-background ml-57.5 h-screen select-none cursor-default flex flex-col ${
                    osType === 'linux' && 'rounded-r-[10px] border border-l-0 border-border'
                }`}
            >
                <div
                    data-tauri-drag-region='true'
                    className='top-1.25 left-58.75 right-1.25 h-7.5 fixed'
                />
                <div className='h-8.75 flex justify-between'>
                    <div className='flex'>
                        <h2 className='m-auto ml-2.5'>{t(`config.${location.pathname.slice(1)}.title`)}</h2>
                    </div>

                    <div className='flex'>{osType !== 'macos' && <WindowControl />}</div>
                </div>
                <Separator />
                <div className='p-2.5 overflow-y-auto flex-1 min-h-0'>{page}</div>
            </div>
        </>
    );
}
