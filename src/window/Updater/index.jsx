import { Card, Button, ProgressBar, Skeleton, Label } from '@heroui/react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

import { useConfig, useToastStyle } from '../../hooks';
import { osType } from '../../utils/env';

const appWindow = getCurrentWebviewWindow();

export default function Updater() {
    const [transparent] = useConfig('transparent', true);
    const [downloaded, setDownloaded] = useState(0);
    const [total, setTotal] = useState(0);
    const [body, setBody] = useState('');
    const [update, setUpdate] = useState(null);
    const { t } = useTranslation();
    const toastStyle = useToastStyle();

    useEffect(() => {
        if (appWindow.label === 'updater') {
            appWindow.show();
        }
        check().then(
            (update) => {
                if (update && update.available) {
                    setUpdate(update);
                    setBody(update.body ?? '');
                } else {
                    setBody(t('updater.latest'));
                }
            },
            (e) => {
                setBody(e.toString());
                toast.error(e.toString(), { style: toastStyle });
            }
        );
    }, []);

    return (
        <div
            className={`${transparent ? 'bg-background/90' : 'bg-background'} h-screen ${
                osType === 'linux' && 'rounded-[10px] border-1 border-border'
            }`}
        >
            <Toaster />
            <div className='p-[5px] h-[35px] w-full select-none cursor-default'>
                <div
                    data-tauri-drag-region='true'
                    className={`h-full w-full flex ${osType === 'macos' ? 'justify-end' : 'justify-start'}`}
                >
                    <img
                        src='icon.png'
                        className='h-[25px] w-[25px] mr-[10px]'
                        draggable={false}
                    />
                    <h2>{t('updater.title')}</h2>
                </div>
            </div>
            <Card className='mx-[80px] mt-[10px] overscroll-auto h-[calc(100vh-125px)]'>
                <Card.Content className='h-full overflow-auto'>
                    {body === '' ? (
                        <div className='space-y-3'>
                            <Skeleton className='w-3/5 rounded-lg'>
                                <div className='h-3 w-3/5 rounded-lg bg-surface-secondary'></div>
                            </Skeleton>
                            <Skeleton className='w-4/5 rounded-lg'>
                                <div className='h-3 w-4/5 rounded-lg bg-surface-secondary'></div>
                            </Skeleton>
                            <Skeleton className='w-2/5 rounded-lg'>
                                <div className='h-3 w-2/5 rounded-lg bg-surface-tertiary'></div>
                            </Skeleton>
                        </div>
                    ) : (
                        <ReactMarkdown
                            className='markdown-body select-text'
                            components={{
                                code: ({ node, ...props }) => {
                                    const { children } = props;
                                    return (
                                        <code className='px-1 py-0.5 rounded bg-default text-foreground text-sm'>
                                            {children}
                                        </code>
                                    );
                                },
                                h2: ({ node, ...props }) => (
                                    <b>
                                        <h2
                                            className='text-[24px]'
                                            {...props}
                                        />
                                        <hr />
                                        <br />
                                    </b>
                                ),
                                h3: ({ node, ...props }) => (
                                    <b>
                                        <br />
                                        <h3
                                            className='text-[18px]'
                                            {...props}
                                        />
                                        <br />
                                    </b>
                                ),
                                li: ({ node, ...props }) => {
                                    const { children } = props;
                                    return (
                                        <li
                                            className='list-disc list-inside'
                                            children={children}
                                        />
                                    );
                                },
                            }}
                        >
                            {body}
                        </ReactMarkdown>
                    )}
                </Card.Content>
            </Card>
            {downloaded !== 0 && (
                <ProgressBar
                    aria-label='Downloading...'
                    value={(downloaded / total) * 100}
                    className='w-full px-[80px]'
                    size='sm'
                >
                    <Label>{t('updater.progress')}</Label>
                    <ProgressBar.Output />
                    <ProgressBar.Track>
                        <ProgressBar.Fill />
                    </ProgressBar.Track>
                </ProgressBar>
            )}

            <div className='grid gap-4 grid-cols-2 h-[50px] my-[10px] mx-[80px] place-items-center'>
                <Button
                    variant='tertiary'
                    isPending={downloaded !== 0}
                    isDisabled={downloaded !== 0}
                    onPress={() => {
                        if (!update) {
                            return;
                        }
                        update
                            .downloadAndInstall((event) => {
                                switch (event.event) {
                                    case 'Started':
                                        setTotal(event.data.contentLength ?? 0);
                                        break;
                                    case 'Progress':
                                        setDownloaded((a) => a + event.data.chunkLength);
                                        break;
                                    case 'Finished':
                                        break;
                                    default:
                                        break;
                                }
                            })
                            .then(
                                () => {
                                    toast.success(t('updater.installed'), { style: toastStyle, duration: 10000 });
                                    relaunch();
                                },
                                (e) => {
                                    toast.error(e.toString(), { style: toastStyle });
                                }
                            );
                    }}
                >
                    {downloaded !== 0
                        ? downloaded > total
                            ? t('updater.installing')
                            : t('updater.downloading')
                        : t('updater.update')}
                </Button>
                <Button
                    variant='danger-soft'
                    onPress={() => {
                        appWindow.close();
                    }}
                >
                    {t('updater.cancel')}
                </Button>
            </div>
        </div>
    );
}
