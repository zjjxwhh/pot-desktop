import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { Button, Input, TextField, toast } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React, { useState } from 'react';

import { useConfig } from '../../../hooks';
import { collection } from './index';

export function Config(props) {
    const [isLoading, setIsLoading] = useState(false);
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [config, setConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.collection.eudic.title'),
            name: 'pot',
            token: '',
        },
        { sync: false }
    );

    return (
        config !== null && (
            <>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setIsLoading(true);
                        collection('test', '测试', { config }).then(
                            () => {
                                setIsLoading(false);
                                setConfig(config, true);
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
                                open('https://pot-app.com/docs/api/collection/eudic.html');
                            }}
                        >
                            {t('services.help')}
                        </Button>
                    </div>
                    <div className={'config-item'}>
                        <h3 className='my-auto'>{t('services.collection.eudic.name')}</h3>
                        <TextField
                            value={config['name']}
                            onChange={(value) => {
                                setConfig({
                                    ...config,
                                    name: value,
                                });
                            }}
                        >
                            <Input variant='secondary' />
                        </TextField>
                    </div>
                    <div className={'config-item'}>
                        <h3 className='my-auto'>{t('services.collection.eudic.token')}</h3>
                        <TextField
                            value={config['token']}
                            onChange={(value) => {
                                setConfig({
                                    ...config,
                                    token: value,
                                });
                            }}
                        >
                            <Input variant='secondary' />
                        </TextField>
                    </div>
                    <div>
                        <Button
                            type='submit'
                            isPending={isLoading}
                            fullWidth
                            variant='primary'
                        >
                            {t('common.save')}
                        </Button>
                    </div>
                </form>
            </>
        )
    );
}
