import React from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Dropdown, Button, Switch, Surface, TextField, Label, Input, InputGroup, toast } from '@heroui/react';

import { useConfig } from '../../../../hooks/useConfig';

export default function Advanced() {
    const [logLevel, setLogLevel] = useConfig('log_level', 'info');
    const [proxyEnable, setProxyEnable] = useConfig('proxy_enable', false);
    const [proxyHost, setProxyHost] = useConfig('proxy_host', '');
    const [proxyPort, setProxyPort] = useConfig('proxy_port', '');
    const [proxyUsername, setProxyUsername] = useConfig('proxy_username', '');
    const [proxyPassword, setProxyPassword] = useConfig('proxy_password', '');
    const [noProxy, setNoProxy] = useConfig('no_proxy', 'localhost,127.0.0.1');
    const [devMode, setDevMode] = useConfig('dev_mode', false);
    const { t } = useTranslation();

    return (
        <>
            <Surface className='flex flex-1 flex-col p-4 shadow-surface rounded-[min(32px,var(--radius-3xl))]'>
                <div className='config-item'>
                    <h3>{t('config.advanced.proxy.title')}</h3>
                    {proxyEnable !== null && (
                        <Switch
                            size='lg'
                            isSelected={proxyEnable}
                            onChange={async (v) => {
                                if (v) {
                                    if (proxyHost === '' || proxyPort === '') {
                                        setProxyEnable(false);
                                        toast.danger(t('config.advanced.proxy_error'));
                                        return;
                                    } else {
                                        setProxyEnable(v);
                                    }
                                } else {
                                    setProxyEnable(v);
                                }
                                toast.success(t('config.advanced.proxy_change'));
                            }}
                        >
                            <Switch.Content>
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                            </Switch.Content>
                        </Switch>
                    )}
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.advanced.proxy.host')}</h3>
                    {proxyHost !== null && (
                        <TextField
                            value={proxyHost}
                            onChange={(v) => {
                                setProxyHost(v);
                            }}
                            isRequired
                            className='w-[40%]'
                        >
                            <InputGroup
                                variant='secondary'
                                fullWidth
                            >
                                <InputGroup.Prefix>
                                    <span>http://</span>
                                </InputGroup.Prefix>
                                <InputGroup.Input
                                    className='min-w-0'
                                    type='url'
                                />
                            </InputGroup>
                        </TextField>
                    )}
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.advanced.proxy.port')}</h3>
                    {proxyPort !== null && (
                        <TextField
                            value={proxyPort}
                            onChange={(v) => {
                                if (parseInt(v) > 65535) {
                                    setProxyPort(65535);
                                } else if (parseInt(v) < 0) {
                                    setProxyPort('');
                                } else {
                                    setProxyPort(parseInt(v));
                                }
                            }}
                            isRequired
                            className='w-[40%]'
                        >
                            <Input
                                type='number'
                                variant='secondary'
                                fullWidth
                            />
                        </TextField>
                    )}
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.advanced.proxy.username')}</h3>
                    {proxyUsername !== null && (
                        <TextField
                            value={proxyUsername}
                            onChange={(v) => {
                                setProxyUsername(v);
                            }}
                            isDisabled
                            className='w-[40%]'
                        >
                            <Input
                                type='text'
                                variant='secondary'
                                fullWidth
                            />
                        </TextField>
                    )}
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.advanced.proxy.password')}</h3>
                    {proxyPassword !== null && (
                        <TextField
                            value={proxyPassword}
                            onChange={(v) => {
                                setProxyPassword(v);
                            }}
                            isDisabled
                            className='w-[40%]'
                        >
                            <Input
                                type='password'
                                variant='secondary'
                                fullWidth
                            />
                        </TextField>
                    )}
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.advanced.proxy.no_proxy')}</h3>
                    {noProxy !== null && (
                        <TextField
                            value={noProxy}
                            onChange={(v) => {
                                setNoProxy(v);
                            }}
                            className='w-[40%]'
                        >
                            <Input
                                variant='secondary'
                                fullWidth
                            />
                        </TextField>
                    )}
                </div>
            </Surface>
            <Surface className='mt-2.5 flex flex-1 flex-col p-4 shadow-surface rounded-[min(32px,var(--radius-3xl))]'>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.advanced.log_level.title')}</h3>
                    {logLevel !== null && (
                        <Dropdown>
                            <Button variant='tertiary'>{t(`config.advanced.log_level.${logLevel}`)}</Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu
                                    onAction={(key) => {
                                        setLogLevel(key);
                                        invoke('set_log_level', { level: key });
                                    }}
                                >
                                    <Dropdown.Item
                                        id='error'
                                        textValue={t('config.advanced.log_level.error')}
                                    >
                                        <Label>{t('config.advanced.log_level.error')}</Label>
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        id='warn'
                                        textValue={t('config.advanced.log_level.warn')}
                                    >
                                        <Label>{t('config.advanced.log_level.warn')}</Label>
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        id='info'
                                        textValue={t('config.advanced.log_level.info')}
                                    >
                                        <Label>{t('config.advanced.log_level.info')}</Label>
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        id='debug'
                                        textValue={t('config.advanced.log_level.debug')}
                                    >
                                        <Label>{t('config.advanced.log_level.debug')}</Label>
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        id='trace'
                                        textValue={t('config.advanced.log_level.trace')}
                                    >
                                        <Label>{t('config.advanced.log_level.trace')}</Label>
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown>
                    )}
                </div>
                <div className='config-item'>
                    <h3>{t('config.advanced.dev_mode')}</h3>
                    {devMode !== null && (
                        <Switch
                            size='lg'
                            isSelected={devMode}
                            onChange={(v) => {
                                setDevMode(v);
                            }}
                        >
                            <Switch.Content>
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                            </Switch.Content>
                        </Switch>
                    )}
                </div>
            </Surface>
        </>
    );
}
