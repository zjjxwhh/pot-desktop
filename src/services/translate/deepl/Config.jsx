import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { TextField, Label, Input, Button, Dropdown, toast } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { translate } from './index';
import { Language } from './index';

export function Config(props) {
    const { instanceKey, updateServiceList, onClose, formId, setSavePending } = props;
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

    return (
        deeplConfig !== null && (
            <form
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault();
                    setSavePending(true);
                    translate('hello', Language.auto, Language.zh_cn, { config: deeplConfig }).then(
                        () => {
                            setSavePending(false);
                            setDeeplConfig(deeplConfig, true);
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
                        value={deeplConfig[INSTANCE_NAME_CONFIG_KEY]}
                        onChange={(value) => {
                            setDeeplConfig({
                                ...deeplConfig,
                                [INSTANCE_NAME_CONFIG_KEY]: value,
                            });
                        }}
                    >
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
                            variant='tertiary'
                        >
                            {t(`services.translate.deepl.${deeplConfig.type}`)}
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu
                                autoFocus='first'
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
                    <h3 className='my-auto'>{t('services.translate.deepl.auth_key')}</h3>
                    <TextField
                        value={deeplConfig['authKey']}
                        onChange={(value) => {
                            setDeeplConfig({
                                ...deeplConfig,
                                authKey: value,
                            });
                        }}
                    >
                        <Input
                            type='password'
                            variant='secondary'
                        />
                    </TextField>
                </div>
                <div className={`config-item ${deeplConfig.type !== 'deeplx' && 'hidden'}`}>
                    <h3 className='my-auto'>{t('services.translate.deepl.custom_url')}</h3>
                    <TextField
                        value={deeplConfig.customUrl}
                        onChange={(value) => {
                            setDeeplConfig({
                                ...deeplConfig,
                                customUrl: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
            </form>
        )
    );
}
