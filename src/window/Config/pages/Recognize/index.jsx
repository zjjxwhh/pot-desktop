import { useTranslation } from 'react-i18next';
import { Dropdown, Switch, Button, Surface, Label } from '@heroui/react';
import React from 'react';

import { languageList, LanguageFlag } from '../../../../utils/language';
import { useConfig } from '../../../../hooks';

export default function Recognize() {
    const [recognizeLanguage, setRecognizeLanguage] = useConfig('recognize_language', 'auto');
    const [deleteNewline, setDeleteNewline] = useConfig('recognize_delete_newline', false);
    const [autoCopy, setAutoCopy] = useConfig('recognize_auto_copy', false);
    const [hideWindow, setHideWindow] = useConfig('recognize_hide_window', false);
    const [closeOnBlur, setCloseOnBlur] = useConfig('recognize_close_on_blur', false);
    const { t } = useTranslation();
    return (
        <Surface className='mb-2.5 flex flex-1 flex-col p-4 shadow-surface rounded-[min(32px,var(--radius-3xl))]'>
                <div className='config-item'>
                    <h3 className='my-auto mx-0'>{t('config.recognize.language')}</h3>
                    {recognizeLanguage !== null && (
                        <Dropdown>
                            <Button variant='tertiary'>
                                <span className={`fi fi-${LanguageFlag[recognizeLanguage]}`} />
                                {t(`languages.${recognizeLanguage}`)}
                            </Button>
                            <Dropdown.Popover>
                                <Dropdown.Menu
                                    className='max-h-[50vh] overflow-y-auto'
                                    onAction={(key) => {
                                        setRecognizeLanguage(key);
                                    }}
                                >
                                    <Dropdown.Item id='auto' textValue={t('languages.auto')}>
                                        <span className={`fi fi-${LanguageFlag.auto}`} />
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
                    <h3 className='my-auto mx-0'>{t('config.recognize.delete_newline')}</h3>
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
                    <h3 className='my-auto mx-0'>{t('config.recognize.auto_copy')}</h3>
                    {autoCopy !== null && (
                        <Switch
                            size='lg'
                            isSelected={autoCopy}
                            onChange={(v) => {
                                setAutoCopy(v);
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
                    <h3 className='my-auto mx-0'>{t('config.recognize.close_on_blur')}</h3>
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
                    <h3 className='my-auto mx-0'>{t('config.recognize.hide_window')}</h3>
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
            </Surface>
    );
}
