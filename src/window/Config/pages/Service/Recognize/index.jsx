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

export default function Recognize(props) {
    const { pluginList } = props;
    const selectPluginState = useOverlayState();
    const selectState = useOverlayState();
    const configState = useOverlayState();
    const [currentConfigKey, setCurrentConfigKey] = useState('system');
    // now it's service instance list
    const [recognizeServiceInstanceList, setRecognizeServiceInstanceList] = useConfig('recognize_service_list', [
        'system',
        'tesseract',
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
        const items = reorder(recognizeServiceInstanceList, result.source.index, result.destination.index);
        setRecognizeServiceInstanceList(items);
    };

    const deleteServiceInstance = (instanceKey) => {
        if (recognizeServiceInstanceList.length === 1) {
            toast.error(t('config.service.least'), { style: toastStyle });
            return;
        } else {
            setRecognizeServiceInstanceList(recognizeServiceInstanceList.filter((x) => x !== instanceKey));
            deleteKey(instanceKey);
        }
    };
    const updateServiceInstanceList = (instanceKey) => {
        if (recognizeServiceInstanceList.includes(instanceKey)) {
            return;
        } else {
            const newList = [...recognizeServiceInstanceList, instanceKey];
            setRecognizeServiceInstanceList(newList);
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
                                {recognizeServiceInstanceList !== null &&
                                    recognizeServiceInstanceList.map((x, i) => {
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
                                                                serviceInstanceKey={x}
                                                                key={x}
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
                pluginType='recognize'
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
                isOpen={configState.isOpen}
                pluginList={pluginList}
                onOpenChange={configState.setOpen}
                updateServiceInstanceList={updateServiceInstanceList}
            />
        </>
    );
}
