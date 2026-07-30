import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { TextField, Label, Input, Button, Dropdown } from '@heroui/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React, { useState } from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { useToastStyle } from '../../../hooks';
import { translate } from './index';
import { Language } from './index';

export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [deeplConfig, setDeeplConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.deepl.title'),
            type: 'free',
            authKey: '',
            customUrl: '',
        },
        { sync: false }
    );
    const [isLoading, setIsLoading] = useState(false);

    const toastStyle = useToastStyle();

    return (
        deeplConfig !== null && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: deeplConfig }).then(
                        () => {
                            setIsLoading(false);
                            setDeeplConfig(deeplConfig, true);
                            updateServiceList(instanceKey);
                            onClose();
                        },
                        (e) => {
                            setIsLoading(false);
                            toast.error(t('config.service.test_failed') + e.toString(), { style: toastStyle });
                        }
                    );
                }}
            >
                <Toaster />
                <div className='config-item'>
                    <TextField
                        value={deeplConfig[INSTANCE_NAME_CONFIG_KEY]}
                        onChange={(value) => {
                            setDeeplConfig({
                                ...deeplConfig,
                                [INSTANCE_NAME_CONFIG_KEY]: value,
                            });
                        }}
                    >
                        <Label>{t('services.instance_name')}</Label>
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <div className={`config-item ${deeplConfig.type === 'free' && 'hidden'}`}>
                    <h3 className='my-auto'>{t('services.help')}</h3>
                    <Button
                        size='sm'
                        onPress={() => {
                            const url =
                                deeplConfig.type === 'api'
                                    ? 'https://pot-app.com/docs/api/translate/deepl.html'
                                    : 'https://github.com/OwO-Network/DeepLX';
                            open(url);
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.deepl.type')}</h3>
                    <Dropdown>
                        <Button
                            size='sm'
                            variant='secondary'
                        >
                            {t(`services.translate.deepl.${deeplConfig.type}`)}
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu
                                autoFocus='first'
                                aria-label='app language'
                                onAction={(key) => {
                                    setDeeplConfig({
                                        ...deeplConfig,
                                        type: key,
                                    });
                                }}
                            >
                                <Dropdown.Item
                                    id='free'
                                    textValue={t(`services.translate.deepl.free`)}
                                >
                                    <Label>{t(`services.translate.deepl.free`)}</Label>
                                </Dropdown.Item>
                                <Dropdown.Item
                                    id='api'
                                    textValue={t(`services.translate.deepl.api`)}
                                >
                                    <Label>{t(`services.translate.deepl.api`)}</Label>
                                </Dropdown.Item>
                                <Dropdown.Item
                                    id='deeplx'
                                    textValue={t(`services.translate.deepl.deeplx`)}
                                >
                                    <Label>{t(`services.translate.deepl.deeplx`)}</Label>
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>
                </div>
                <div className={`config-item ${deeplConfig.type !== 'api' && 'hidden'}`}>
                    <TextField
                        value={deeplConfig['authKey']}
                        onChange={(value) => {
                            setDeeplConfig({
                                ...deeplConfig,
                                authKey: value,
                            });
                        }}
                    >
                        <Label>{t('services.translate.deepl.auth_key')}</Label>
                        <Input
                            type='password'
                            variant='secondary'
                        />
                    </TextField>
                </div>
                <div className={`config-item ${deeplConfig.type !== 'deeplx' && 'hidden'}`}>
                    <TextField
                        value={deeplConfig.customUrl}
                        onChange={(value) => {
                            setDeeplConfig({
                                ...deeplConfig,
                                customUrl: value,
                            });
                        }}
                    >
                        <Label>{t('services.translate.deepl.custom_url')}</Label>
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <Button
                    type='submit'
                    isPending={isLoading}
                    variant='primary'
                    fullWidth
                >
                    {t('common.save')}
                </Button>
            </form>
        )
    );
}
