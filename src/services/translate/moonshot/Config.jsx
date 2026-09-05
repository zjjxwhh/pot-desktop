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
    top_p: 0.99,
    frequency_penalty: 0,
    presence_penalty: 0,
});

export function Config(props) {
    const { instanceKey, updateServiceList, onClose, formId, setSavePending } = props;
    const { t } = useTranslation();
    const [moonshotConfig, setMoonshotConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.moonshot.title'),
            model: '',
            apiKey: '',
            stream: true,
            promptList: defaultPromptList,
            requestArguments: defaultRequestArguments,
        },
        { sync: false }
    );
    const systemContent = moonshotConfig?.promptList?.[0]?.content ?? '';
    const userContent = moonshotConfig?.promptList?.[1]?.content ?? '';

    const setPrompt = (index, role, value) => {
        setMoonshotConfig({
            ...moonshotConfig,
            promptList: moonshotConfig.promptList.map((prompt, i) => (i === index ? { role, content: value } : prompt)),
        });
    };

    return (
        moonshotConfig !== null && (
            <form
                className='flex flex-col gap-2'
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!userContent.trim()) {
                        toast.danger(t('services.translate.moonshot.invalid_prompt'), {
                            description: t('services.translate.moonshot.invalid_prompt_empty'),
                        });
                        return;
                    }
                    setSavePending(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: moonshotConfig }).then(
                        () => {
                            setSavePending(false);
                            setMoonshotConfig(moonshotConfig, true);
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
                        value={moonshotConfig[INSTANCE_NAME_CONFIG_KEY]}
                        onChange={(value) => {
                            setMoonshotConfig({
                                ...moonshotConfig,
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
                            open('https://platform.moonshot.cn/docs/intro');
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.moonshot.stream')}</h3>
                    <Switch
                        size='lg'
                        isSelected={moonshotConfig['stream']}
                        onChange={(value) => {
                            setMoonshotConfig({
                                ...moonshotConfig,
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
                    <h3 className='my-auto'>{t('services.translate.moonshot.api_key')}</h3>
                    <TextField
                        value={moonshotConfig['apiKey']}
                        onChange={(value) => {
                            setMoonshotConfig({
                                ...moonshotConfig,
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
                    <h3 className='my-auto'>{t('services.translate.moonshot.model')}</h3>
                    <TextField
                        value={moonshotConfig['model']}
                        onChange={(value) => {
                            setMoonshotConfig({
                                ...moonshotConfig,
                                model: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <h3 className='my-auto'>{t('services.translate.moonshot.prompt_list')}</h3>
                <p className='text-xs text-foreground py-2'>{t('services.translate.moonshot.prompt_description')}</p>

                <Surface
                    className='flex flex-col gap-3 rounded-3xl p-3'
                    variant='secondary'
                >
                    <div>
                        <div className='mb-1 ms-2 font-medium'>{t('services.translate.moonshot.system_prompt')}</div>
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
                                placeholder={t('services.translate.moonshot.input_some_prompt', { role: 'system' })}
                            />
                        </TextField>
                    </div>
                    <div>
                        <div className='mb-1 ms-2 font-medium'>{t('services.translate.moonshot.user_prompt')}</div>
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
                                placeholder={t('services.translate.moonshot.input_some_prompt', { role: 'user' })}
                            />
                        </TextField>
                    </div>
                </Surface>

                <h3 className='my-auto'>{t('services.translate.moonshot.request_arguments')}</h3>
                <div className='config-item'>
                    <TextField
                        fullWidth
                        value={moonshotConfig['requestArguments']}
                        onChange={(value) => {
                            setMoonshotConfig({
                                ...moonshotConfig,
                                requestArguments: value,
                            });
                        }}
                    >
                        <TextArea
                            variant='secondary'
                            rows={3}
                            placeholder={t('services.translate.moonshot.input_request_arguments')}
                        />
                    </TextField>
                </div>
            </form>
        )
    );
}
