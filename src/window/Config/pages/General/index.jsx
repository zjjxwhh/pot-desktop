import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { info } from '@tauri-apps/plugin-log';
import 'flag-icons/css/flag-icons.min.css';
import { invoke } from '@tauri-apps/api/core';
import { useTheme } from 'next-themes';
import {
    Dropdown,
    Button,
    Switch,
    Card,
    TextField,
    Label,
    Input,
    InputGroup,
    toast,
} from '@heroui/react';

import { useConfig } from '../../../../hooks/useConfig';
import { LanguageFlag } from '../../../../utils/language';
import { osType } from '../../../../utils/env';

let timer = null;

export default function General() {
    const [autoStart, setAutoStart] = useState(null);
    const [fontList, setFontList] = useState(null);
    const [checkUpdate, setCheckUpdate] = useConfig('check_update', true);
    const [serverPort, setServerPort] = useConfig('server_port', 60828);
    const [appLanguage, setAppLanguage] = useConfig('app_language', 'en');
    const [appTheme, setAppTheme] = useConfig('app_theme', 'system');
    const [appFont, setAppFont] = useConfig('app_font', 'default');
    const [appFallbackFont, setAppFallbackFont] = useConfig('app_fallback_font', 'default');
    const [appFontSize, setAppFontSize] = useConfig('app_font_size', 16);
    const [transparent, setTransparent] = useConfig('transparent', true);
    const [devMode, setDevMode] = useConfig('dev_mode', false);
    const [trayClickEvent, setTrayClickEvent] = useConfig('tray_click_event', 'config');
    const [proxyEnable, setProxyEnable] = useConfig('proxy_enable', false);
    const [proxyHost, setProxyHost] = useConfig('proxy_host', '');
    const [proxyPort, setProxyPort] = useConfig('proxy_port', '');
    const [proxyUsername, setProxyUsername] = useConfig('proxy_username', '');
    const [proxyPassword, setProxyPassword] = useConfig('proxy_password', '');
    const [noProxy, setNoProxy] = useConfig('no_proxy', 'localhost,127.0.0.1');
    const { t, i18n } = useTranslation();
    const { setTheme } = useTheme();

    const languageName = {
        zh_cn: '简体中文',
        zh_tw: '繁體中文',
        en: 'English',
        ja: '日本語',
        ko: '한국어',
        fr: 'Français',
        es: 'Español',
        ru: 'Русский',
        de: 'Deutsch',
        it: 'Italiano',
        tr: 'Türkçe',
        pt_pt: 'Português',
        pt_br: 'Português (Brasil)',
        nb_no: 'Norsk Bokmål',
        nn_no: 'Norsk Nynorsk',
        fa: 'فارسی',
        uk: 'Українська',
        ar: 'العربية',
        he: 'עִבְרִית',
    };

    useEffect(() => {
        isEnabled().then((v) => {
            setAutoStart(v);
        });
        invoke('font_list').then((v) => {
            setFontList(v);
        });
    }, []);

    return (
        <>
            <Card className='mb-2.5'>
                <Card.Content>
                    <div className='config-item'>
                        <h3>{t('config.general.auto_start')}</h3>
                        {autoStart !== null && (
                            <Switch
                                isSelected={autoStart}
                                onChange={(v) => {
                                    setAutoStart(v);
                                    if (v) {
                                        enable().then(() => {
                                            info('Auto start enabled');
                                        });
                                    } else {
                                        disable().then(() => {
                                            info('Auto start disabled');
                                        });
                                    }
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
                        <h3>{t('config.general.check_update')}</h3>
                        {checkUpdate !== null && (
                            <Switch
                                isSelected={checkUpdate}
                                onChange={(v) => {
                                    setCheckUpdate(v);
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
                        <h3 className='my-auto'>{t('config.general.server_port')}</h3>
                        {serverPort !== null && (
                            <TextField
                                value={serverPort}
                                onChange={(v) => {
                                    if (parseInt(v) !== serverPort) {
                                        if (timer) {
                                            clearTimeout(timer);
                                        }
                                        timer = setTimeout(() => {
                                            toast.success(t('config.general.server_port_change'));
                                        }, 1000);
                                    }
                                    if (v === '') {
                                        setServerPort(0);
                                    } else if (parseInt(v) > 65535) {
                                        setServerPort(65535);
                                    } else if (parseInt(v) < 0) {
                                        setServerPort(0);
                                    } else {
                                        setServerPort(parseInt(v));
                                    }
                                }}
                                className='max-w-25'
                            >
                                <Input
                                    type='number'
                                    variant='secondary'
                                />
                            </TextField>
                        )}
                    </div>
                </Card.Content>
            </Card>
            <Card className='mb-2.5'>
                <Card.Content>
                    <div className='config-item'>
                        <h3 className='my-auto'>{t('config.general.app_language')}</h3>
                        {appLanguage !== null && (
                            <Dropdown>
                                <Button variant='tertiary'>
                                    <span className={`fi fi-${LanguageFlag[appLanguage]}`} />
                                    {languageName[appLanguage]}
                                </Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[40vh] overflow-y-auto'
                                        onAction={(key) => {
                                            setAppLanguage(key);
                                            i18n.changeLanguage(key);
                                            invoke('update_tray', { language: key, copyMode: '' });
                                        }}
                                    >
                                        <Dropdown.Item
                                            id='zh_cn'
                                            textValue='简体中文'
                                        >
                                            <span className={`fi fi-${LanguageFlag.zh_cn}`} />
                                            <Label>简体中文</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='zh_tw'
                                            textValue='繁體中文'
                                        >
                                            <span className={`fi fi-${LanguageFlag.zh_cn}`} />
                                            <Label>繁體中文</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='en'
                                            textValue='English'
                                        >
                                            <span className={`fi fi-${LanguageFlag.en}`} />
                                            <Label>English</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='ja'
                                            textValue='日本語'
                                        >
                                            <span className={`fi fi-${LanguageFlag.ja}`} />
                                            <Label>日本語</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='ko'
                                            textValue='한국어'
                                        >
                                            <span className={`fi fi-${LanguageFlag.ko}`} />
                                            <Label>한국어</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='fr'
                                            textValue='Français'
                                        >
                                            <span className={`fi fi-${LanguageFlag.fr}`} />
                                            <Label>Français</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='de'
                                            textValue='Deutsch'
                                        >
                                            <span className={`fi fi-${LanguageFlag.de}`} />
                                            <Label>Deutsch</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='es'
                                            textValue='Español'
                                        >
                                            <span className={`fi fi-${LanguageFlag.es}`} />
                                            <Label>Español</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='ru'
                                            textValue='Русский'
                                        >
                                            <span className={`fi fi-${LanguageFlag.ru}`} />
                                            <Label>Русский</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='it'
                                            textValue='Italiano'
                                        >
                                            <span className={`fi fi-${LanguageFlag.it}`} />
                                            <Label>Italiano</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='tr'
                                            textValue='Türkçe'
                                        >
                                            <span className={`fi fi-${LanguageFlag.tr}`} />
                                            <Label>Türkçe</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='pt_pt'
                                            textValue='Português'
                                        >
                                            <span className={`fi fi-${LanguageFlag.pt_pt}`} />
                                            <Label>Português</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='pt_br'
                                            textValue='Português (Brasil)'
                                        >
                                            <span className={`fi fi-${LanguageFlag.pt_br}`} />
                                            <Label>Português (Brasil)</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='nb_no'
                                            textValue='Norsk Bokmål'
                                        >
                                            <span className={`fi fi-${LanguageFlag.nb_no}`} />
                                            <Label>Norsk Bokmål</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='nn_no'
                                            textValue='Norsk Nynorsk'
                                        >
                                            <span className={`fi fi-${LanguageFlag.nn_no}`} />
                                            <Label>Norsk Nynorsk</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='fa'
                                            textValue='فارسی'
                                        >
                                            <span className={`fi fi-${LanguageFlag.fa}`} />
                                            <Label>فارسی</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='uk'
                                            textValue='Українська'
                                        >
                                            <span className={`fi fi-${LanguageFlag.uk}`} />
                                            <Label>Українська</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='ar'
                                            textValue='العربية'
                                        >
                                            <span className={`fi fi-${LanguageFlag.ar}`} />
                                            <Label>العربية</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='he'
                                            textValue='עִבְרִית'
                                        >
                                            <span className={`fi fi-${LanguageFlag.he}`} />
                                            <Label>עִבְרִית</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3 className='my-auto'>{t('config.general.app_theme')}</h3>
                        {appTheme !== null && (
                            <Dropdown>
                                <Button variant='tertiary'>{t(`config.general.theme.${appTheme}`)}</Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        onAction={(key) => {
                                            setAppTheme(key);
                                            if (key !== 'system') {
                                                setTheme(key);
                                            } else {
                                                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                                                    setTheme('dark');
                                                } else {
                                                    setTheme('light');
                                                }
                                                window
                                                    .matchMedia('(prefers-color-scheme: dark)')
                                                    .addEventListener('change', (e) => {
                                                        if (e.matches) {
                                                            setTheme('dark');
                                                        } else {
                                                            setTheme('light');
                                                        }
                                                    });
                                            }
                                        }}
                                    >
                                        <Dropdown.Item
                                            id='system'
                                            textValue={t('config.general.theme.system')}
                                        >
                                            <Label>{t('config.general.theme.system')}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='light'
                                            textValue={t('config.general.theme.light')}
                                        >
                                            <Label>{t('config.general.theme.light')}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='dark'
                                            textValue={t('config.general.theme.dark')}
                                        >
                                            <Label>{t('config.general.theme.dark')}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3 className='my-auto'>{t('config.general.app_font')}</h3>
                        {appFont !== null && fontList !== null && (
                            <Dropdown>
                                <Button
                                    variant='tertiary'
                                    style={{
                                        fontFamily: appFont === 'default' ? 'sans-serif' : appFont,
                                    }}
                                >
                                    {appFont === 'default' ? t('config.general.default_font') : appFont}
                                </Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[50vh] overflow-y-auto'
                                        onAction={(key) => {
                                            document.documentElement.style.fontFamily = `"${
                                                key === 'default' ? 'sans-serif' : key
                                            }","${appFallbackFont === 'default' ? 'sans-serif' : appFallbackFont}"`;
                                            setAppFont(key);
                                        }}
                                    >
                                        <Dropdown.Item
                                            id='default'
                                            textValue={t('config.general.default_font')}
                                            style={{ fontFamily: 'sans-serif' }}
                                        >
                                            <Label>{t('config.general.default_font')}</Label>
                                        </Dropdown.Item>
                                        {fontList.map((x) => {
                                            return (
                                                <Dropdown.Item
                                                    id={x}
                                                    key={x}
                                                    textValue={x}
                                                    style={{ fontFamily: x }}
                                                >
                                                    <Label>{x}</Label>
                                                </Dropdown.Item>
                                            );
                                        })}
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3 className='my-auto'>{t('config.general.app_fallback_font')}</h3>
                        {appFallbackFont !== null && fontList !== null && (
                            <Dropdown>
                                <Button
                                    variant='tertiary'
                                    style={{
                                        fontFamily: appFallbackFont === 'default' ? 'sans-serif' : appFallbackFont,
                                    }}
                                >
                                    {appFallbackFont === 'default' ? t('config.general.default_font') : appFallbackFont}
                                </Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[50vh] overflow-y-auto'
                                        onAction={(key) => {
                                            document.documentElement.style.fontFamily = `"${
                                                appFont === 'default' ? 'sans-serif' : appFont
                                            }","${key === 'default' ? 'sans-serif' : key}"`;
                                            setAppFallbackFont(key);
                                        }}
                                    >
                                        <Dropdown.Item
                                            id='default'
                                            textValue={t('config.general.default_font')}
                                            style={{ fontFamily: 'sans-serif' }}
                                        >
                                            <Label>{t('config.general.default_font')}</Label>
                                        </Dropdown.Item>
                                        {fontList.map((x) => {
                                            return (
                                                <Dropdown.Item
                                                    id={x}
                                                    key={x}
                                                    textValue={x}
                                                    style={{ fontFamily: x }}
                                                >
                                                    <Label>{x}</Label>
                                                </Dropdown.Item>
                                            );
                                        })}
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3 className='my-auto mx-0'>{t('config.general.font_size.title')}</h3>
                        {appFontSize !== null && (
                            <Dropdown>
                                <Button variant='tertiary'>{t(`config.general.font_size.${appFontSize}`)}</Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[50vh] overflow-y-auto'
                                        onAction={(key) => {
                                            document.documentElement.style.fontSize = `${key}px`;
                                            setAppFontSize(key);
                                        }}
                                    >
                                        <Dropdown.Item
                                            id={10}
                                            textValue={t('config.general.font_size.10')}
                                        >
                                            <Label>{t(`config.general.font_size.10`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id={12}
                                            textValue={t('config.general.font_size.12')}
                                        >
                                            <Label>{t(`config.general.font_size.12`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id={14}
                                            textValue={t('config.general.font_size.14')}
                                        >
                                            <Label>{t(`config.general.font_size.14`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id={16}
                                            textValue={t('config.general.font_size.16')}
                                        >
                                            <Label>{t(`config.general.font_size.16`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id={18}
                                            textValue={t('config.general.font_size.18')}
                                        >
                                            <Label>{t(`config.general.font_size.18`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id={20}
                                            textValue={t('config.general.font_size.20')}
                                        >
                                            <Label>{t(`config.general.font_size.20`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id={24}
                                            textValue={t('config.general.font_size.24')}
                                        >
                                            <Label>{t(`config.general.font_size.24`)}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className={`config-item ${osType !== 'windows' && 'hidden'}`}>
                        <h3 className='my-auto'>{t('config.general.tray_click_event')}</h3>
                        {trayClickEvent !== null && (
                            <Dropdown>
                                <Button variant='tertiary'>{t(`config.general.event.${trayClickEvent}`)}</Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        onAction={(key) => {
                                            setTrayClickEvent(key);
                                        }}
                                    >
                                        <Dropdown.Item
                                            id='config'
                                            textValue={t('config.general.event.config')}
                                        >
                                            <Label>{t('config.general.event.config')}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='translate'
                                            textValue={t('config.general.event.translate')}
                                        >
                                            <Label>{t('config.general.event.translate')}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='ocr_recognize'
                                            textValue={t('config.general.event.ocr_recognize')}
                                        >
                                            <Label>{t('config.general.event.ocr_recognize')}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='ocr_translate'
                                            textValue={t('config.general.event.ocr_translate')}
                                        >
                                            <Label>{t('config.general.event.ocr_translate')}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            id='disable'
                                            textValue={t('config.general.event.disable')}
                                        >
                                            <Label>{t('config.general.event.disable')}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className={`config-item ${osType === 'macos' && 'hidden'}`}>
                        <h3>{t('config.general.transparent')}</h3>
                        {transparent !== null && (
                            <Switch
                                isSelected={transparent}
                                onChange={(v) => {
                                    setTransparent(v);
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
                        <h3>{t('config.general.dev_mode')}</h3>
                        {devMode !== null && (
                            <Switch
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
                </Card.Content>
            </Card>
            <Card>
                <Card.Content>
                    <div className='config-item'>
                        <h3>{t('config.general.proxy.title')}</h3>
                        {proxyEnable !== null && (
                            <Switch
                                isSelected={proxyEnable}
                                onChange={async (v) => {
                                    if (v) {
                                        if (proxyHost === '' || proxyPort === '') {
                                            setProxyEnable(false);
                                            toast.danger(t('config.general.proxy_error'));
                                            return;
                                        } else {
                                            setProxyEnable(v);
                                        }
                                    } else {
                                        setProxyEnable(v);
                                    }
                                    toast.success(t('config.general.proxy_change'));
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
                        <h3 className='my-auto'>{t('config.general.proxy.host')}</h3>
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
                        <h3 className='my-auto'>{t('config.general.proxy.port')}</h3>
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
                        <h3 className='my-auto'>{t('config.general.proxy.username')}</h3>
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
                        <h3 className='my-auto'>{t('config.general.proxy.password')}</h3>
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
                        <h3 className='my-auto'>{t('config.general.proxy.no_proxy')}</h3>
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
                </Card.Content>
            </Card>
        </>
    );
}
