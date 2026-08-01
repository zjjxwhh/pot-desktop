import { Card, Button, Dropdown, Label } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { BiTransferAlt } from 'react-icons/bi';
import React, { useEffect } from 'react';
import { atom, useAtom, useAtomValue } from 'jotai';

import { languageList, LanguageFlag } from '../../../../utils/language';
import { detectLanguageAtom } from '../SourceArea';
import { useConfig } from '../../../../hooks';

export const sourceLanguageAtom = atom();
export const targetLanguageAtom = atom();

export default function LanguageArea() {
    const [rememberLanguage] = useConfig('translate_remember_language', false);
    const [translateSourceLanguage, setTranslateSourceLanguage] = useConfig('translate_source_language', 'auto');
    const [translateTargetLanguage, setTranslateTargetLanguage] = useConfig('translate_target_language', 'zh_cn');
    const [translateSecondLanguage] = useConfig('translate_second_language', 'en');

    const [sourceLanguage, setSourceLanguage] = useAtom(sourceLanguageAtom);
    const [targetLanguage, setTargetLanguage] = useAtom(targetLanguageAtom);
    const detectLanguage = useAtomValue(detectLanguageAtom);
    const { t } = useTranslation();

    useEffect(() => {
        if (translateSourceLanguage) {
            setSourceLanguage(translateSourceLanguage);
        }
        if (translateTargetLanguage) {
            setTargetLanguage(translateTargetLanguage);
        }
    }, [translateSourceLanguage, translateTargetLanguage]);

    useEffect(() => {
        if (rememberLanguage !== null && rememberLanguage) {
            setTranslateSourceLanguage(sourceLanguage);
            setTranslateTargetLanguage(targetLanguage);
        }
    }, [sourceLanguage, targetLanguage, rememberLanguage]);

    return (
        <Card className='bg-surface-secondary gap-0 overflow-hidden p-0 h-[35px]'>
            <Card.Footer className='bg-surface-secondary flex h-full justify-between p-0 rounded-[10px]'>
                <div className='flex'>
                    <Dropdown>
                        <Button
                            variant='tertiary'
                            className='rounded-sm'
                        >
                            <span className={`fi fi-${LanguageFlag[sourceLanguage]}`} />
                            {t(`languages.${sourceLanguage}`)}
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu
                                aria-label='Source Language'
                                className='max-h-[50vh] overflow-y-auto'
                                onAction={(key) => {
                                    setSourceLanguage(key);
                                }}
                            >
                                <Dropdown.Item id='auto' textValue={t('languages.auto')}>
                                    <span className={`fi fi-${LanguageFlag.auto}`} />
                                    <Label>{t('languages.auto')}</Label>
                                </Dropdown.Item>
                                {languageList.map((x) => {
                                    return (
                                        <Dropdown.Item id={x} textValue={t(`languages.${x}`)} key={x}>
                                            <span className={`fi fi-${LanguageFlag[x]}`} />
                                            <Label>{t(`languages.${x}`)}</Label>
                                        </Dropdown.Item>
                                    );
                                })}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>
                </div>
                <div className='flex h-full self-stretch'>
                    <Button
                        isIconOnly
                        size='lg'
                        variant='tertiary'
                        className='h-full text-[20px]'
                        onPress={async () => {
                            if (sourceLanguage !== 'auto') {
                                const oldSourceLanguage = sourceLanguage;
                                setSourceLanguage(targetLanguage);
                                setTargetLanguage(oldSourceLanguage);
                            } else {
                                if (detectLanguage !== '') {
                                    if (targetLanguage === translateTargetLanguage) {
                                        setTargetLanguage(detectLanguage);
                                    } else {
                                        setTargetLanguage(translateTargetLanguage);
                                    }
                                } else {
                                    if (targetLanguage === translateSecondLanguage) {
                                        setTargetLanguage(translateTargetLanguage);
                                    } else {
                                        setTargetLanguage(secondLanguage);
                                    }
                                }
                            }
                        }}
                    >
                        <BiTransferAlt />
                    </Button>
                </div>
                <div className='flex'>
                    <Dropdown>
                        <Button
                            variant='tertiary'
                            className='rounded-sm'
                        >
                            <span className={`fi fi-${LanguageFlag[targetLanguage]}`} />
                            {t(`languages.${targetLanguage}`)}
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu
                                aria-label='Target Language'
                                className='max-h-[50vh] overflow-y-auto'
                                onAction={(key) => {
                                    setTargetLanguage(key);
                                }}
                            >
                                {languageList.map((x) => {
                                    return (
                                        <Dropdown.Item id={x} textValue={t(`languages.${x}`)} key={x}>
                                            <span className={`fi fi-${LanguageFlag[x]}`} />
                                            <Label>{t(`languages.${x}`)}</Label>
                                        </Dropdown.Item>
                                    );
                                })}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>
                </div>
            </Card.Footer>
        </Card>
    );
}
