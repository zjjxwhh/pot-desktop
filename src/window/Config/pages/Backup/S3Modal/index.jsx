import { Modal, Button, Skeleton, toast } from '@heroui/react';
import React, { useEffect, useState } from 'react';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import * as s3 from '../utils/s3';

export default function S3Modal(props) {
    const { state, endpoint, region, bucket, accessKey, secretKey, pathStyle } = props;
    const [s3List, setS3List] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState([]);

    const { t } = useTranslation();

    useEffect(() => {
        if (state.isOpen) {
            setLoading(true);
            s3.list(endpoint, region, bucket, accessKey, secretKey, pathStyle).then(
                (v) => {
                    setS3List(v);
                    setDownloading(
                        v.map(() => {
                            return false;
                        })
                    );
                    setLoading(false);
                },
                (e) => {
                    toast.danger(e.toString());
                    setLoading(false);
                }
            );
        }
    }, [state.isOpen]);

    const getBackup = async (name, onClose) => {
        s3.get(endpoint, region, bucket, accessKey, secretKey, pathStyle, name).then(
            () => {
                setDownloading(
                    downloading.map(() => {
                        return false;
                    })
                );
                toast.success(t('config.backup.load_success'));
                onClose();
            },
            (e) => {
                setDownloading(
                    downloading.map(() => {
                        return false;
                    })
                );
                toast.danger(e.toString());
                onClose();
            }
        );
    };
    return (
        <>
            <Modal state={state}>
                <Modal.Backdrop>
                    <Modal.Container scroll='inside'>
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
                                        ) : s3List.length === 0 ? (
                                            <h2>{t('config.backup.empty')}</h2>
                                        ) : (
                                            <div>
                                                {s3List.map((file, index) => {
                                                    return (
                                                        <div
                                                            className='flex justify-between gap-2 mb-2'
                                                            key={file}
                                                        >
                                                            <Button
                                                                fullWidth
                                                                variant='tertiary'
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
                                                                className='shrink-0'
                                                                onPress={() => {
                                                                    s3.remove(endpoint, region, bucket, accessKey, secretKey, pathStyle, file).then(
                                                                        () => {
                                                                            setS3List(
                                                                                s3List.filter((_, i) => {
                                                                                    return i !== index;
                                                                                })
                                                                            );
                                                                        },
                                                                        (e) => {
                                                                            toast.danger(e.toString());
                                                                        }
                                                                    );
                                                                }}
                                                            >
                                                                <IconTrash />
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
        </>
    );
}
