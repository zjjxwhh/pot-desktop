import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { Button, Input, TextField, toast } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React from 'react';

import { useConfig } from '../../../hooks';
import { collection } from './index';

export function Config(props) {
    const { t } = useTranslation();
    const { instanceKey, updateServiceList, onClose, formId, setSavePending } = props;
    const [ankiConfig, setAnkiConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.collection.anki.title'),
            port: 8765,
        },
        { sync: false }
    );

    return (
        ankiConfig !== null && (
            <>
                <form
                    id={formId}
                    onSubmit={(e) => {
                        e.preventDefault();
                        setSavePending(true);
                        collection('test', '测试', { config: ankiConfig }).then(
                            () => {
                                setSavePending(false);
                                setAnkiConfig(ankiConfig, true);
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
                </form>
            </>
        )
    );
}
