import { Modal, useOverlayState, Button } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import React from 'react';

import { createServiceInstanceKey } from '../../../../../../utils/service_instance';
import * as builtinServices from '../../../../../../services/collection';

export default function SelectModal(props) {
    const { isOpen, onOpenChange, setCurrentConfigKey, onConfigOpen } = props;
    const state = useOverlayState({ isOpen, onOpenChange });
    const { t } = useTranslation();

    return (
        <Modal
            state={state}
        >
            <Modal.Backdrop>
                <Modal.Container scroll='inside'>
                    <Modal.Dialog className='max-h-[80vh]'>
                        {({ close }) => (
                            <>
                                <Modal.Header>
                                    <Modal.Heading>{t('config.service.add_service')}</Modal.Heading>
                                </Modal.Header>
                                <Modal.Body>
                                    {Object.keys(builtinServices).map((x) => {
                                        return (
                                            <div key={x}>
                                                <Button
                                                    fullWidth
                                                    variant='ghost'
                                                    className='mb-[2px]'
                                                    onPress={() => {
                                                        setCurrentConfigKey(createServiceInstanceKey(x));
                                                        onConfigOpen();
                                                    }}
                                                >
                                                    <img
                                                        src={builtinServices[x].info.icon}
                                                        className='size-6 shrink-0 my-auto'
                                                    />
                                                    <div className='w-full'>
                                                        {t(`services.collection.${builtinServices[x].info.name}.title`)}
                                                    </div>
                                                </Button>
                                            </div>
                                        );
                                    })}
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
