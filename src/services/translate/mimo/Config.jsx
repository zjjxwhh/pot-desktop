import { TextField, Input, TextArea, Button, Switch, Surface, toast } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { translate } from './index';
import { Language } from './index';
import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';

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

const defaultRequestArguments = JSON.stringify({
    temperature: 0.1,
});

export function Config(props) {
    const { instanceKey, updateServiceList, onClose, formId, setSavePending } = props;
    const { t } = useTranslation();
    const [mimoConfig, setMimoConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.mimo.title'),
            model: '',
            apiKey: '',
            stream: true,
            promptList: defaultPromptList,
            requestArguments: defaultRequestArguments,
        },
        { sync: false }
    );
    const systemContent = mimoConfig?.promptList?.[0]?.content ?? '';
    const userContent = mimoConfig?.promptList?.[1]?.content ?? '';

    const setPrompt = (index, role, value) => {
        setMimoConfig({
            ...mimoConfig,
            promptList: mimoConfig.promptList.map((prompt, i) => (i === index ? { role, content: value } : prompt)),
        });
    };

    return (
        mimoConfig !== null && (
            <form
                className='flex flex-col gap-2'
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!userContent.trim()) {
                        toast.danger(t('services.translate.mimo.invalid_prompt'), {
                            description: t('services.translate.mimo.invalid_prompt_empty'),
                        });
                        return;
                    }
                    setSavePending(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: mimoConfig }).then(
                        () => {
                            setSavePending(false);
                            setMimoConfig(mimoConfig, true);
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
                        value={mimoConfig[INSTANCE_NAME_CONFIG_KEY]}
                        onChange={(value) => {
                            setMimoConfig({
                                ...mimoConfig,
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
                            open('https://mimo.mi.com/docs/zh-CN/quick-start/summary/first-api-call');
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.mimo.stream')}</h3>
                    <Switch
                        size='lg'
                        isSelected={mimoConfig['stream']}
                        onChange={(value) => {
                            setMimoConfig({
                                ...mimoConfig,
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
                    <h3 className='my-auto'>{t('services.translate.mimo.api_key')}</h3>
                    <TextField
                        value={mimoConfig['apiKey']}
                        onChange={(value) => {
                            setMimoConfig({
                                ...mimoConfig,
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
                    <h3 className='my-auto'>{t('services.translate.mimo.model')}</h3>
                    <TextField
                        value={mimoConfig['model']}
                        onChange={(value) => {
                            setMimoConfig({
                                ...mimoConfig,
                                model: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <h3 className='my-auto'>{t('services.translate.mimo.prompt_list')}</h3>
                <p className='text-xs text-foreground py-2'>{t('services.translate.mimo.prompt_description')}</p>

                <Surface
                    className='flex flex-col gap-3 rounded-3xl p-3'
                    variant='secondary'
                >
                    <div>
                        <div className='mb-1 ms-2 font-medium'>{t('services.translate.mimo.system_prompt')}</div>
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
                                placeholder={t('services.translate.mimo.input_some_prompt', { role: 'system' })}
                            />
                        </TextField>
                    </div>
                    <div>
                        <div className='mb-1 ms-2 font-medium'>{t('services.translate.mimo.user_prompt')}</div>
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
                                placeholder={t('services.translate.mimo.input_some_prompt', { role: 'user' })}
                            />
                        </TextField>
                    </div>
                </Surface>

                <h3 className='my-auto'>{t('services.translate.mimo.request_arguments')}</h3>
                <div className='config-item'>
                    <TextField
                        fullWidth
                        value={mimoConfig['requestArguments']}
                        onChange={(value) => {
                            setMimoConfig({
                                ...mimoConfig,
                                requestArguments: value,
                            });
                        }}
                    >
                        <TextArea
                            variant='secondary'
                            rows={3}
                            placeholder={t('services.translate.mimo.input_request_arguments')}
                        />
                    </TextField>
                </div>
            </form>
        )
    );
}
