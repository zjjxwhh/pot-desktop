import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Card, Button, useOverlayState } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';

import SelectPluginModal from '../SelectPluginModal';
import { useConfig, deleteKey } from '../../../../../hooks';
import ServiceItem from './ServiceItem';
import SelectModal from './SelectModal';
import ConfigModal from './ConfigModal';

export default function Collection(props) {
    const { pluginList } = props;
    const selectPluginState = useOverlayState();
    const selectState = useOverlayState();
    const configState = useOverlayState();
    const [currentConfigKey, setCurrentConfigKey] = useState('anki');
    // now it's service instance list
    const [collectionServiceInstanceList, setCollectionServiceInstanceList] = useConfig('collection_service_list', []);

    const { t } = useTranslation();

    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };
    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const items = reorder(collectionServiceInstanceList, result.source.index, result.destination.index);
        setCollectionServiceInstanceList(items);
    };

    const deleteServiceInstance = (instanceKey) => {
        setCollectionServiceInstanceList(collectionServiceInstanceList.filter((x) => x !== instanceKey));
        deleteKey(instanceKey);
    };
    const updateServiceInstanceList = (instanceKey) => {
        if (collectionServiceInstanceList.includes(instanceKey)) {
            return;
        } else {
            const newList = [...collectionServiceInstanceList, instanceKey];
            setCollectionServiceInstanceList(newList);
        }
    };

    return (
        <>
            <Card className={'h-full overflow-y-auto p-5 flex justify-between'}>
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
                                {collectionServiceInstanceList !== null &&
                                    collectionServiceInstanceList.map((x, i) => {
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
                pluginType='collection'
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
