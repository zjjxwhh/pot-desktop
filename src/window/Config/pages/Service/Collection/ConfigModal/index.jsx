import { Modal, useOverlayState, Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useId, useState } from 'react';

import {
    ServiceSourceType,
    getServiceName,
    getServiceSouceType,
    whetherPluginService,
} from '../../../../../../utils/service_instance';
import * as builtinServices from '../../../../../../services/collection';
import { PluginConfig } from '../../PluginConfig';

export default function ConfigModal(props) {
    const { serviceInstanceKey, pluginList, isOpen, onOpenChange, updateServiceInstanceList } = props;
    const state = useOverlayState({ isOpen, onOpenChange });
    const formId = useId();
    const [savePending, setSavePending] = useState(false);

    // 切换服务实例或开关模态框时重置模态框级状态：savePending
    useEffect(() => {
        setSavePending(false);
    }, [serviceInstanceKey, isOpen]);

    const serviceSourceType = getServiceSouceType(serviceInstanceKey);
    const pluginServiceFlag = whetherPluginService(serviceInstanceKey);
    const serviceName = getServiceName(serviceInstanceKey);
    const { t } = useTranslation();
    const ConfigComponent = pluginServiceFlag ? PluginConfig : builtinServices[serviceName].Config;

    return pluginServiceFlag && !(serviceName in pluginList) ? (
        <></>
    ) : (
        <Modal state={state}>
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
                                                className='size-6 shrink-0 my-auto'
                                                draggable={false}
                                            />
                                            <div className='w-2' />
                                            <Modal.Heading>
                                                {t(`services.collection.${serviceName}.title`)}
                                            </Modal.Heading>
                                        </>
                                    )}
                                    {pluginServiceFlag && (
                                        <>
                                            <img
                                                src={pluginList[serviceName].icon}
                                                className='size-6 shrink-0 my-auto'
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
                                        pluginType='collection'
                                        pluginList={pluginList}
                                        updateServiceList={updateServiceInstanceList}
                                        onClose={close}
                                        formId={formId}
                                        setSavePending={setSavePending}
                                    />
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button
                                        type='submit'
                                        form={formId}
                                        isPending={savePending}
                                        variant='primary'
                                    >
                                        {t('common.save')}
                                    </Button>
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
