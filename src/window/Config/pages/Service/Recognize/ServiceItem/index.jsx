import { IconEdit, IconGripVertical, IconTrash } from '@tabler/icons-react';
import { Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import React from 'react';

import {
    INSTANCE_NAME_CONFIG_KEY,
    ServiceSourceType,
    getServiceName,
    getServiceSouceType,
} from '../../../../../../utils/service_instance';
import * as builtinServices from '../../../../../../services/recognize';
import { osType } from '../../../../../../utils/env';
import { useConfig } from '../../../../../../hooks';

export default function ServiceItem(props) {
    const { serviceInstanceKey, pluginList, deleteServiceInstance, setCurrentConfigKey, onConfigOpen, ...drag } = props;
    const { t } = useTranslation();

    const [serviceInstanceConfig, setServiceInstanceConfig] = useConfig(serviceInstanceKey, {});

    const serviceSourceType = getServiceSouceType(serviceInstanceKey);
    const serviceName = getServiceName(serviceInstanceKey);

    return serviceSourceType === ServiceSourceType.PLUGIN && !(serviceName in pluginList) ? (
        <></>
    ) : (
        serviceInstanceConfig !== null && (
            <div className='bg-surface-secondary rounded-2xl px-2.5 py-3.75 flex justify-between'>
                <div className='flex'>
                    <div
                        {...drag}
                        className='text-2xl my-auto'
                    >
                        <IconGripVertical />
                    </div>

                    <div className='w-2' />
                    {serviceSourceType === ServiceSourceType.BUILDIN && (
                        <>
                            <img
                                src={
                                    serviceName === 'system'
                                        ? `logo/${osType}.svg`
                                        : builtinServices[serviceName].info.icon
                                }
                                className='size-6 shrink-0 my-auto'
                                draggable={false}
                            />
                            <div className='w-2' />
                            <h2 className='my-auto'>
                                {serviceInstanceConfig[INSTANCE_NAME_CONFIG_KEY] ||
                                    t(`services.recognize.${serviceName}.title`)}
                            </h2>
                        </>
                    )}
                    {serviceSourceType === ServiceSourceType.PLUGIN && (
                        <>
                            <img
                                src={pluginList[serviceName].icon}
                                className='size-6 shrink-0 my-auto'
                                draggable={false}
                            />
                            <div className='w-2' />
                            <h2 className='my-auto'>{`${serviceInstanceConfig[INSTANCE_NAME_CONFIG_KEY] || pluginList[serviceName].display} [${t('common.plugin')}]`}</h2>
                        </>
                    )}
                </div>
                <div className='flex'>
                    <Button
                        isIconOnly
                        size='sm'
                        className='my-auto'
                        variant='tertiary'
                        onPress={() => {
                            setCurrentConfigKey(serviceInstanceKey);
                            onConfigOpen();
                        }}
                    >
                        <IconEdit />
                    </Button>
                    <div className='w-2' />
                    <Button
                        isIconOnly
                        size='sm'
                        className='my-auto'
                        variant='danger-soft'
                        onPress={() => {
                            deleteServiceInstance(serviceInstanceKey);
                        }}
                    >
                        <IconTrash />
                    </Button>
                </div>
            </div>
        )
    );
}
