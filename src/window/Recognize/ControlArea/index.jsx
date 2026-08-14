import { Dropdown, Button, Label } from '@heroui/react';
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';
import { fetch } from '@tauri-apps/plugin-http';
import { useTranslation } from 'react-i18next';
import { IconLanguage, IconRefresh } from '@tabler/icons-react';
import React, { useEffect } from 'react';
import { nanoid } from 'nanoid';
import * as builtinService from '../../../services/recognize';
import { languageList, LanguageFlag } from '../../../utils/language';
import { useConfig } from '../../../hooks';
import { textAtom } from '../TextArea';
import { pluginListAtom } from '..';
import { osType } from '../../../utils/env';
import {
    ServiceSourceType,
    getServiceSouceType,
    getServiceName,
    INSTANCE_NAME_CONFIG_KEY,
    getDisplayInstanceName,
} from '../../../utils/service_instance';

export const currentServiceInstanceKeyAtom = atom();
export const languageAtom = atom();
export const recognizeFlagAtom = atom();

export default function ControlArea(props) {
    const { serviceInstanceConfigMap, serviceInstanceList } = props;
    const pluginList = useAtomValue(pluginListAtom);
    const [recognizeLanguage] = useConfig('recognize_language', 'auto');
    const [serverPort] = useConfig('server_port', 60828);
    const setRecognizeFlag = useSetAtom(recognizeFlagAtom);
    const [currentServiceInstanceKey, setCurrentServiceInstanceKey] = useAtom(currentServiceInstanceKeyAtom);
    const [language, setLanguage] = useAtom(languageAtom);
    const text = useAtomValue(textAtom);
    const { t } = useTranslation();

    function getInstanceName(instanceKey, serviceNameSupplier) {
        const instanceConfig = serviceInstanceConfigMap[instanceKey] ?? {};
        return getDisplayInstanceName(instanceConfig[INSTANCE_NAME_CONFIG_KEY], serviceNameSupplier);
    }

    useEffect(() => {
        if (serviceInstanceList) {
            setCurrentServiceInstanceKey(serviceInstanceList[0]);
        }
        if (recognizeLanguage) {
            setLanguage(recognizeLanguage);
        }
    }, [serviceInstanceList, recognizeLanguage]);

    const getServiceIcon = (instanceKey) => {
        return getServiceSouceType(instanceKey) === ServiceSourceType.PLUGIN
            ? pluginList[getServiceName(instanceKey)].icon
            : builtinService[getServiceName(instanceKey)].info.icon === 'system'
              ? `logo/${osType}.svg`
              : builtinService[getServiceName(instanceKey)].info.icon;
    };
    const getServiceDisplayName = (instanceKey) => {
        return getServiceSouceType(instanceKey) === ServiceSourceType.PLUGIN
            ? getInstanceName(instanceKey, () => pluginList[getServiceName(instanceKey)].display)
            : getInstanceName(instanceKey, () => t(`services.recognize.${instanceKey}.title`));
    };

    return (
        <div className='flex justify-between px-3 h-full'>
            {currentServiceInstanceKey && (
                <Dropdown>
                    <Button
                        className='my-auto'
                        variant='tertiary'
                        size='sm'
                    >
                        <img
                            className='size-4 shrink-0 my-auto'
                            src={getServiceIcon(currentServiceInstanceKey)}
                        />
                        {getServiceDisplayName(currentServiceInstanceKey)}
                    </Button>
                    <Dropdown.Popover>
                        <Dropdown.Menu
                            className='max-h-[70vh] overflow-y-auto'
                            onAction={(key) => {
                                setCurrentServiceInstanceKey(key);
                            }}
                        >
                            {serviceInstanceList.map((instanceKey) => {
                                const name = getServiceDisplayName(instanceKey);
                                return (
                                    <Dropdown.Item
                                        key={instanceKey}
                                        id={instanceKey}
                                        textValue={name}
                                    >
                                        <img
                                            className='size-4 shrink-0 my-auto'
                                            src={getServiceIcon(instanceKey)}
                                        />
                                        <Label>{name}</Label>
                                    </Dropdown.Item>
                                );
                            })}
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown>
            )}
            {language && (
                <Dropdown>
                    <Button
                        className='my-auto'
                        variant='tertiary'
                        size='sm'
                    >
                        <span className={`fi fi-${LanguageFlag[language]}`} />
                        {t(`languages.${language}`)}
                    </Button>
                    <Dropdown.Popover>
                        <Dropdown.Menu
                            className='max-h-[70vh] overflow-y-auto'
                            onAction={(key) => {
                                setLanguage(key);
                            }}
                        >
                            <Dropdown.Item key='auto' id='auto' textValue={t('languages.auto')}>
                                <span className={`fi fi-${LanguageFlag.auto}`} />
                                <Label>{t('languages.auto')}</Label>
                            </Dropdown.Item>
                            {languageList.map((name) => {
                                const label = t(`languages.${name}`);
                                return (
                                    <Dropdown.Item key={name} id={name} textValue={label}>
                                        <span className={`fi fi-${LanguageFlag[name]}`} />
                                        <Label>{label}</Label>
                                    </Dropdown.Item>
                                );
                            })}
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown>
            )}
            <Button
                variant='tertiary'
                size='sm'
                className='my-auto'
                onPress={() => {
                    setRecognizeFlag(nanoid());
                }}
            >
                <IconRefresh />
                {t('recognize.recognize')}
            </Button>
            <Button
                size='sm'
                className='my-auto'
                onPress={async () => {
                    if (text) {
                        void fetch(`http://127.0.0.1:${serverPort}/translate`, {
                            method: 'POST',
                            body: text,
                        });
                    }
                }}
            >
                <IconLanguage />
                {t('recognize.translate')}
            </Button>
        </div>
    );
}
