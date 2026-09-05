import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { TextField, Input, Button, toast } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { translate } from './index';
import { Language } from './index';

export function Config(props) {
    const { instanceKey, updateServiceList, onClose, formId, setSavePending } = props;
    const { t } = useTranslation();
    const [config, setConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.alibaba.title'),
            accesskey_id: '',
            accesskey_secret: '',
        },
        { sync: false }
    );

    return (
        config !== null && (
            <form
                className='flex flex-col gap-2'
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault();
                    setSavePending(true);
                    translate('hello', Language.auto, Language.zh_cn, { config }).then(
                        () => {
                            setSavePending(false);
                            setConfig(config, true);
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
                        value={config[INSTANCE_NAME_CONFIG_KEY]}
                        onChange={(value) => {
                            setConfig({
                                ...config,
                                [INSTANCE_NAME_CONFIG_KEY]: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <div className={'config-item'}>
                    <h3 className='my-auto'>{t('services.help')}</h3>
                    <Button
                        size='sm'
                        onPress={() => {
                            open('https://pot-app.com/docs/api/translate/alibaba.html');
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className={'config-item'}>
                    <h3 className='my-auto'>{t('services.translate.alibaba.accesskey_id')}</h3>
                    <TextField
                        value={config['accesskey_id']}
                        onChange={(value) => {
                            setConfig({
                                ...config,
                                accesskey_id: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <div className={'config-item'}>
                    <h3 className='my-auto'>{t('services.translate.alibaba.accesskey_secret')}</h3>
                    <TextField
                        value={config['accesskey_secret']}
                        onChange={(value) => {
                            setConfig({
                                ...config,
                                accesskey_secret: value,
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
