import { TextField, Label, Input, TextArea, Button, Switch, Card, Link, Tooltip, ProgressBar, Surface, InputGroup, toast } from '@heroui/react';
import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React, { useEffect, useState } from 'react';
import { Ollama } from 'ollama/browser';

import { useConfig } from '../../../hooks/useConfig';
import { translate } from './index';
import { Language } from './index';

export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [serviceConfig, setServiceConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.ollama.title'),
            stream: true,
            model: 'gemma:2b',
            requestPath: 'http://localhost:11434',
            promptList: [
                {
                    role: 'system',
                    content:
                        'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.',
                },
                { role: 'user', content: `Translate into $to:\n"""\n$text\n"""` },
            ],
        },
        { sync: false }
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pullingStatus, setPullingStatus] = useState('');
    const [installedModels, setInstalledModels] = useState(null);

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
                {installedModels === null && (
                    <Card className='border-none bg-danger/20 dark:bg-danger/10 backdrop-blur-md shadow-sm py-2'>
                        <Card.Content>
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
                        </Card.Content>
                    </Card>
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
                            <InputGroup.Suffix className='pr-0'>
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
                <Card className='border-none bg-success/20 dark:bg-success/10 backdrop-blur-md shadow-sm py-2 mb-2'>
                    <Card.Content>
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
                    </Card.Content>
                </Card>
                <h3 className='my-auto'>{t('services.translate.ollama.prompt_list')}</h3>
                <p className='text-xs text-foreground py-2'>{t('services.translate.ollama.prompt_description')}</p>

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
                                            placeholder={t('services.translate.ollama.input_some_prompt', {
                                                role: prompt.role,
                                            })}
                                        />
                                    </TextField>
                                    <Button
                                        isIconOnly
                                        className='my-auto ml-2 shrink-0'
                                        variant='danger-soft'
                                        onPress={() => {
                                            setServiceConfig({
                                                ...serviceConfig,
                                                promptList: serviceConfig.promptList.filter((_, i) => i !== index),
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
                            setServiceConfig({
                                ...serviceConfig,
                                promptList: [
                                    ...serviceConfig.promptList,
                                    {
                                        role:
                                            serviceConfig.promptList.length === 0
                                                ? 'system'
                                                : serviceConfig.promptList.length % 2 === 0
                                                  ? 'assistant'
                                                  : 'user',
                                        content: '',
                                    },
                                ],
                            });
                        }}
                    >
                        {t('services.translate.ollama.add')}
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
