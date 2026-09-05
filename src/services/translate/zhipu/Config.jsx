import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { Button, Input, Surface, TextArea, TextField, toast } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { Language, translate } from './index';

const defaultPromptList = [
    {
        role: 'system',
        content:
            'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.',
    },
    {
        role: 'user',
        content: `Translate into $to:\n"""\n$text\n"""`,
    },
];

export function Config(props) {
    const { instanceKey, updateServiceList, onClose, formId, setSavePending } = props;
    const { t } = useTranslation();
    const [serviceConfig, setServiceConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.zhipu.title'),
            model: '',
            apiKey: '',
            promptList: defaultPromptList,
        },
        { sync: false }
    );

    const systemContent = serviceConfig?.promptList?.[0]?.content ?? '';
    const userContent = serviceConfig?.promptList?.[1]?.content ?? '';

    const setPrompt = (index, role, value) => {
        setServiceConfig({
            ...serviceConfig,
            promptList: serviceConfig.promptList.map((prompt, i) => (i === index ? { role, content: value } : prompt)),
        });
    };

    return (
        serviceConfig !== null && (
            <form
                className='flex flex-col gap-2'
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!userContent.trim()) {
                        toast.danger(t('services.translate.zhipu.invalid_prompt'), {
                            description: t('services.translate.zhipu.invalid_prompt_empty'),
                        });
                        return;
                    }
                    setSavePending(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: serviceConfig }).then(
                        () => {
                            setSavePending(false);
                            setServiceConfig(serviceConfig, true);
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
                            open('https://docs.bigmodel.cn/cn/guide/start/quick-start');
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.zhipu.api_key')}</h3>
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
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.zhipu.model')}</h3>
                    <TextField
                        value={serviceConfig.model}
                        onChange={(value) => {
                            setServiceConfig({
                                ...serviceConfig,
                                model: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>

                <h3 className='my-auto'>{t('services.translate.zhipu.prompt_list')}</h3>
                <p className='text-xs text-foreground py-2'>{t('services.translate.zhipu.prompt_description')}</p>

                <Surface
                    className='flex flex-col gap-3 rounded-3xl p-3'
                    variant='secondary'
                >
                    <div>
                        <div className='mb-1 ms-2 font-medium'>{t('services.translate.zhipu.system_prompt')}</div>
                        <TextField
                            fullWidth
                            value={systemContent}
                            onChange={(value) => {
                                setPrompt(0, 'system', value);
                            }}
                        >
                            <TextArea
                                variant='secondary'
                                rows={6}
                                className={'border-2 border-muted'}
                                placeholder={t('services.translate.zhipu.input_some_prompt', { role: 'system' })}
                            />
                        </TextField>
                    </div>
                    <div>
                        <div className='mb-1 ms-2 font-medium'>{t('services.translate.zhipu.user_prompt')}</div>
                        <TextField
                            fullWidth
                            value={userContent}
                            onChange={(value) => {
                                setPrompt(1, 'user', value);
                            }}
                        >
                            <TextArea
                                variant='secondary'
                                rows={6}
                                className={'border-2 border-muted'}
                                placeholder={t('services.translate.zhipu.input_some_prompt', { role: 'user' })}
                            />
                        </TextField>
                    </div>
                </Surface>
            </form>
        )
    );
}
