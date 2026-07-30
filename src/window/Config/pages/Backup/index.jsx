import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { warn } from '@tauri-apps/plugin-log';
import {
    Dropdown,
    Button,
    TextField,
    Label,
    Input,
    Card,
    Avatar,
    Tooltip,
    useOverlayState,
} from '@heroui/react';
import React, { useEffect, useState } from 'react';

import { useConfig, useToastStyle } from '../../../../hooks';
import { osType } from '../../../../utils/env';
import * as webdav from './utils/webdav';
import WebDavModal from './WebDavModal';
import AliyunModal from './AliyunModal';
import * as local from './utils/local';
import * as aliyun from './utils/aliyun';

let refreshTimer = null;

export default function Backup() {
    const [backupType, setBackupType] = useConfig('backup_type', 'webdav');
    const [davUserName, setDavUserName] = useConfig('webdav_username', '');
    const [davPassword, setDavPassword] = useConfig('webdav_password', '');
    const [davUrl, setDavUrl] = useConfig('webdav_url', '');
    const [aliyunQrCodeUrl, setAliyunQrCodeUrl] = useState('');
    const [aliyunUserInfo, setAliyunUserInfo] = useState(null);
    const [aliyunAccessToken, setAliyunAccessToken] = useConfig('aliyun_access_token', '');
    // const [aliyunRefreshToken, setAliyunRefreshToken] = useConfig('aliyun_refresh_token', '');
    const webdavState = useOverlayState();
    const aliyunState = useOverlayState();
    const [uploading, setUploading] = useState(false);
    const toastStyle = useToastStyle();
    const { t } = useTranslation();

    const onBackup = async () => {
        setUploading(true);
        const time = new Date();
        const fileName = `${osType}-${time.getFullYear()}-${
            time.getMonth() + 1
        }-${time.getDate()}-${time.getHours()}-${time.getMinutes()}-${time.getSeconds()}`;

        let result;
        switch (backupType) {
            case 'webdav':
                result = webdav.backup(davUrl, davUserName, davPassword, fileName + '.zip');
                break;
            case 'local':
                result = local.backup(fileName);
                break;
            case 'aliyun':
                if (aliyunAccessToken === '') {
                    toast.error(t('config.backup.aliyun_login_first'), { style: toastStyle });
                    setUploading(false);
                } else {
                    result = aliyun.backup(aliyunAccessToken, fileName + '.zip');
                }
                break;
            default:
                warn('Unknown backup type');
                return;
        }
        result.then(
            () => {
                toast.success(t('config.backup.backup_success'), { style: toastStyle });
                setUploading(false);
            },
            (e) => {
                toast.error(e.toString(), { style: toastStyle });
                setUploading(false);
            }
        );
    };

    const onBackupListOpen = () => {
        switch (backupType) {
            case 'webdav':
                webdavState.open();
                break;
            case 'local':
                local.get().then(
                    () => {
                        toast.success(t('config.backup.load_success'), { style: toastStyle });
                    },
                    (e) => {
                        toast.error(e.toString(), { style: toastStyle });
                    }
                );
                break;
            case 'aliyun':
                if (aliyunAccessToken === '') {
                    toast.error(t('config.backup.aliyun_login_first'), { style: toastStyle });
                } else {
                    aliyunState.open();
                }

                break;
            default:
                warn('Unknown backup type');
        }
    };

    const pollingStatus = async (sid) => {
        refreshTimer = setInterval(async () => {
            try {
                const { status, code } = await aliyun.status(sid);
                switch (status) {
                    case 'QRCodeExpired': {
                        refreshQrCode();
                        break;
                    }
                    case 'LoginSuccess': {
                        clearInterval(refreshTimer);
                        toast.success(t('config.backup.login_success'), { style: toastStyle });
                        const token = await aliyun.accessToken(code);
                        setAliyunAccessToken(token);
                        await refreshUserInfo(token);
                        break;
                    }
                }
            } catch (e) {
                toast.error(e.toString(), { style: toastStyle });
                refreshQrCode();
            }
        }, 2000);
    };

    const refreshQrCode = async () => {
        try {
            const { url, sid } = await aliyun.qrcode();
            setAliyunQrCodeUrl(url);
            if (refreshTimer) {
                clearInterval(refreshTimer);
            }
            pollingStatus(sid);
        } catch (e) {
            setAliyunQrCodeUrl('');
            toast.error(e.toString(), { style: toastStyle });
        }
    };

    const refreshUserInfo = async (token) => {
        try {
            const info = await aliyun.userInfo(token);
            setAliyunQrCodeUrl('');
            setAliyunUserInfo(info);
        } catch (e) {
            toast.error(e.toString(), { style: toastStyle });
            setAliyunAccessToken('');
            refreshQrCode();
        }
    };

    useEffect(() => {
        if (backupType === null || backupType !== 'aliyun') return;
        if (aliyunAccessToken === '') {
            refreshQrCode();
        } else {
            refreshUserInfo(aliyunAccessToken);
        }

        return () => {
            clearInterval(refreshTimer);
        };
    }, [backupType]);

    return (
        <Card className='mb-[10px]'>
            <Toaster />
            <Card.Content>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.backup.type')}</h3>
                    {backupType !== null && (
                        <Dropdown>
                            <Button variant='tertiary'>{t(`config.backup.${backupType}`)}</Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu
                                    aria-label='backup type'
                                    onAction={(key) => {
                                        setBackupType(key);
                                    }}
                                >
                                    <Dropdown.Item
                                        id='webdav'
                                        textValue={t('config.backup.webdav')}
                                    >
                                        <Label>{t('config.backup.webdav')}</Label>
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        id='aliyun'
                                        textValue={t('config.backup.aliyun')}
                                    >
                                        <Label>{t('config.backup.aliyun')}</Label>
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        id='local'
                                        textValue={t('config.backup.local')}
                                    >
                                        <Label>{t('config.backup.local')}</Label>
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>
                    )}
                </div>
                <div className={backupType !== 'webdav' ? 'hidden' : ''}>
                    <div className='config-item'>
                        <h3 className='my-auto'>{t('config.backup.webdav_url')}</h3>
                        {davUrl !== null && (
                            <TextField
                                value={davUrl}
                                onChange={(v) => {
                                    setDavUrl(v);
                                }}
                                className='max-w-[300px]'
                            >
                                <Input
                                    variant='secondary'
                                    placeholder={t('config.backup.webdav_url')}
                                />
                            </TextField>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3 className='my-auto'>{t('config.backup.username')}</h3>
                        {davUserName !== null && (
                            <TextField
                                value={davUserName}
                                onChange={(v) => {
                                    setDavUserName(v);
                                }}
                                className='max-w-[300px]'
                            >
                                <Input
                                    variant='secondary'
                                    placeholder={t('config.backup.username')}
                                />
                            </TextField>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3 className='my-auto'>{t('config.backup.password')}</h3>
                        {davPassword !== null && (
                            <TextField
                                value={davPassword}
                                onChange={(v) => {
                                    setDavPassword(v);
                                }}
                                className='max-w-[300px]'
                            >
                                <Input
                                    type='password'
                                    variant='secondary'
                                    placeholder={t('config.backup.password')}
                                />
                            </TextField>
                        )}
                    </div>
                </div>
                <div className={`flex justify-center ${backupType !== 'aliyun' ? 'hidden' : ''}`}>
                    <img
                        src={aliyunQrCodeUrl}
                        className={`h-[200px] mb-2 ${aliyunQrCodeUrl === '' ? 'hidden' : ''}`}
                    />
                </div>
                <div className={`config-item ${backupType !== 'aliyun' ? 'hidden' : ''}`}>
                    {aliyunUserInfo !== null && (
                        <>
                            <h3 className='my-auto'>{t('config.backup.username')}</h3>
                            <Tooltip>
                                <Button
                                    variant='tertiary'
                                    onPress={() => {
                                        setAliyunAccessToken('');
                                        // setAliyunRefreshToken('');
                                        setAliyunUserInfo(null);
                                        refreshQrCode();
                                    }}
                                >
                                    <Avatar
                                        src={aliyunUserInfo.avatar}
                                        size='sm'
                                    />
                                    <h3 className='my-auto'>{aliyunUserInfo.name}</h3>
                                </Button>
                                <Tooltip.Content placement='bottom'>
                                    <p>{t('config.backup.logout')}</p>
                                </Tooltip.Content>
                            </Tooltip>
                        </>
                    )}
                </div>
                <div className='flex justify-around'>
                    <Button
                        variant='primary'
                        isPending={uploading}
                        onPress={onBackup}
                    >
                        {t('config.backup.backup')}
                    </Button>
                    <Button
                        variant='tertiary'
                        onPress={onBackupListOpen}
                    >
                        {t('config.backup.restore')}
                    </Button>
                </div>
            </Card.Content>
            <WebDavModal
                state={webdavState}
                url={davUrl}
                username={davUserName}
                password={davPassword}
            />
            <AliyunModal
                state={aliyunState}
                accessToken={aliyunAccessToken}
                // refreshToken={aliyunRefreshToken}
            />
        </Card>
    );
}
