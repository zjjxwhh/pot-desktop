import { readDir, BaseDirectory, readTextFile, exists } from '@tauri-apps/plugin-fs';
import { listen } from '@tauri-apps/api/event';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@heroui/react';
import { appConfigDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import React, { useEffect, useState } from 'react';
import Translate from './Translate';
import Recognize from './Recognize';
import Collection from './Collection';
import Tts from './Tts';
import { ServiceType } from '../../../../utils/service_instance';

let unlisten = null;

export default function Service() {
    const [pluginList, setPluginList] = useState(null);
    const { t } = useTranslation();

    const loadPluginList = async () => {
        const serviceTypeList = ['translate', 'tts', 'recognize', 'collection'];
        let temp = {};
        for (const serviceType of serviceTypeList) {
            temp[serviceType] = {};
            if (await exists(`plugins/${serviceType}`, { baseDir: BaseDirectory.AppConfig })) {
                const plugins = await readDir(`plugins/${serviceType}`, { baseDir: BaseDirectory.AppConfig });
                for (const plugin of plugins) {
                    const infoStr = await readTextFile(`plugins/${serviceType}/${plugin.name}/info.json`, {
                        baseDir: BaseDirectory.AppConfig,
                    });
                    let pluginInfo = JSON.parse(infoStr);
                    if ('icon' in pluginInfo) {
                        const appConfigDirPath = await appConfigDir();
                        const iconPath = await join(
                            appConfigDirPath,
                            `/plugins/${serviceType}/${plugin.name}/${pluginInfo.icon}`
                        );
                        pluginInfo.icon = convertFileSrc(iconPath);
                    }
                    temp[serviceType][plugin.name] = pluginInfo;
                }
            }
        }
        setPluginList({ ...temp });
    };

    useEffect(() => {
        loadPluginList();
        if (unlisten) {
            unlisten.then((f) => {
                f();
            });
        }
        unlisten = listen('reload_plugin_list', loadPluginList);
        return () => {
            if (unlisten) {
                unlisten.then((f) => {
                    f();
                });
            }
        };
    }, []);
    return (
        pluginList !== null && (
            <Tabs className='flex justify-center max-h-[calc(100%)] overflow-y-auto'>
                <Tabs.ListContainer className={'mx-15'}>
                    <Tabs.List aria-label='Service tabs'>
                        <Tabs.Tab id='translate'>
                            {t(`config.service.translate`)}
                            <Tabs.Indicator />
                        </Tabs.Tab>
                        <Tabs.Tab id='recognize'>
                            {t(`config.service.recognize`)}
                            <Tabs.Indicator />
                        </Tabs.Tab>
                        <Tabs.Tab id='tts'>
                            {t(`config.service.tts`)}
                            <Tabs.Indicator />
                        </Tabs.Tab>
                        <Tabs.Tab id='collection'>
                            {t(`config.service.collection`)}
                            <Tabs.Indicator />
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs.ListContainer>
                <Tabs.Panel id='translate'>
                    <Translate pluginList={pluginList[ServiceType.TRANSLATE]} />
                </Tabs.Panel>
                <Tabs.Panel id='recognize'>
                    <Recognize pluginList={pluginList[ServiceType.RECOGNIZE]} />
                </Tabs.Panel>
                <Tabs.Panel id='tts'>
                    <Tts pluginList={pluginList[ServiceType.TTS]} />
                </Tabs.Panel>
                <Tabs.Panel id='collection'>
                    <Collection pluginList={pluginList[ServiceType.COLLECTION]} />
                </Tabs.Panel>
            </Tabs>
        )
    );
}
