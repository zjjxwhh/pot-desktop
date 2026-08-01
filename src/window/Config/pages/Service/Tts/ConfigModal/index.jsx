import { Modal, useOverlayState, Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import React from 'react';

import {
    ServiceSourceType,
    getServiceName,
    getServiceSouceType,
    whetherPluginService,
} from '../../../../../../utils/service_instance';
import * as builtinServices from '../../../../../../services/tts';
import { PluginConfig } from '../../PluginConfig';

export default function ConfigModal(props) {
    const { serviceInstanceKey, pluginList, isOpen, onOpenChange, updateServiceInstanceList } = props;
    const state = useOverlayState({ isOpen, onOpenChange });

    const serviceSourceType = getServiceSouceType(serviceInstanceKey);
    const pluginServiceFlag = whetherPluginService(serviceInstanceKey);
    const serviceName = getServiceName(serviceInstanceKey);
    const { t } = useTranslation();
    const ConfigComponent = pluginServiceFlag ? PluginConfig : builtinServices[serviceName].Config;

    return pluginServiceFlag && !(serviceName in pluginList) ? (
        <></>
    ) : (
        <Modal
            state={state}
        >
            <Modal.Backdrop>
                <Modal.Container scroll='inside'>
                    <Modal.Dialog className='max-h-[75vh]'>
                        {({ close }) => (
                            <>
                                <Modal.Header>
                                    {serviceSourceType === ServiceSourceType.BUILDIN && (
                                        <>
                                            <img
                                                src={builtinServices[serviceName].info.icon}
                                                className='h-[24px] w-[24px] my-auto'
                                                draggable={false}
                                            />
                                            <div className='w-2' />
                                            <Modal.Heading>{t(`services.tts.${serviceName}.title`)}</Modal.Heading>
                                        </>
                                    )}
                                    {pluginServiceFlag && (
                                        <>
                                            <img
                                                src={pluginList[serviceName].icon}
                                                className='h-[24px] w-[24px] my-auto'
                                                draggable={false}
                                            />
                                            <div className='w-2' />
                                            <Modal.Heading>{`${pluginList[serviceName].display} [${t('common.plugin')}]`}</Modal.Heading>
                                        </>
                                    )}
                                </Modal.Header>
                                <Modal.Body>
                                    <ConfigComponent
                                        name={serviceName}
                                        instanceKey={serviceInstanceKey}
                                        pluginType='translate'
                                        pluginList={pluginList}
                                        updateServiceList={updateServiceInstanceList}
                                        onClose={close}
                                    />
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button
                                        variant='danger-soft'
                                        onPress={close}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                </Modal.Footer>
                            </>
                        )}
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
