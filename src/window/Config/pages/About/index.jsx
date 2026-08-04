import { Separator, Button } from '@heroui/react';
import { appLogDir, appConfigDir } from '@tauri-apps/api/path';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import { openPath } from '@tauri-apps/plugin-opener';
import React from 'react';

import { appVersion } from '../../../../utils/env';
import { invoke } from '@tauri-apps/api/core';

export default function About() {
    const { t } = useTranslation();

    return (
        <div className='h-full w-full flex flex-col'>
            <div className='grow-3' />
            <img
                src='icon.png'
                className='mx-auto size-25 mb-1.5'
                draggable={false}
            />
            <div>
                <h1 className='font-bold text-2xl text-center'>Pot</h1>
                <p className='text-center text-sm text-muted mb-5'>{appVersion}</p>
            </div>
            <div className='w-fit mx-auto flex flex-col items-center'>
                <Separator />
                <div className='flex gap-x-4'>
                    <Button
                        variant='tertiary'
                        className='my-1.5'
                        size='sm'
                        onPress={() => {
                            open('https://pot-app.com');
                        }}
                    >
                        {t('config.about.website')}
                    </Button>
                    <Button
                        variant='tertiary'
                        className='my-1.5'
                        size='sm'
                        onPress={() => {
                            open('https://github.com/pot-app/pot-desktop');
                        }}
                    >
                        {t('config.about.github')}
                    </Button>
                    <Button
                        variant='tertiary'
                        className='my-1.5'
                        size='sm'
                        onPress={() => {
                            open('https://github.com/pot-app/pot-desktop/issues');
                        }}
                    >
                        {t('config.about.feedback')}
                    </Button>
                    <Button
                        variant='tertiary'
                        className='my-1.5'
                        size='sm'
                        onPress={() => {
                            open('https://github.com/pot-app/pot-desktop/discussions');
                        }}
                    >
                        {t('config.about.community')}
                    </Button>
                </div>
                <Separator />
            </div>
            <div className='px-5 w-fit mx-auto flex flex-col items-center'>
                <div className='flex gap-x-4'>
                    <Button
                        variant='tertiary'
                        className='my-1.5'
                        size='sm'
                        onPress={() => {
                            invoke('updater_window');
                        }}
                    >
                        {t('config.about.check_update')}
                    </Button>
                    <Button
                        variant='tertiary'
                        className='my-1.5'
                        size='sm'
                        onPress={async () => {
                            const dir = await appLogDir();
                            openPath(dir);
                        }}
                    >
                        {t('config.about.view_log')}
                    </Button>
                    <Button
                        variant='tertiary'
                        className='my-1.5'
                        size='sm'
                        onPress={async () => {
                            const dir = await appConfigDir();
                            openPath(dir);
                        }}
                    >
                        {t('config.about.view_config')}
                    </Button>
                </div>
                <Separator />
            </div>
            <div className='grow-7' />
        </div>
    );
}
