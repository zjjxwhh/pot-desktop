import { useTranslation } from 'react-i18next';
import { warn } from '@tauri-apps/plugin-log';
import {
    Dropdown,
    Button,
    TextField,
    Label,
    Input,
    Card,
    useOverlayState,
    toast,
} from '@heroui/react';
import React, { useEffect, useState } from 'react';

import { useConfig } from '../../../../hooks';
import { osType } from '../../../../utils/env';
import * as webdav from './utils/webdav';
import WebDavModal from './WebDavModal';
import * as local from './utils/local';

export default function Backup() {
    const [backupType, setBackupType] = useConfig('backup_type', 'webdav');
    const [davUserName, setDavUserName] = useConfig('webdav_username', '');
    const [davPassword, setDavPassword] = useConfig('webdav_password', '');
    const [davUrl, setDavUrl] = useConfig('webdav_url', '');
    const webdavState = useOverlayState();
    const [uploading, setUploading] = useState(false);
    const { t } = useTranslation();

    // 兼容旧版本：阿里云盘同步已移除，若之前保存的是 aliyun 则回退到 webdav
    useEffect(() => {
        if (backupType === 'aliyun') {
            setBackupType('webdav');
        }
    }, [backupType]);

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
            default:
                warn('Unknown backup type');
                return;
        }
        result.then(
            () => {
                toast.success(t('config.backup.backup_success'));
                setUploading(false);
            },
            (e) => {
                toast.danger(e.toString());
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
                        toast.success(t('config.backup.load_success'));
                    },
                    (e) => {
                        toast.danger(e.toString());
                    }
                );
                break;
            default:
                warn('Unknown backup type');
        }
    };

    return (
        <Card className='mb-2.5'>
            <Card.Content>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.backup.type')}</h3>
                    {backupType !== null && (
                        <Dropdown>
                            <Button variant='tertiary'>{t(`config.backup.${backupType}`)}</Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu
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
                                className='max-w-75'
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
                                className='max-w-75'
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
                                className='max-w-75'
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
        </Card>
    );
}
