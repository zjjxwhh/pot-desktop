import {
    TextField,
    Label,
    Input,
    TextArea,
    Button,
    Switch,
    Link,
    Tooltip,
    ProgressBar,
    Surface,
    InputGroup,
    toast,
} from '@heroui/react';
import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React, { useEffect, useState } from 'react';
import { Ollama } from 'ollama/browser';

import { useConfig } from '../../../hooks/useConfig';
import { translate } from './index';
import { Language } from './index';

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
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.ollama.title'),
            stream: true,
            model: '',
            requestPath: 'http://localhost:11434',
            promptList: defaultPromptList,
        },
        { sync: false }
    );
    const [isPulling, setIsPulling] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pullingStatus, setPullingStatus] = useState('');
    const [installedModels, setInstalledModels] = useState(null);

    const systemContent = serviceConfig?.promptList?.[0]?.content ?? '';
    const userContent = serviceConfig?.promptList?.[1]?.content ?? '';

    const setPrompt = (index, role, value) => {
        setServiceConfig({
            ...serviceConfig,
            promptList: serviceConfig.promptList.map((prompt, i) => (i === index ? { role, content: value } : prompt)),
        });
    };

    async function getModles() {
        try {
            const ollama = new Ollama({ host: serviceConfig.requestPath });
            const list = await ollama.list();
            setInstalledModels(list);
        } catch {
            setInstalledModels(null);
        }
    }

    async function pullModel() {
        setIsPulling(true);
        const ollama = new Ollama({ host: serviceConfig.requestPath });
        const stream = await ollama.pull({ model: serviceConfig.model, stream: true });
        for await (const part of stream) {
            if (part.digest) {
                let percent = 0;
                if (part.completed && part.total) {
                    percent = Math.round((part.completed / part.total) * 100);
                }
                setProgress(percent);
                setPullingStatus(part.status);
            } else {
                setProgress(0);
                setPullingStatus(part.status);
            }
        }
        setProgress(0);
        setPullingStatus('');
        setIsPulling(false);
        getModles();
    }

    useEffect(() => {
        if (serviceConfig !== null) {
            getModles();
        }
    }, [serviceConfig]);

    return (
        serviceConfig !== null && (
            <form
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!userContent.trim()) {
                        toast.danger(t('services.translate.ollama.invalid_prompt'), {
                            description: t('services.translate.ollama.invalid_prompt_empty'),
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
                {installedModels === null && (
                    <Surface className='border-none bg-danger/20 dark:bg-danger/10 backdrop-blur-md shadow-sm py-2 px-4 flex flex-col rounded-[min(32px,var(--radius-3xl))]'>
                            <div>
                                {t('services.translate.ollama.install_ollama')}
                                <br />
                                <Link
                                    target='_blank'
                                    href='https://ollama.com/download'
                                    className='text-accent'
                                >
                                    {t('services.translate.ollama.install_ollama_link')}
                                </Link>
                            </div>
                        </Surface>
                )}
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.help')}</h3>
                    <Button
                        size='sm'
                        onPress={() => {
                            open('https://pot-app.com/docs/api/translate/ollama.html');
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.ollama.stream')}</h3>
                    <Switch
                        size='lg'
                        isSelected={serviceConfig['stream']}
                        onChange={(value) => {
                            setServiceConfig({
                                ...serviceConfig,
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
                    <h3 className='my-auto'>{t('services.translate.ollama.request_path')}</h3>
                    <TextField
                        value={serviceConfig['requestPath']}
                        onChange={(value) => {
                            setServiceConfig({
                                ...serviceConfig,
                                requestPath: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.ollama.model')}</h3>
                    <TextField
                        value={serviceConfig['model']}
                        onChange={(value) => {
                            setServiceConfig({
                                ...serviceConfig,
                                model: value,
                            });
                        }}
                    >
                        <InputGroup variant='secondary'>
                            <InputGroup.Input variant='secondary' />
                            <InputGroup.Suffix className='pe-0'>
                                {installedModels &&
                                !installedModels.models
                                    .map((model) => {
                                        return model.name;
                                    })
                                    .includes(serviceConfig['model']) ? (
                                    <Tooltip>
                                        <Button
                                            size='sm'
                                            className={'bg-muted'}
                                            isPending={isPulling}
                                            onPress={pullModel}
                                        >
                                            {t('services.translate.ollama.install_model')}
                                        </Button>
                                        <Tooltip.Content>
                                            <p>{t('services.translate.ollama.not_installed')}</p>
                                        </Tooltip.Content>
                                    </Tooltip>
                                ) : (
                                    <Button
                                        size='sm'
                                        className={'bg-muted'}
                                        isDisabled
                                    >
                                        {t('services.translate.ollama.ready')}
                                    </Button>
                                )}
                            </InputGroup.Suffix>
                        </InputGroup>
                    </TextField>
                </div>
                <Surface className='border-none bg-success/20 dark:bg-success/10 backdrop-blur-md shadow-sm py-2 px-4 mb-2 flex flex-col rounded-[min(32px,var(--radius-3xl))]'>
                        {isPulling && (
                            <ProgressBar
                                size='sm'
                                className='max-w-md'
                                value={progress}
                            >
                                <Label>{pullingStatus}</Label>
                                <ProgressBar.Output />
                                <ProgressBar.Track>
                                    <ProgressBar.Fill />
                                </ProgressBar.Track>
                            </ProgressBar>
                        )}
                        <div className='flex justify-center'>
                            <Link
                                target='_blank'
                                href='https://ollama.com/library'
                                className='text-accent'
                            >
                                {t('services.translate.ollama.supported_models')}
                            </Link>
                        </div>
                    </Surface>
                <h3 className='my-auto'>{t('services.translate.ollama.prompt_list')}</h3>
                <p className='text-xs text-foreground py-2'>{t('services.translate.ollama.prompt_description')}</p>

                <Surface
                    className='flex flex-col gap-3 rounded-3xl p-3'
                    variant='secondary'
                >
                    <div>
                        <div className='mb-1 ms-2 font-medium'>{t('services.translate.ollama.system_prompt')}</div>
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
                                placeholder={t('services.translate.ollama.input_some_prompt', { role: 'system' })}
                            />
                        </TextField>
                    </div>
                    <div>
                        <div className='mb-1 ms-2 font-medium'>{t('services.translate.ollama.user_prompt')}</div>
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
                                placeholder={t('services.translate.ollama.input_some_prompt', { role: 'user' })}
                            />
                        </TextField>
                    </div>
                </Surface>
            </form>
        )
    );
}
