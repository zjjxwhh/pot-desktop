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
    const [config, setConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.baidu_field.title'),
            appid: '',
            secret: '',
            field: 'it',
        },
        { sync: false }
    );
    const fieldList = [
        'it',
        'finance',
        'machinery',
        'senimed',
        'novel',
        'academic',
        'aerospace',
        'wiki',
        'news',
        'law',
        'contract',
    ];

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
                            open('https://pot-app.com/docs/api/translate/baidu.html');
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
                            {t(`services.translate.baidu_field.${config.field}`)}
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu
                                autoFocus='first'
                                className='max-h-[50vh] overflow-y-auto'
                                onAction={(key) => {
                                    setConfig({
                                        ...config,
                                        field: key,
                                    });
                                }}
                            >
                                {fieldList.map((item) => {
                                    return (
                                        <Dropdown.Item
                                            id={item}
                                            textValue={t(`services.translate.baidu_field.${item}`)}
                                        >
                                            <Label>{t(`services.translate.baidu_field.${item}`)}</Label>
                                        </Dropdown.Item>
                                    );
                                })}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>
                </div>
                <div className={'config-item'}>
                    <h3 className='my-auto'>{t('services.translate.baidu.appid')}</h3>
                    <TextField
                        value={config['appid']}
                        onChange={(value) => {
                            setConfig({
                                ...config,
                                appid: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>
                <div className={'config-item'}>
                    <h3 className='my-auto'>{t('services.translate.baidu.secret')}</h3>
                    <TextField
                        value={config['secret']}
                        onChange={(value) => {
                            setConfig({
                                ...config,
                                secret: value,
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
