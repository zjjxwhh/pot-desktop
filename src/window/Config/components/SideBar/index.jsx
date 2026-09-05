import { useNavigate, useLocation } from 'react-router-dom';
import {
    IconAdjustmentsHorizontal,
    IconCloudUpload,
    IconHistory,
    IconInfoSquareRounded,
    IconKeyboard,
    IconLanguage,
    IconScanTraces,
    IconSettings,
    IconPuzzle,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@heroui/react';
import React from 'react';

export default function SideBar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    function setStyle(pathname) {
        return location.pathname.includes(pathname) ? 'tertiary' : 'ghost';
    }

    return (
        <div className='mx-3 overflow-y-auto'>
            <Button
                fullWidth
                size='lg'
                variant={setStyle('/general')}
                className='mb-1.25'
                onPress={() => {
                    navigate('/general');
                }}
            >
                <IconSettings className={'size-5'} />
                <div className='w-full'>{t('config.general.label')}</div>
            </Button>
            <Button
                fullWidth
                size='lg'
                variant={setStyle('/translate')}
                className='mb-1.25'
                onPress={() => {
                    navigate('/translate');
                }}
            >
                <IconLanguage className={'size-5'} />
                <div className='w-full'>{t('config.translate.label')}</div>
            </Button>
            <Button
                fullWidth
                size='lg'
                variant={setStyle('/recognize')}
                className='mb-1.25'
                onPress={() => {
                    navigate('/recognize');
                }}
            >
                <IconScanTraces className={'size-5'} />
                <div className='w-full'>{t('config.recognize.label')}</div>
            </Button>
            <Button
                fullWidth
                size='lg'
                variant={setStyle('/hotkey')}
                className='mb-1.25'
                onPress={() => {
                    navigate('/hotkey');
                }}
            >
                <IconKeyboard className={'size-5'} />
                <div className='w-full'>{t('config.hotkey.label')}</div>
            </Button>
            <Button
                fullWidth
                size='lg'
                variant={setStyle('/service')}
                className='mb-1.25'
                onPress={() => {
                    navigate('/service');
                }}
            >
                <IconPuzzle className={'size-5'} />
                <div className='w-full'>{t('config.service.label')}</div>
            </Button>
            <Button
                fullWidth
                size='lg'
                variant={setStyle('/history')}
                className='mb-1.25'
                onPress={() => {
                    navigate('/history');
                }}
            >
                <IconHistory className={'size-5'} />
                <div className='w-full'>{t('config.history.label')}</div>
            </Button>
            <Button
                fullWidth
                size='lg'
                variant={setStyle('/backup')}
                className='mb-1.25'
                onPress={() => {
                    navigate('/backup');
                }}
            >
                <IconCloudUpload className={'size-5'} />
                <div className='w-full'>{t('config.backup.label')}</div>
            </Button>
            <Button
                fullWidth
                size='lg'
                variant={setStyle('/advanced')}
                className='mb-1.25'
                onPress={() => {
                    navigate('/advanced');
                }}
            >
                <IconAdjustmentsHorizontal className={'size-5'} />
                <div className='w-full'>{t('config.advanced.label')}</div>
            </Button>
            <Button
                fullWidth
                size='lg'
                variant={setStyle('/about')}
                className='mb-1.25'
                onPress={() => {
                    navigate('/about');
                }}
            >
                <IconInfoSquareRounded className={'size-5'} />
                <div className='w-full'>{t('config.about.label')}</div>
            </Button>
        </div>
    );
}
