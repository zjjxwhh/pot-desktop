import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { TextField, Label, Input, TextArea, Button, Dropdown, Surface, toast } from '@heroui/react';
import { MdDeleteOutline } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React, { useState } from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { translate } from './index';
import { Language } from './index';

// https://docs.bigmodel.cn/cn/guide/start/model-overview#%E6%96%87%E6%9C%AC%E6%A8%A1%E5%9E%8B
const availableModels = ['glm-4.5', 'glm-4.5-x', 'glm-4.5-air', 'glm-4.5-airx', 'glm-4-plus', 'glm-4-air-250414', 'glm-4-long', 'glm-4-airx', 'glm-4-flashx-250414', 'glm-z1-air', 'glm-z1-airx', 'glm-z1-flashx', 'glm-4.5-flash', 'glm-4-flash-250414', 'glm-z1-flash']

export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [serviceConfig, setServiceConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.chatglm.title'),
            model: 'chatglm_turbo',
            apiKey: '',
            promptList: [
                {
                    role: 'user',
                    content:
                        'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.',
                },
                { role: 'assistant', content: 'Ok, I will only translate the text content, never interpret it.' },
                { role: 'user', content: `Translate into Chinese\n"""\nhello\n"""` },
                { role: 'assistant', content: '你好' },
                { role: 'user', content: `Translate into $to\n"""\n$text\n"""` },
            ],
        },
        { sync: false }
    );
    const [isLoading, setIsLoading] = useState(false);

    return (
        serviceConfig !== null && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: serviceConfig }).then(
                        () => {
                            setIsLoading(false);
                            setServiceConfig(serviceConfig, true);
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
                        value={serviceConfig[INSTANCE_NAME_CONFIG_KEY]}
                        onChange={(value) => {
                            setServiceConfig({
                                ...serviceConfig,
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
                            open('https://pot-app.com/docs/api/translate/chatglm.html');
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.chatglm.model')}</h3>
                    <Dropdown>
                        <Button
                            size='sm'
                            variant='tertiary'
                        >
                            {serviceConfig.model}
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu
                                autoFocus='first'
                                aria-label='model'
                                onAction={(key) => {
                                    setServiceConfig({
                                        ...serviceConfig,
                                        model: key,
                                    });
                                }}
                            >
                                {availableModels.map((it) => (
                                    <Dropdown.Item
                                        id={it}
                                        textValue={it}
                                    >
                                        <Label>{it}</Label>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.chatglm.api_key')}</h3>
                    <TextField
                        value={serviceConfig['apiKey']}
                        onChange={(value) => {
                            setServiceConfig({
                                ...serviceConfig,
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

                <h3 className='my-auto'>Prompt List</h3>
                <p className='text-xs text-foreground py-2'>{t('services.translate.chatglm.prompt_description')}</p>

                <Surface
                    className='flex flex-col rounded-3xl p-3 pt-0.5'
                    variant='secondary'
                >
                    {serviceConfig.promptList &&
                        serviceConfig.promptList.map((prompt, index) => {
                            return (
                                <div className='config-item'>
                                    <TextField
                                        fullWidth
                                        value={prompt.content}
                                        onChange={(value) => {
                                            setServiceConfig({
                                                ...serviceConfig,
                                                promptList: serviceConfig.promptList.map((p, i) => {
                                                    if (i === index) {
                                                        return {
                                                            role: index % 2 !== 0 ? 'assistant' : 'user',
                                                            content: value,
                                                        };
                                                    } else {
                                                        return p;
                                                    }
                                                }),
                                            });
                                        }}
                                    >
                                        <Label className='my-auto'>{prompt.role}</Label>
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
                                            setServiceConfig({
                                                ...serviceConfig,
                                                promptList: serviceConfig.promptList.filter((p, i) => i !== index),
                                            });
                                        }}
                                    >
                                        <MdDeleteOutline className='text-[18px]' />
                                    </Button>
                                </div>
                            );
                        })}
                    <Button
                        fullWidth
                        className='mt-1'
                        onPress={() => {
                            setServiceConfig({
                                ...serviceConfig,
                                promptList: [
                                    ...serviceConfig.promptList,
                                    {
                                        role: serviceConfig.promptList.length % 2 === 0 ? 'user' : 'assistant',
                                        content: '',
                                    },
                                ],
                            });
                        }}
                    >
                        {t('services.translate.chatglm.add')}
                    </Button>
                </Surface>
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
