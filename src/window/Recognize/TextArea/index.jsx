import { Card, Button, Skeleton, ButtonGroup, Tooltip } from '@heroui/react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { atom, useAtom, useAtomValue } from 'jotai';
import React, { useEffect, useState } from 'react';
import { IconCopy, IconSpacingHorizontal, IconInputX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';

import { getServiceName, getServiceSouceType, ServiceSourceType } from '../../../utils/service_instance';
import { currentServiceInstanceKeyAtom, languageAtom, recognizeFlagAtom } from '../ControlArea';
import { invoke_plugin } from '../../../utils/invoke_plugin';
import { sendNotification } from '../../../utils/notification';
import { normalizeText, removeAllSpaces} from '../../../utils/text_utils.js';
import * as builtinServices from '../../../services/recognize';
import { useConfig } from '../../../hooks';
import { base64Atom } from '../ImageArea';
import { pluginListAtom } from '..';

export const textAtom = atom();
let recognizeId = 0;

export default function TextArea(props) {
    const { serviceInstanceConfigMap } = props;
    const [autoCopy] = useConfig('recognize_auto_copy', false);
    const [deleteNewline] = useConfig('recognize_delete_newline', false);
    const [hideWindow] = useConfig('recognize_hide_window', false);
    const recognizeFlag = useAtomValue(recognizeFlagAtom);
    const currentServiceInstanceKey = useAtomValue(currentServiceInstanceKeyAtom);
    const language = useAtomValue(languageAtom);
    const base64 = useAtomValue(base64Atom);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useAtom(textAtom);
    const [error, setError] = useState('');
    const pluginList = useAtomValue(pluginListAtom);
    const { t } = useTranslation();

    useEffect(() => {
        setText('');
        setError('');
        if (
            base64 !== '' &&
            currentServiceInstanceKey &&
            autoCopy !== null &&
            deleteNewline !== null &&
            hideWindow !== null
        ) {
            setLoading(true);
            if (getServiceSouceType(currentServiceInstanceKey) === ServiceSourceType.PLUGIN) {
                if (language in pluginList[getServiceName(currentServiceInstanceKey)].language) {
                    let id = nanoid();
                    recognizeId = id;
                    const pluginConfig = serviceInstanceConfigMap[currentServiceInstanceKey] ?? {};

                    invoke_plugin('recognize', getServiceName(currentServiceInstanceKey)).then(([func, utils]) => {
                        func(base64, pluginList[getServiceName(currentServiceInstanceKey)].language[language], {
                            config: pluginConfig,
                            utils,
                        }).then(
                            (v) => {
                                if (recognizeId !== id) return;
                                const newText = normalizeText(v, deleteNewline);
                                setText(newText);
                                setLoading(false);
                                if (autoCopy) {
                                    writeText(newText).then(() => {
                                        if (hideWindow) {
                                            sendNotification({
                                                title: t('common.write_clipboard'),
                                                body: newText,
                                            });
                                        }
                                    });
                                }
                            },
                            (e) => {
                                if (recognizeId !== id) return;
                                setError(e.toString());
                                setLoading(false);
                            }
                        );
                    });
                }
            } else {
                const instanceConfig = serviceInstanceConfigMap[currentServiceInstanceKey] ?? {};
                if (language in builtinServices[getServiceName(currentServiceInstanceKey)].Language) {
                    let id = nanoid();
                    recognizeId = id;
                    builtinServices[getServiceName(currentServiceInstanceKey)]
                        .recognize(
                            base64,
                            builtinServices[getServiceName(currentServiceInstanceKey)].Language[language],
                            {
                                config: instanceConfig,
                            }
                        )
                        .then(
                            (v) => {
                                if (recognizeId !== id) return;
                                const newText = normalizeText(v, deleteNewline);
                                setText(newText);
                                setLoading(false);
                                if (autoCopy) {
                                    writeText(newText).then(() => {
                                        if (hideWindow) {
                                            sendNotification({
                                                title: t('common.write_clipboard'),
                                                body: newText,
                                            });
                                        }
                                    });
                                }
                            },
                            (e) => {
                                if (recognizeId !== id) return;
                                setError(e.toString());
                                setLoading(false);
                            }
                        );
                } else {
                    setError('Language not supported');
                    setLoading(false);
                }
            }
        }
    }, [base64, currentServiceInstanceKey, language, recognizeFlag, autoCopy, deleteNewline, hideWindow]);

    return (
        <Card className='bg-surface h-full ml-1.5 mr-3'>
            <Card.Content className='bg-surface p-0 h-full'>
                {loading ? (
                    <div className='space-y-3 m-1.5'>
                        <Skeleton className='w-3/5 rounded-lg'>
                            <div className='h-3 w-3/5 rounded-lg bg-surface-secondary'></div>
                        </Skeleton>
                        <Skeleton className='w-4/5 rounded-lg'>
                            <div className='h-3 w-4/5 rounded-lg bg-surface-secondary'></div>
                        </Skeleton>
                        <Skeleton className='w-2/5 rounded-lg'>
                            <div className='h-3 w-2/5 rounded-lg bg-surface-tertiary'></div>
                        </Skeleton>
                    </div>
                ) : (
                    <>
                        {text && (
                            <textarea
                                value={text}
                                className='bg-surface h-full ml-1.5 mr-1.5 mb-0 resize-none focus:outline-none'
                                onChange={(e) => {
                                    setText(e.target.value);
                                }}
                            />
                        )}
                        {error && (
                            <textarea
                                value={error}
                                readOnly
                                className='bg-surface h-full ml-1.5 mr-1.5 mb-0 resize-none focus:outline-none text-danger'
                                onChange={(e) => {
                                    setText(e.target.value);
                                }}
                            />
                        )}
                    </>
                )}
            </Card.Content>
            <Card.Footer className='bg-surface flex justify-start'>
                <ButtonGroup>
                    <Tooltip>
                        <Button
                            isIconOnly
                            size='sm'
                            variant='tertiary'
                            onPress={() => {
                                writeText(text);
                            }}
                        >
                            <IconCopy />
                        </Button>
                        <Tooltip.Content>
                            <p>{t('recognize.copy_text')}</p>
                        </Tooltip.Content>
                    </Tooltip>
                    <Tooltip>
                        <Button
                            isIconOnly
                            variant='tertiary'
                            size='sm'
                            onPress={() => {
                                setText(normalizeText(text, true));
                            }}
                        >
                            <IconInputX />
                        </Button>
                        <Tooltip.Content>
                            <p>{t('recognize.delete_newline')}</p>
                        </Tooltip.Content>
                    </Tooltip>
                    <Tooltip>
                        <Button
                            isIconOnly
                            variant='tertiary'
                            size='sm'
                            onPress={() => {
                                setText(removeAllSpaces(text));
                            }}
                        >
                            <IconSpacingHorizontal />
                        </Button>
                        <Tooltip.Content>
                            <p>{t('recognize.delete_space')}</p>
                        </Tooltip.Content>
                    </Tooltip>
                </ButtonGroup>
            </Card.Footer>
        </Card>
    );
}
