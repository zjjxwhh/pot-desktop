import { Modal, useOverlayState, Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useId, useState } from 'react';

import * as builtinServices from '../../../../../../services/translate';
import { PluginConfig } from '../../PluginConfig';
import {
    ServiceSourceType,
    getServiceName,
    getServiceSouceType,
    whetherPluginService,
} from '../../../../../../utils/service_instance';
import { useConfig } from '../../../../../../hooks';
import { resolveServiceIcon } from '../../../../../../utils/service_icon';

// 标题栏图标单独成组件：ConfigModal 常驻挂载，而 useConfig 只在自身挂载时按 key 读取一次配置，
// 放在 ConfigModal 顶层会一直读到首个实例的配置。这里随模态框开关挂载/卸载，
// 并以 key 绑定实例，确保读到的始终是当前编辑实例的配置。
function ServiceIcon(props) {
    const { instanceKey, defaultIcon, draftIcon } = props;
    const [instanceConfig] = useConfig(instanceKey, {}, { persistDefault: false });

    // 配置读取完成前先占位，避免闪现默认图标
    if (instanceConfig === null && draftIcon === null) {
        return <div className='size-6 shrink-0 my-auto' />;
    }

    return (
        <img
            src={resolveServiceIcon(draftIcon === null ? instanceConfig : { icon: draftIcon }, defaultIcon)}
            className='size-6 shrink-0 my-auto'
            draggable={false}
        />
    );
}

export default function ConfigModal(props) {
    const { serviceInstanceKey, pluginList, isOpen, onOpenChange, updateServiceInstanceList } = props;
    const state = useOverlayState({ isOpen, onOpenChange });
    const formId = useId();
    const [savePending, setSavePending] = useState(false);
    // 未保存的图标草稿：Config 中变更图标后立刻预览，但要等到点击保存并测试通过才写入配置文件。
    // null 表示未变更，回退到已持久化的配置；'' 表示草稿为恢复默认图标。
    const [draftIcon, setDraftIcon] = useState(null);

    // 切换服务实例或开关模态框时重置模态框级状态：草稿图标 及 savePending
    useEffect(() => {
        setDraftIcon(null);
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
                                        <div className='flex items-center gap-3'>
                                            <ServiceIcon
                                                key={serviceInstanceKey}
                                                instanceKey={serviceInstanceKey}
                                                defaultIcon={builtinServices[serviceName].info.icon}
                                                draftIcon={draftIcon}
                                            />
                                            <Modal.Heading>
                                                {t(`services.translate.${serviceName}.title`)}
                                            </Modal.Heading>
                                        </div>
                                    )}
                                    {pluginServiceFlag && (
                                        <div className='flex items-center gap-3'>
                                            <img
                                                src={pluginList[serviceName].icon}
                                                className='size-6 shrink-0 my-auto'
                                                draggable={false}
                                            />
                                            <Modal.Heading>{`${pluginList[serviceName].display} [${t('common.plugin')}]`}</Modal.Heading>
                                        </div>
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
                                        formId={formId}
                                        setSavePending={setSavePending}
                                        setDraftIcon={setDraftIcon}
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
