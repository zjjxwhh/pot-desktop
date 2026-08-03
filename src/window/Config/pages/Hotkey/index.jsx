import { unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { useTranslation } from 'react-i18next';
import { Card, Button, TextField, InputGroup, toast } from '@heroui/react';
import React from 'react';

import { useConfig } from '../../../../hooks/useConfig';
import { osType } from '../../../../utils/env';
import { invoke } from '@tauri-apps/api/core';

const keyMap = {
    Backquote: '`',
    Backslash: '\\',
    BracketLeft: '[',
    BracketRight: ']',
    Comma: ',',
    Equal: '=',
    Minus: '-',
    Plus: 'PLUS',
    Period: '.',
    Quote: "'",
    Semicolon: ';',
    Slash: '/',
    Backspace: 'Backspace',
    CapsLock: 'Capslock',
    ContextMenu: 'Contextmenu',
    Space: 'Space',
    Tab: 'Tab',
    Convert: 'Convert',
    Delete: 'Delete',
    End: 'End',
    Help: 'Help',
    Home: 'Home',
    PageDown: 'Pagedown',
    PageUp: 'Pageup',
    Escape: 'Esc',
    PrintScreen: 'Printscreen',
    ScrollLock: 'Scrolllock',
    Pause: 'Pause',
    Insert: 'Insert',
    Suspend: 'Suspend',
};

export default function Hotkey() {
    const [selectionTranslate, setSelectionTranslate] = useConfig('hotkey_selection_translate', '');
    const [inputTranslate, setInputTranslate] = useConfig('hotkey_input_translate', '');
    const [ocrRecognize, setOcrRecognize] = useConfig('hotkey_ocr_recognize', '');
    const [ocrTranslate, setOcrTranslate] = useConfig('hotkey_ocr_translate', '');

    const { t } = useTranslation();

    function keyDown(e, setKey) {
        e.preventDefault();
        if (e.keyCode === 8) {
            setKey('');
        } else {
            let newValue = '';
            if (e.ctrlKey) {
                newValue = 'Ctrl';
            }
            if (e.shiftKey) {
                newValue = `${newValue}${newValue.length > 0 ? '+' : ''}Shift`;
            }
            if (e.metaKey) {
                newValue = `${newValue}${newValue.length > 0 ? '+' : ''}${osType === 'macos' ? 'Command' : 'Super'}`;
            }
            if (e.altKey) {
                newValue = `${newValue}${newValue.length > 0 ? '+' : ''}Alt`;
            }
            let code = e.code;
            if (code.startsWith('Key')) {
                code = code.substring(3);
            } else if (code.startsWith('Digit')) {
                code = code.substring(5);
            } else if (code.startsWith('Numpad')) {
                code = 'Num' + code.substring(6);
            } else if (code.startsWith('Arrow')) {
                code = code.substring(5);
            } else if (code.startsWith('Intl')) {
                code = code.substring(4);
            } else if (/F\d+/.test(code)) {
            } else if (keyMap[code] !== undefined) {
                code = keyMap[code];
            } else {
                code = '';
            }
            setKey(`${newValue}${newValue.length > 0 && code.length > 0 ? '+' : ''}${code}`);
        }
    }

    function registerHandler(name, key) {
        isRegistered(key).then((res) => {
            if (res) {
                toast.danger(t('config.hotkey.is_register'));
            } else {
                invoke('register_shortcut_by_frontend', {
                    name: name,
                    shortcut: key,
                }).then(
                    () => {
                        toast.success(t('config.hotkey.success'));
                    },
                    (e) => {
                        toast.danger(e);
                    }
                );
            }
        });
    }

    return (
        <Card>
            <Card.Content>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.hotkey.selection_translate')}</h3>
                    {selectionTranslate !== null && (
                        <TextField
                            value={selectionTranslate}
                            className='w-[40%] '
                        >
                            <InputGroup
                                variant='secondary'
                                fullWidth
                            >
                                <InputGroup.Input
                                    className='min-w-0'
                                    type='hotkey'
                                    placeholder={t('config.hotkey.set_hotkey')}
                                    onKeyDown={(e) => {
                                        keyDown(e, setSelectionTranslate);
                                    }}
                                    onFocus={() => {
                                        unregister(selectionTranslate);
                                        setSelectionTranslate('');
                                    }}
                                />
                                <InputGroup.Suffix className='pr-0'>
                                    <Button
                                        size='sm'
                                        className={`${selectionTranslate === '' && 'hidden'} bg-muted`}
                                        onPress={() => {
                                            registerHandler('hotkey_selection_translate', selectionTranslate);
                                        }}
                                    >
                                        {t('common.ok')}
                                    </Button>
                                </InputGroup.Suffix>
                            </InputGroup>
                        </TextField>
                    )}
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.hotkey.input_translate')}</h3>
                    {inputTranslate !== null && (
                        <TextField
                            value={inputTranslate}
                            className='w-[40%] '
                        >
                            <InputGroup
                                variant='secondary'
                                fullWidth
                            >
                                <InputGroup.Input
                                    className='min-w-0'
                                    type='hotkey'
                                    placeholder={t('config.hotkey.set_hotkey')}
                                    onKeyDown={(e) => {
                                        keyDown(e, setInputTranslate);
                                    }}
                                    onFocus={() => {
                                        unregister(inputTranslate);
                                        setInputTranslate('');
                                    }}
                                />
                                <InputGroup.Suffix className='pr-0'>
                                    <Button
                                        size='sm'
                                        className={`${inputTranslate === '' && 'hidden'} bg-muted`}
                                        onPress={() => {
                                            registerHandler('hotkey_input_translate', inputTranslate);
                                        }}
                                    >
                                        {t('common.ok')}
                                    </Button>
                                </InputGroup.Suffix>
                            </InputGroup>
                        </TextField>
                    )}
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.hotkey.ocr_recognize')}</h3>
                    {ocrRecognize !== null && (
                        <TextField
                            value={ocrRecognize}
                            className='w-[40%] '
                        >
                            <InputGroup
                                variant='secondary'
                                fullWidth
                            >
                                <InputGroup.Input
                                    className='min-w-0'
                                    type='hotkey'
                                    placeholder={t('config.hotkey.set_hotkey')}
                                    onKeyDown={(e) => {
                                        keyDown(e, setOcrRecognize);
                                    }}
                                    onFocus={() => {
                                        unregister(ocrRecognize);
                                        setOcrRecognize('');
                                    }}
                                />
                                <InputGroup.Suffix className='pr-0'>
                                    <Button
                                        size='sm'
                                        className={`${ocrRecognize === '' && 'hidden'} bg-muted`}
                                        onPress={() => {
                                            registerHandler('hotkey_ocr_recognize', ocrRecognize);
                                        }}
                                    >
                                        {t('common.ok')}
                                    </Button>
                                </InputGroup.Suffix>
                            </InputGroup>
                        </TextField>
                    )}
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('config.hotkey.ocr_translate')}</h3>
                    {ocrTranslate !== null && (
                        <TextField
                            value={ocrTranslate}
                            className='w-[40%]'
                        >
                            <InputGroup
                                variant='secondary'
                                fullWidth
                            >
                                <InputGroup.Input
                                    className='min-w-0'
                                    type='hotkey'
                                    placeholder={t('config.hotkey.set_hotkey')}
                                    onKeyDown={(e) => {
                                        keyDown(e, setOcrTranslate);
                                    }}
                                    onFocus={() => {
                                        unregister(ocrTranslate);
                                        setOcrTranslate('');
                                    }}
                                />
                                <InputGroup.Suffix className='pr-0'>
                                    <Button
                                        size='sm'
                                        className={`${ocrTranslate === '' && 'hidden'} bg-muted`}
                                        onPress={() => {
                                            registerHandler('hotkey_ocr_translate', ocrTranslate);
                                        }}
                                    >
                                        {t('common.ok')}
                                    </Button>
                                </InputGroup.Suffix>
                            </InputGroup>
                        </TextField>
                    )}
                </div>
            </Card.Content>
        </Card>
    );
}
