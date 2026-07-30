import { Modal, Button, Skeleton } from '@heroui/react';
import React, { useEffect, useState } from 'react';
import { MdDeleteOutline } from 'react-icons/md';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useToastStyle } from '../../../../../hooks';
import * as webdav from '../utils/webdav';

export default function WebDavModal(props) {
    const { state, url, username, password } = props;
    const [webdavList, setWebdavList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState([]);

    const { t } = useTranslation();
    const toastStyle = useToastStyle();

    useEffect(() => {
        if (state.isOpen) {
            setLoading(true);
            webdav.list(url, username, password).then(
                (v) => {
                    setWebdavList(v);
                    setDownloading(
                        v.map(() => {
                            return false;
                        })
                    );
                    setLoading(false);
                },
                (e) => {
                    toast.error(e.toString(), { style: toastStyle });
                    setLoading(false);
                }
            );
        }
    }, [state.isOpen]);

    const getBackup = async (name, onClose) => {
        webdav.get(url, username, password, name).then(
            () => {
                setDownloading(
                    downloading.map(() => {
                        return false;
                    })
                );
                toast.success(t('config.backup.load_success'), { style: toastStyle });
                onClose();
            },
            (e) => {
                setDownloading(
                    downloading.map(() => {
                        return false;
                    })
                );
                toast.error(e.toString(), { style: toastStyle });
                onClose();
            }
        );
    };
    return (
        <>
            <Modal state={state} scrollBehavior='inside'>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog>
                            {({ close }) => (
                                <>
                                    <Modal.Header>
                                        <Modal.Heading>{t('config.backup.list')}</Modal.Heading>
                                    </Modal.Header>
                                    <Modal.Body className='max-h-[80vh]'>
                                        {loading ? (
                                            <div className='space-y-3'>
                                                <Skeleton className='w-4/5 rounded-lg'>
                                                    <div className='h-3 w-4/5 rounded-lg bg-surface-secondary'></div>
                                                </Skeleton>
                                                <Skeleton className='w-3/5 rounded-lg'>
                                                    <div className='h-3 w-3/5 rounded-lg bg-surface-secondary'></div>
                                                </Skeleton>
                                            </div>
                                        ) : webdavList.length === 0 ? (
                                            <h2>{t('config.backup.empty')}</h2>
                                        ) : (
                                            <div>
                                                {webdavList.map((file, index) => {
                                                    return (
                                                        <div
                                                            className='flex justify-between'
                                                            key={file}
                                                        >
                                                            <Button
                                                                fullWidth
                                                                variant='tertiary'
                                                                className='mb-[8px] mr-[8px]'
                                                                isPending={downloading[index]}
                                                                onPress={async () => {
                                                                    setDownloading(
                                                                        downloading.map((_, i) => {
                                                                            return i === index;
                                                                        })
                                                                    );
                                                                    await getBackup(file, close);
                                                                }}
                                                            >
                                                                {file}
                                                            </Button>
                                                            <Button
                                                                isIconOnly
                                                                variant='danger-soft'
                                                                onPress={() => {
                                                                    webdav.remove(url, username, password, file).then(
                                                                        () => {
                                                                            setWebdavList(
                                                                                webdavList.filter((_, i) => {
                                                                                    return i !== index;
                                                                                })
                                                                            );
                                                                        },
                                                                        (e) => {
                                                                            toast.error(e.toString(), { style: toastStyle });
                                                                        }
                                                                    );
                                                                }}
                                                            >
                                                                <MdDeleteOutline className='text-xl' />
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </Modal.Body>
                                </>
                            )}
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
            <Toaster />
        </>
    );
}
