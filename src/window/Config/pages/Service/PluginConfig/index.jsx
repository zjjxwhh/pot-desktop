import { INSTANCE_NAME_CONFIG_KEY } from '../../../../../utils/service_instance';
import { Button, Input, TextField, Label, Dropdown } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-shell';
import React from 'react';

import { useConfig } from '../../../../../hooks';

export function PluginConfig(props) {
    const { instanceKey, updateServiceList, onClose, name, pluginList, formId } = props;
    const [pluginConfig, setPluginConfig] = useConfig(instanceKey, {}, { sync: false });
    const { t } = useTranslation();

    return (
        <form
            id={formId}
            onSubmit={(e) => {
                e.preventDefault();
                setPluginConfig(pluginConfig, true);
                updateServiceList(instanceKey);
                onClose();
            }}
        >
            <div className={'config-item'}>
                <h3 className='my-auto select-none cursor-default'>{t('config.service.homepage')}</h3>
                <Button
                    onPress={() => {
                        open(pluginList[name].homepage);
                    }}
                >
                    {t('config.service.homepage')}
                </Button>
            </div>
            {pluginConfig && (
                <div className='config-item'>
                    <TextField
                        value={pluginConfig[INSTANCE_NAME_CONFIG_KEY] ?? pluginList[name].display}
                        onChange={(value) => {
                            setPluginConfig({
                                ...pluginConfig,
                                [INSTANCE_NAME_CONFIG_KEY]: value,
                            });
                        }}
                    >
                        <Label>{t('services.instance_name')}</Label>
                        <Input variant='secondary' />
                    </TextField>
                </div>
            )}

            {pluginList[name].needs.length === 0 ? (
                <div className='mb-2'>{t('services.no_need')}</div>
            ) : (
                pluginList[name].needs.map((x) => {
                    return (
                        pluginConfig &&
                        (x.type ? (
                            <div
                                key={x.key}
                                className={`config-item`}
                            >
                                <h3 className='my-auto select-none cursor-default'>{x.display}</h3>
                                {x.type === 'input' && (
                                    <TextField
                                        className='max-w-[50%]'
                                        value={`${pluginConfig.hasOwnProperty(x.key) ? pluginConfig[x.key] : ''}`}
                                        onChange={(value) => {
                                            setPluginConfig({
                                                ...pluginConfig,
                                                [x.key]: value,
                                            });
                                        }}
                                    >
                                        <Input variant='secondary' />
                                    </TextField>
                                )}
                                {x.type === 'select' && (
                                    <Dropdown>
                                        <Button
                                            variant='tertiary'
                                            className='max-w-[50%]'
                                        >
                                            {
                                                x.options[
                                                    pluginConfig.hasOwnProperty(x.key)
                                                        ? pluginConfig[x.key]
                                                        : Object.keys(x.options)[0]
                                                ]
                                            }
                                        </Button>
                                        <Dropdown.Popover>
                                            <Dropdown.Menu
                                                className='max-h-[40vh] overflow-y-auto'
                                                onAction={(key) => {
                                                    setPluginConfig({
                                                        ...pluginConfig,
                                                        [x.key]: key,
                                                    });
                                                }}
                                            >
                                                {Object.keys(x.options).map((y) => {
                                                    return (
                                                        <Dropdown.Item
                                                            key={y}
                                                            id={y}
                                                            textValue={x.options[y]}
                                                        >
                                                            <Label>{x.options[y]}</Label>
                                                        </Dropdown.Item>
                                                    );
                                                })}
                                            </Dropdown.Menu>
                                        </Dropdown.Popover>
                                    </Dropdown>
                                )}
                            </div>
                        ) : (
                            <div
                                key={x.key}
                                className={`config-item`}
                            >
                                <h3 className='my-auto select-none cursor-default'>{x.display}</h3>
                                <TextField
                                    className='max-w-[50%]'
                                    value={`${pluginConfig.hasOwnProperty(x.key) ? pluginConfig[x.key] : ''}`}
                                    onChange={(value) => {
                                        setPluginConfig({
                                            ...pluginConfig,
                                            [x.key]: value,
                                        });
                                    }}
                                >
                                    <Input variant='secondary' />
                                </TextField>
                            </div>
                        ))
                    );
                })
            )}
        </form>
    );
}
