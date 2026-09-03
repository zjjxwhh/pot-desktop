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
    const [bailianConfig, setBailianConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.bailian.title'),
            model: '',
            requestPath: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            apiKey: '',
            stream: true,
            promptList: defaultPromptList,
            requestArguments: defaultRequestArguments,
        },
        { sync: false }
    );
    const systemContent = bailianConfig?.promptList?.[0]?.content ?? '';
    const userContent = bailianConfig?.promptList?.[1]?.content ?? '';

    const setPrompt = (index, role, value) => {
        setBailianConfig({
            ...bailianConfig,
            promptList: bailianConfig.promptList.map((prompt, i) => (i === index ? { role, content: value } : prompt)),
        });
    };

    return (
        bailianConfig !== null && (
            <form
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!userContent.trim()) {
                        toast.danger(t('services.translate.bailian.invalid_prompt'), {
                            description: t('services.translate.bailian.invalid_prompt_empty'),
                        });
                        return;
                    }
                    setSavePending(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: bailianConfig }).then(
                        () => {
                            setSavePending(false);
                            setBailianConfig(bailianConfig, true);
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
                        value={bailianConfig[INSTANCE_NAME_CONFIG_KEY]}
                        onChange={(value) => {
                            setBailianConfig({
                                ...bailianConfig,
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
                            open('https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope');
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.bailian.stream')}</h3>
                    <Switch
                        size='lg'
                        isSelected={bailianConfig['stream']}
                        onChange={(value) => {
                            setBailianConfig({
                                ...bailianConfig,
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
                    <h3 className='my-auto'>{t('services.translate.bailian.request_path')}</h3>
                    <TextField
                        value={bailianConfig['requestPath']}
                        onChange={(value) => {
                            setBailianConfig({
                                ...bailianConfig,
                                requestPath: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.bailian.api_key')}</h3>
                    <TextField
                        value={bailianConfig['apiKey']}
                        onChange={(value) => {
                            setBailianConfig({
                                ...bailianConfig,
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
                    <h3 className='my-auto'>{t('services.translate.bailian.model')}</h3>
                    <TextField
                        value={bailianConfig['model']}
                        onChange={(value) => {
                            setBailianConfig({
                                ...bailianConfig,
                                model: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <h3 className='my-auto'>{t('services.translate.bailian.prompt_list')}</h3>
                <p className='text-xs text-foreground py-2'>{t('services.translate.bailian.prompt_description')}</p>

                <Surface
                    className='flex flex-col gap-3 rounded-3xl p-3'
                    variant='secondary'
                >
                    <div>
                        <div className='mb-1 ms-2 font-medium'>{t('services.translate.bailian.system_prompt')}</div>
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
                                placeholder={t('services.translate.bailian.input_some_prompt', { role: 'system' })}
                            />
                        </TextField>
                    </div>
                    <div>
                        <div className='mb-1 ms-2 font-medium'>{t('services.translate.bailian.user_prompt')}</div>
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
                                placeholder={t('services.translate.bailian.input_some_prompt', { role: 'user' })}
                            />
                        </TextField>
                    </div>
                </Surface>
                <br />

                <h3 className='my-auto'>{t('services.translate.bailian.request_arguments')}</h3>
                <div className='config-item'>
                    <TextField
                        fullWidth
                        value={bailianConfig['requestArguments']}
                        onChange={(value) => {
                            setBailianConfig({
                                ...bailianConfig,
                                requestArguments: value,
                            });
                        }}
                    >
                        <TextArea
                            variant='secondary'
                            rows={3}
                            placeholder={t('services.translate.bailian.input_request_arguments')}
                        />
                    </TextField>
                </div>
            </form>
        )
    );
}
