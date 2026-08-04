import { Card, Button, ProgressBar, Skeleton, Label, Toast, toast } from '@heroui/react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

import { useConfig } from '../../hooks';
import { osType } from '../../utils/env';

const appWindow = getCurrentWebviewWindow();

export default function Updater() {
    const [transparent] = useConfig('transparent', true);
    const [downloaded, setDownloaded] = useState(0);
    const [total, setTotal] = useState(0);
    const [body, setBody] = useState('');
    const [update, setUpdate] = useState(null);
    const { t } = useTranslation();

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
                toast.danger(e.toString());
            }
        );
    }, []);

    return (
        <div
            className={`${transparent ? 'bg-background/90' : 'bg-background'} h-screen flex flex-col ${
                osType === 'linux' && 'rounded-[10px] border border-border'
            }`}
        >
            <Toast.Provider placement='top' />
            <div className='p-1.25 h-8.75 w-full select-none cursor-default'>
                <div
                    data-tauri-drag-region='true'
                    className={`h-full w-full flex ${osType === 'macos' ? 'justify-end' : 'justify-start'}`}
                >
                    <img
                        src='icon.png'
                        className='h-6.25 w-6.25 mr-2.5'
                        draggable={false}
                    />
                    <h2>{t('updater.title')}</h2>
                </div>
            </div>
            <Card className='mx-15 mt-2.5 overscroll-auto flex-1 min-h-0'>
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
                                            className='text-2xl'
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
                                            className='text-lg'
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
                    className='w-full px-20'
                    size='sm'
                >
                    <Label>{t('updater.progress')}</Label>
                    <ProgressBar.Output />
                    <ProgressBar.Track>
                        <ProgressBar.Fill />
                    </ProgressBar.Track>
                </ProgressBar>
            )}

            <div className='grid gap-4 grid-cols-2 h-12.5 my-2.5 mx-20 place-items-center'>
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
                                    toast.success(t('updater.installed'), {
                                        timeout: 10000
                                    });
                                    relaunch();
                                },
                                (e) => {
                                    toast.danger(e.toString());
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
