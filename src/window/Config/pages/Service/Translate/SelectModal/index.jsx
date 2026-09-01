import { Button, Modal, Separator, useOverlayState } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import React, { useMemo } from 'react';

import * as builtinServices from '../../../../../../services/translate';
import {
    createServiceInstanceKey,
    getTranslateServiceCategory,
    TRANSLATE_SERVICE_CATEGORIES,
} from '../../../../../../utils/service_instance';

export default function SelectModal(props) {
    const { isOpen, onOpenChange, setCurrentConfigKey, onConfigOpen } = props;
    const state = useOverlayState({ isOpen, onOpenChange });
    const { t } = useTranslation();

    const serviceNamesByCategory = useMemo(() => {
        const grouped = Object.fromEntries(TRANSLATE_SERVICE_CATEGORIES.map((category) => [category, []]));
        for (const serviceName of Object.keys(builtinServices)) {
            grouped[getTranslateServiceCategory(builtinServices[serviceName].info)].push(serviceName);
        }
        return grouped;
    }, []);

    return (
        <Modal state={state}>
            <Modal.Backdrop>
                <Modal.Container scroll='inside'>
                    <Modal.Dialog className='max-h-[80vh]'>
                        {({ close }) => (
                            <>
                                <Modal.Header>
                                    <Modal.Heading>{t('config.service.add_service')}</Modal.Heading>
                                </Modal.Header>
                                <Modal.Body>
                                    {TRANSLATE_SERVICE_CATEGORIES.filter(
                                        (category) => serviceNamesByCategory[category].length > 0
                                    ).map((category) => {
                                        const headingId = `translate-category-${category}`;
                                        return (
                                            <div
                                                key={category}
                                                aria-labelledby={headingId}
                                                className='mt-4 first:mt-0'
                                            >
                                                <h3
                                                    id={headingId}
                                                    className='text-xs font-medium text-muted'
                                                >
                                                    {t(`config.service.translate_category.${category}`)}
                                                </h3>
                                                <Separator className='mt-1 mb-2' />
                                                {serviceNamesByCategory[category].map((x) => {
                                                    return (
                                                        <div key={x}>
                                                            <Button
                                                                fullWidth
                                                                variant='ghost'
                                                                className='mb-0.5'
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
                                                                    {t(
                                                                        `services.translate.${builtinServices[x].info.name}.title`
                                                                    )}
                                                                </div>
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
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
