import { useTranslation } from 'react-i18next';
import { Dropdown, Switch, Button, Card, Label } from '@heroui/react';
import React from 'react';

import { languageList, LanguageFlag } from '../../../../utils/language';
import { useConfig } from '../../../../hooks/useConfig';
import { invoke } from '@tauri-apps/api/core';

export default function Translate() {
    const [sourceLanguage, setSourceLanguage] = useConfig('translate_source_language', 'auto');
    const [targetLanguage, setTargetLanguage] = useConfig('translate_target_language', 'zh_cn');
    const [secondLanguage, setSecondLanguage] = useConfig('translate_second_language', 'en');
    const [detectEngine, setDetectEngine] = useConfig('translate_detect_engine', 'baidu');
    const [autoCopy, setAutoCopy] = useConfig('translate_auto_copy', 'disable');
    const [incrementalTranslate, setIncrementalTranslate] = useConfig('incremental_translate', false);
    const [historyDisable, setHistoryDisable] = useConfig('history_disable', false);
    const [dynamicTranslate, setDynamicTranslate] = useConfig('dynamic_translate', false);
    const [deleteNewline, setDeleteNewline] = useConfig('translate_delete_newline', false);
    const [rememberLanguage, setRememberLanguage] = useConfig('translate_remember_language', false);
    // const [translateFontSize, setTranslateFontSize] = useConfig('translate_font_size', 16);
    const [windowPosition, setWindowPosition] = useConfig('translate_window_position', 'mouse');
    const [rememberWindowSize, setRememberWindowSize] = useConfig('translate_remember_window_size', false);
    const [hideSource, setHideSource] = useConfig('hide_source', false);
    const [hideLanguage, setHideLanguage] = useConfig('hide_language', false);
    const [hideWindow, setHideWindow] = useConfig('translate_hide_window', false);
    const [closeOnBlur, setCloseOnBlur] = useConfig('translate_close_on_blur', true);
    const [alwaysOnTop, setAlwaysOnTop] = useConfig('translate_always_on_top', false);
    const { t } = useTranslation();

    return (
        <>
            <Card className='mb-2.5'>
                <Card.Content>
                    <div className='config-item'>
                        <h3 className='my-auto mx-0'>{t('config.translate.source_language')}</h3>
                        {sourceLanguage !== null && (
                            <Dropdown>
                                <Button variant='tertiary'>
                                    <span className={`fi fi-${LanguageFlag[sourceLanguage]}`} />
                                    {t(`languages.${sourceLanguage}`)}
                                </Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[50vh] overflow-y-auto'
                                        onAction={(key) => {
                                            setSourceLanguage(key);
                                        }}
                                    >
                                        <Dropdown.Item id='auto' textValue={t('languages.auto')}>
                                            <span className={`fi fi-${LanguageFlag['auto']}`} />
                                            <Label>{t('languages.auto')}</Label>
                                        </Dropdown.Item>
                                        {languageList.map((item) => {
                                            return (
                                                <Dropdown.Item id={item} key={item} textValue={t(`languages.${item}`)}>
                                                    <span className={`fi fi-${LanguageFlag[item]}`} />
                                                    <Label>{t(`languages.${item}`)}</Label>
                                                </Dropdown.Item>
                                            );
                                        })}
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3 className='my-auto mx-0'>{t('config.translate.target_language')}</h3>
                        {targetLanguage !== null && (
                            <Dropdown>
                                <Button variant='tertiary'>
                                    <span className={`fi fi-${LanguageFlag[targetLanguage]}`} />
                                    {t(`languages.${targetLanguage}`)}
                                </Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[50vh] overflow-y-auto'
                                        onAction={(key) => {
                                            setTargetLanguage(key);
                                        }}
                                    >
                                        {languageList.map((item) => {
                                            return (
                                                <Dropdown.Item id={item} key={item} textValue={t(`languages.${item}`)}>
                                                    <span className={`fi fi-${LanguageFlag[item]}`} />
                                                    <Label>{t(`languages.${item}`)}</Label>
                                                </Dropdown.Item>
                                            );
                                        })}
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3 className='my-auto mx-0'>{t('config.translate.second_language')}</h3>
                        {secondLanguage !== null && (
                            <Dropdown>
                                <Button variant='tertiary'>
                                    <span className={`fi fi-${LanguageFlag[secondLanguage]}`} />
                                    {t(`languages.${secondLanguage}`)}
                                </Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[50vh] overflow-y-auto'
                                        onAction={(key) => {
                                            setSecondLanguage(key);
                                        }}
                                    >
                                        {languageList.map((item) => {
                                            return (
                                                <Dropdown.Item id={item} key={item} textValue={t(`languages.${item}`)}>
                                                    <span className={`fi fi-${LanguageFlag[item]}`} />
                                                    <Label>{t(`languages.${item}`)}</Label>
                                                </Dropdown.Item>
                                            );
                                        })}
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3 className='my-auto mx-0'>{t('config.translate.detect_engine')}</h3>
                        {detectEngine !== null && (
                            <Dropdown>
                                <Button variant='tertiary'>{t(`config.translate.${detectEngine}`)}</Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[50vh] overflow-y-auto'
                                        onAction={(key) => {
                                            setDetectEngine(key);
                                        }}
                                    >
                                        <Dropdown.Item id='baidu' textValue={t('config.translate.baidu')}>
                                            <Label>{t(`config.translate.baidu`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id='tencent' textValue={t('config.translate.tencent')}>
                                            <Label>{t(`config.translate.tencent`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id='niutrans' textValue={t('config.translate.niutrans')}>
                                            <Label>{t(`config.translate.niutrans`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id='google' textValue={t('config.translate.google')}>
                                            <Label>{t(`config.translate.google`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id='bing' textValue={t('config.translate.bing')}>
                                            <Label>{t(`config.translate.bing`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id='yandex' textValue={t('config.translate.yandex')}>
                                            <Label>{t(`config.translate.yandex`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id='local' textValue={t('config.translate.local')}>
                                            <Label>{t(`config.translate.local`)}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                </Card.Content>
            </Card>
            <Card className='mb-2.5'>
                <Card.Content>
                    <div className='config-item'>
                        <h3 className='my-auto mx-0'>{t('config.translate.auto_copy')}</h3>
                        {autoCopy !== null && (
                            <Dropdown>
                                <Button variant='tertiary'>{t(`config.translate.${autoCopy}`)}</Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[50vh] overflow-y-auto'
                                        onAction={(key) => {
                                            setAutoCopy(key);
                                            invoke('update_tray', { language: '', copyMode: key });
                                        }}
                                    >
                                        <Dropdown.Item id='source' textValue={t('config.translate.source')}>
                                            <Label>{t('config.translate.source')}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id='target' textValue={t('config.translate.target')}>
                                            <Label>{t('config.translate.target')}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id='source_target' textValue={t('config.translate.source_target')}>
                                            <Label>
                                                {t('config.translate.source_target')}
                                            </Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id='disable' textValue={t('config.translate.disable')}>
                                            <Label>{t('config.translate.disable')}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3>{t('config.translate.history_disable')}</h3>
                        {historyDisable !== null && (
                            <Switch
                                size='lg'
                                isSelected={historyDisable}
                                onChange={(v) => {
                                    setHistoryDisable(v);
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
                        <h3 className='my-auto mx-0'>{t('config.translate.incremental_translate')}</h3>
                        {incrementalTranslate !== null && (
                            <Switch
                                size='lg'
                                isSelected={incrementalTranslate}
                                onChange={(v) => {
                                    setIncrementalTranslate(v);
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
                        <h3 className='my-auto mx-0'>{t('config.translate.dynamic_translate')}</h3>
                        {dynamicTranslate !== null && (
                            <Switch
                                size='lg'
                                isSelected={dynamicTranslate}
                                onChange={(v) => {
                                    setDynamicTranslate(v);
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
                        <h3 className='my-auto mx-0'>{t('config.translate.delete_newline')}</h3>
                        {deleteNewline !== null && (
                            <Switch
                                size='lg'
                                isSelected={deleteNewline}
                                onChange={(v) => {
                                    setDeleteNewline(v);
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
                        <h3 className='my-auto mx-0'>{t('config.translate.remember_language')}</h3>
                        {rememberLanguage !== null && (
                            <Switch
                                size='lg'
                                isSelected={rememberLanguage}
                                onChange={(v) => {
                                    setRememberLanguage(v);
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
                    {/* <div className='config-item'>
                        <h3 className='my-auto mx-0'>{t('config.translate.font_size.title')}</h3>
                        {translateFontSize !== null && (
                            <Dropdown>
                                <Button variant='secondary'>
                                    {t(`config.translate.font_size.${translateFontSize}`)}
                                </Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[50vh] overflow-y-auto'
                                        onAction={(key) => {
                                            setTranslateFontSize(key);
                                        }}
                                    >
                                        <Dropdown.Item id={10} textValue={t('config.translate.font_size.10')}>
                                            <Label>{t(`config.translate.font_size.10`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id={12} textValue={t('config.translate.font_size.12')}>
                                            <Label>{t(`config.translate.font_size.12`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id={14} textValue={t('config.translate.font_size.14')}>
                                            <Label>{t(`config.translate.font_size.14`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id={16} textValue={t('config.translate.font_size.16')}>
                                            <Label>{t(`config.translate.font_size.16`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id={18} textValue={t('config.translate.font_size.18')}>
                                            <Label>{t(`config.translate.font_size.18`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id={20} textValue={t('config.translate.font_size.20')}>
                                            <Label>{t(`config.translate.font_size.20`)}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id={24} textValue={t('config.translate.font_size.24')}>
                                            <Label>{t(`config.translate.font_size.24`)}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div> */}
                    <div className='config-item'>
                        <h3 className='my-auto mx-0'>{t('config.translate.window_position')}</h3>
                        {windowPosition !== null && (
                            <Dropdown>
                                <Button variant='tertiary'>{t(`config.translate.${windowPosition}`)}</Button>
                                <Dropdown.Popover>
                                    <Dropdown.Menu
                                        className='max-h-[50vh] overflow-y-auto'
                                        onAction={(key) => {
                                            setWindowPosition(key);
                                        }}
                                    >
                                        <Dropdown.Item id='mouse' textValue={t('config.translate.mouse')}>
                                            <Label>{t('config.translate.mouse')}</Label>
                                        </Dropdown.Item>
                                        <Dropdown.Item id='pre_state' textValue={t('config.translate.pre_state')}>
                                            <Label>{t('config.translate.pre_state')}</Label>
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown>
                        )}
                    </div>
                    <div className='config-item'>
                        <h3 className='my-auto mx-0'>{t('config.translate.remember_window_size')}</h3>
                        {rememberWindowSize !== null && (
                            <Switch
                                size='lg'
                                isSelected={rememberWindowSize}
                                onChange={(v) => {
                                    setRememberWindowSize(v);
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
                        <h3 className='my-auto mx-0'>{t('config.translate.close_on_blur')}</h3>
                        {closeOnBlur !== null && (
                            <Switch
                                size='lg'
                                isSelected={closeOnBlur}
                                onChange={(v) => {
                                    setCloseOnBlur(v);
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
                        <h3 className='my-auto mx-0'>{t('config.translate.always_on_top')}</h3>
                        {alwaysOnTop !== null && (
                            <Switch
                                size='lg'
                                isSelected={alwaysOnTop}
                                onChange={(v) => {
                                    setAlwaysOnTop(v);
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
                        <h3 className='my-auto mx-0'>{t('config.translate.hide_source')}</h3>
                        {hideSource !== null && (
                            <Switch
                                size='lg'
                                isSelected={hideSource}
                                onChange={(v) => {
                                    setHideSource(v);
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
                        <h3 className='my-auto mx-0'>{t('config.translate.hide_language')}</h3>
                        {hideLanguage !== null && (
                            <Switch
                                size='lg'
                                isSelected={hideLanguage}
                                onChange={(v) => {
                                    setHideLanguage(v);
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
                        <h3 className='my-auto mx-0'>{t('config.translate.hide_window')}</h3>
                        {hideWindow !== null && (
                            <Switch
                                size='lg'
                                isSelected={hideWindow}
                                onChange={(v) => {
                                    setHideWindow(v);
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
        </>
    );
}
