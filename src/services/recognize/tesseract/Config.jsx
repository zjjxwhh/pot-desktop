import { useTranslation } from 'react-i18next';
import React from 'react';

export function Config(props) {
    const { updateServiceList, onClose, formId } = props;
    const { t } = useTranslation();

    return (
        <form
            id={formId}
            onSubmit={(e) => {
                e.preventDefault();
                updateServiceList('tesseract');
                onClose();
            }}
        >
            <div className='mb-2'>{t('services.no_need')}</div>
        </form>
    );
}
