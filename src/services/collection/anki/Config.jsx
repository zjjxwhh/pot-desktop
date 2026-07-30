import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { Button, Input, Label, TextField } from '@heroui/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React, { useState } from 'react';

import { useConfig } from '../../../hooks';
import { useToastStyle } from '../../../hooks';
import { collection } from './index';

export function Config(props) {
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const { instanceKey, updateServiceList, onClose } = props;
    const [ankiConfig, setAnkiConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.collection.anki.title'),
            port: 8765,
        },
        { sync: false }
    );

    const toastStyle = useToastStyle();

    return (
        ankiConfig !== null && (
            <>
                <Toaster />
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setIsLoading(true);
                        collection('test', '测试', { config: ankiConfig }).then(
                            () => {
                                setIsLoading(false);
                                setAnkiConfig(ankiConfig, true);
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
                    <div className='config-item'>
                        <h3 className='my-auto'>{t('services.instance_name')}</h3>
                        <TextField
                            value={ankiConfig[INSTANCE_NAME_CONFIG_KEY]}
                            onChange={(value) => {
                                setAnkiConfig({
                                    ...ankiConfig,
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
                                open('https://pot-app.com/docs/api/collection/anki.html');
                            }}
                        >
                            {t('services.help')}
                        </Button>
                    </div>
                    <div className={'config-item'}>
                        <h3 className='my-auto'>{t('services.collection.anki.port')}</h3>
                        <TextField
                            value={ankiConfig['port']}
                            onChange={(value) => {
                                setAnkiConfig({
                                    ...ankiConfig,
                                    port: value,
                                });
                            }}
                        >
                            <Input
                                type='number'
                                variant='secondary'
                            />
                        </TextField>
                    </div>
                    <Button
                        type='submit'
                        isPending={isLoading}
                        fullWidth
                        variant='primary'
                    >
                        {t('common.save')}
                    </Button>
                </form>
            </>
        )
    );
}
