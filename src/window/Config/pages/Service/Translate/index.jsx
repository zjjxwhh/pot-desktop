import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Card, Button, useOverlayState } from '@heroui/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';

import { useToastStyle } from '../../../../../hooks';
import SelectPluginModal from '../SelectPluginModal';
import { osType } from '../../../../../utils/env';
import { useConfig, deleteKey } from '../../../../../hooks';
import ServiceItem from './ServiceItem';
import SelectModal from './SelectModal';
import ConfigModal from './ConfigModal';

export default function Translate(props) {
    const { pluginList } = props;
    const selectPluginState = useOverlayState();
    const selectState = useOverlayState();
    const configState = useOverlayState();
    const [currentConfigKey, setCurrentConfigKey] = useState('deepl');
    // now it's service instance list
    const [translateServiceInstanceList, setTranslateServiceInstanceList] = useConfig('translate_service_list', [
        'deepl',
        'bing',
        'lingva',
        'yandex',
        'google',
        'ecdict',
    ]);

    const { t } = useTranslation();
    const toastStyle = useToastStyle();

    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };
    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const items = reorder(translateServiceInstanceList, result.source.index, result.destination.index);
        setTranslateServiceInstanceList(items);
    };

    const deleteServiceInstance = (instanceKey) => {
        if (translateServiceInstanceList.length === 1) {
            toast.error(t('config.service.least'), { style: toastStyle });
            return;
        } else {
            setTranslateServiceInstanceList(translateServiceInstanceList.filter((x) => x !== instanceKey));
            deleteKey(instanceKey);
        }
    };
    const updateServiceInstanceList = (instanceKey) => {
        if (translateServiceInstanceList.includes(instanceKey)) {
            return;
        } else {
            const newList = [...translateServiceInstanceList, instanceKey];
            setTranslateServiceInstanceList(newList);
        }
    };

    return (
        <>
            <Toaster />
            <Card
                className={`${
                    osType === 'linux' ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-120px)]'
                } overflow-y-auto p-5 flex justify-between`}
            >
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable
                        droppableId='droppable'
                        direction='vertical'
                    >
                        {(provided) => (
                            <div
                                className='overflow-y-auto h-full'
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {translateServiceInstanceList !== null &&
                                    translateServiceInstanceList.map((x, i) => {
                                        return (
                                            <Draggable
                                                key={x}
                                                draggableId={x}
                                                index={i}
                                            >
                                                {(provided) => {
                                                    return (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                        >
                                                            <ServiceItem
                                                                {...provided.dragHandleProps}
                                                                key={x}
                                                                serviceInstanceKey={x}
                                                                pluginList={pluginList}
                                                                deleteServiceInstance={deleteServiceInstance}
                                                                setCurrentConfigKey={setCurrentConfigKey}
                                                                onConfigOpen={configState.open}
                                                            />
                                                            <div className='h-2' />
                                                        </div>
                                                    );
                                                }}
                                            </Draggable>
                                        );
                                    })}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <div className='h-2' />
                <div className='flex'>
                    <Button
                        fullWidth
                        onPress={selectState.open}
                    >
                        {t('config.service.add_builtin_service')}
                    </Button>
                    <div className='w-2' />
                    <Button
                        fullWidth
                        onPress={selectPluginState.open}
                    >
                        {t('config.service.add_external_service')}
                    </Button>
                </div>
            </Card>
            <SelectPluginModal
                isOpen={selectPluginState.isOpen}
                onOpenChange={selectPluginState.setOpen}
                setCurrentConfigKey={setCurrentConfigKey}
                onConfigOpen={configState.open}
                pluginType='translate'
                pluginList={pluginList}
                deleteService={deleteServiceInstance}
            />
            <SelectModal
                isOpen={selectState.isOpen}
                onOpenChange={selectState.setOpen}
                setCurrentConfigKey={setCurrentConfigKey}
                onConfigOpen={configState.open}
            />
            <ConfigModal
                serviceInstanceKey={currentConfigKey}
                pluginList={pluginList}
                isOpen={configState.isOpen}
                onOpenChange={configState.setOpen}
                updateServiceInstanceList={updateServiceInstanceList}
            />
        </>
    );
}
