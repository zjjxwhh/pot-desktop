import { useTranslation } from 'react-i18next';
import { Button } from '@heroui/react';
import React from 'react';

export function Config(props) {
    const { updateServiceList, onClose } = props;
    const { t } = useTranslation();

    return (
        <>
            <div className='mb-2'>{t('services.no_need')}</div>
            <div>
                <Button
                    fullWidth
                    variant='primary'
                    onPress={() => {
                        updateServiceList('ecdict');
                        onClose();
                    }}
                >
                    {t('common.save')}
                </Button>
            </div>
        </>
    );
}
