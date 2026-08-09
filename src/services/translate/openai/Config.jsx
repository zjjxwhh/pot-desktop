import { TextField, Label, Input, TextArea, Button, Switch, Dropdown, Surface, toast } from '@heroui/react';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React, { useState } from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { translate } from './index';
import { Language } from './index';
import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';

export const defaultRequestArguments = JSON.stringify({
    temperature: 0.1,
    top_p: 0.99,
    frequency_penalty: 0,
    presence_penalty: 0,
});

export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [openaiConfig, setOpenaiConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.openai.title'),
            service: 'openai',
            requestPath: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-3.5-turbo',
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

    const [isLoading, setIsLoading] = useState(false);

    return (
        openaiConfig !== null && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: openaiConfig }).then(
                        () => {
                            setIsLoading(false);
                            setOpenaiConfig(openaiConfig, true);
                            updateServiceList(instanceKey);
                            onClose();
                        },
                        (e) => {
                            setIsLoading(false);
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
                    <h3 className='my-auto'>{t('services.help')}</h3>
                    <Button
                        size='sm'
                        onPress={() => {
                            open('https://pot-app.com/docs/api/translate/openai.html');
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.openai.service')}</h3>
                    <Dropdown>
                        <Button
                            size='sm'
                            variant='tertiary'
                        >
                            {t(`services.translate.openai.${openaiConfig.service}`)}
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu
                                autoFocus='first'
                                aria-label='service'
                                onAction={(key) => {
                                    setOpenaiConfig({
                                        ...openaiConfig,
                                        service: key,
                                    });
                                }}
                            >
                                <Dropdown.Item
                                    id='openai'
                                    textValue={t(`services.translate.openai.openai`)}
                                >
                                    <Label>{t(`services.translate.openai.openai`)}</Label>
                                </Dropdown.Item>
                                <Dropdown.Item
                                    id='azure'
                                    textValue={t(`services.translate.openai.azure`)}
                                >
                                    <Label>{t(`services.translate.openai.azure`)}</Label>
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.openai.stream')}</h3>
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
                    <h3 className='my-auto'>{t('services.translate.openai.request_path')}</h3>
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
                    <h3 className='my-auto'>{t('services.translate.openai.api_key')}</h3>
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
                <div className={`config-item ${openaiConfig.service === 'azure' && 'hidden'}`}>
                    <h3 className='my-auto'>{t('services.translate.openai.model')}</h3>
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
                <h3 className='my-auto'>Prompt List</h3>
                <p className='text-xs text-foreground py-2'>{t('services.translate.openai.prompt_description')}</p>

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
                                            placeholder={`Input Some ${prompt.role} Prompt`}
                                        />
                                    </TextField>
                                    <Button
                                        isIconOnly
                                        className='my-auto ml-2 shrink-0'
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
                        {t('services.translate.openai.add')}
                    </Button>
                </Surface>
                <br />

                <h3 className='my-auto'>Request Arguments</h3>
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
                            placeholder={`Input API Request Arguments`}
                        />
                    </TextField>
                </div>
                <br />
                <Button
                    type='submit'
                    isPending={isLoading}
                    fullWidth
                    variant='primary'
                >
                    {t('common.save')}
                </Button>
            </form>
        )
    );
}
