import { TextField, Label, Input, TextArea, Button, Switch, Surface, toast } from '@heroui/react';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { translate } from './index';
import { Language } from './index';
import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import IconPicker from './IconPicker';

export const defaultRequestArguments = JSON.stringify({
    temperature: 0.1,
    top_p: 0.99,
    frequency_penalty: 0,
    presence_penalty: 0,
});

export function Config(props) {
    const { instanceKey, updateServiceList, onClose, formId, setSavePending, setDraftIcon } = props;
    const { t } = useTranslation();
    const [openaiConfig, setOpenaiConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.openai_compatible.title'),
            service: 'openai_compatible',
            requestPath: 'https://api.openai.com/v1/chat/completions',
            model: '',
            apiKey: '',
            stream: false,
            promptList: [
                {
                    role: 'system',
                    content:
                        'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.',
                },
                { role: 'user', content: `Translate into $to:\n"""\n$text\n"""` },
            ],
            requestArguments: defaultRequestArguments,
            icon: '',
            iconId: '',
        },
        { sync: false }
    );
    // 兼容旧版本
    if (openaiConfig) {
        if (openaiConfig.promptList === undefined) {
            setOpenaiConfig({
                ...openaiConfig,
                promptList: [
                    {
                        role: 'system',
                        content:
                            'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.',
                    },
                    { role: 'user', content: `Translate into $to:\n"""\n$text\n"""` },
                ],
            });
        }
        if (openaiConfig.requestArguments === undefined) {
            setOpenaiConfig({
                ...openaiConfig,
                requestArguments: defaultRequestArguments,
            });
        }
    }

    return (
        openaiConfig !== null && (
            <form
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault();
                    setSavePending(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: openaiConfig }).then(
                        () => {
                            setSavePending(false);
                            setOpenaiConfig(openaiConfig, true);
                            updateServiceList(instanceKey);
                            onClose();
                        },
                        (e) => {
                            setSavePending(false);
                            toast.danger(t('config.service.test_failed'), {
                                description: e.toString(),
                            });
                        }
                    );
                }}
            >
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.instance_name')}</h3>
                    <TextField
                        value={openaiConfig[INSTANCE_NAME_CONFIG_KEY]}
                        onChange={(value) => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                [INSTANCE_NAME_CONFIG_KEY]: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.openai_compatible.icon')}</h3>
                    <IconPicker
                        value={openaiConfig['icon'] ?? ''}
                        iconId={openaiConfig['iconId'] ?? ''}
                        onChange={(icon, iconId) => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                icon,
                                iconId,
                            });
                            setDraftIcon?.(icon);
                        }}
                    />
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.openai_compatible.stream')}</h3>
                    <Switch
                        size='lg'
                        isSelected={openaiConfig['stream']}
                        onChange={(value) => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                stream: value,
                            });
                        }}
                        className='my-auto'
                    >
                        <Switch.Content>
                            <Switch.Control>
                                <Switch.Thumb />
                            </Switch.Control>
                        </Switch.Content>
                    </Switch>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.openai_compatible.request_path')}</h3>
                    <TextField
                        value={openaiConfig['requestPath']}
                        onChange={(value) => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                requestPath: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.openai_compatible.api_key')}</h3>
                    <TextField
                        value={openaiConfig['apiKey']}
                        onChange={(value) => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                apiKey: value,
                            });
                        }}
                    >
                        <Input
                            type='password'
                            variant='secondary'
                        />
                    </TextField>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.openai_compatible.model')}</h3>
                    <TextField
                        value={openaiConfig['model']}
                        onChange={(value) => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                model: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <h3 className='my-auto'>{t('services.translate.openai_compatible.prompt_list')}</h3>
                <p className='text-xs text-foreground py-2'>
                    {t('services.translate.openai_compatible.prompt_description')}
                </p>

                <Surface
                    className='flex flex-col rounded-3xl p-3 pt-0.5'
                    variant='secondary'
                >
                    {openaiConfig.promptList &&
                        openaiConfig.promptList.map((prompt, index) => {
                            return (
                                <div className='config-item'>
                                    <TextField
                                        fullWidth
                                        value={prompt.content}
                                        onChange={(value) => {
                                            setOpenaiConfig({
                                                ...openaiConfig,
                                                promptList: openaiConfig.promptList.map((p, i) => {
                                                    if (i === index) {
                                                        if (i === 0) {
                                                            return {
                                                                role: 'system',
                                                                content: value,
                                                            };
                                                        } else {
                                                            return {
                                                                role: index % 2 !== 0 ? 'user' : 'assistant',
                                                                content: value,
                                                            };
                                                        }
                                                    } else {
                                                        return p;
                                                    }
                                                }),
                                            });
                                        }}
                                    >
                                        <Label>{prompt.role}</Label>
                                        <TextArea
                                            variant='secondary'
                                            rows={6}
                                            className={'border-2 border-muted'}
                                            placeholder={t('services.translate.openai_compatible.input_some_prompt', {
                                                role: prompt.role,
                                            })}
                                        />
                                    </TextField>
                                    <Button
                                        isIconOnly
                                        className='my-auto ms-2 shrink-0'
                                        variant='danger-soft'
                                        onPress={() => {
                                            setOpenaiConfig({
                                                ...openaiConfig,
                                                promptList: openaiConfig.promptList.filter((_, i) => i !== index),
                                            });
                                        }}
                                    >
                                        <IconTrash />
                                    </Button>
                                </div>
                            );
                        })}
                    <Button
                        fullWidth
                        className='mt-1'
                        onPress={() => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                promptList: [
                                    ...openaiConfig.promptList,
                                    {
                                        role:
                                            openaiConfig.promptList.length === 0
                                                ? 'system'
                                                : openaiConfig.promptList.length % 2 === 0
                                                  ? 'assistant'
                                                  : 'user',
                                        content: '',
                                    },
                                ],
                            });
                        }}
                    >
                        {t('services.translate.openai_compatible.add')}
                    </Button>
                </Surface>
                <br />

                <h3 className='my-auto'>{t('services.translate.openai_compatible.request_arguments')}</h3>
                <div className='config-item'>
                    <TextField
                        fullWidth
                        value={openaiConfig['requestArguments']}
                        onChange={(value) => {
                            setOpenaiConfig({
                                ...openaiConfig,
                                requestArguments: value,
                            });
                        }}
                    >
                        <TextArea
                            variant='secondary'
                            rows={3}
                            placeholder={t('services.translate.openai_compatible.input_request_arguments')}
                        />
                    </TextField>
                </div>
            </form>
        )
    );
}
