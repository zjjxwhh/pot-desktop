import { Modal, useOverlayState, Button, toast } from '@heroui/react';
import { remove, BaseDirectory } from '@tauri-apps/plugin-fs';
import { open as openInBrowser } from '@tauri-apps/plugin-shell';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import React, { useState } from 'react';

import { createServiceInstanceKey } from '../../../../../utils/service_instance';
import { emit } from '@tauri-apps/api/event';

export default function SelectPluginModal(props) {
    const { isOpen, onOpenChange, setCurrentConfigKey, onConfigOpen, pluginType, pluginList, deleteService } = props;
    const state = useOverlayState({ isOpen, onOpenChange });
    const [installing, setInstalling] = useState(false);
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
                                    {Object.keys(pluginList).length === 0 && (
                                        <Button
                                            fullWidth
                                            variant='tertiary'
                                            className='mb-0.5'
                                            onPress={() => {
                                                openInBrowser('http://pot-app.com/plugin.html');
                                            }}
                                        >
                                            <div className='w-full'>{t('config.service.view_plugin_list')}</div>
                                        </Button>
                                    )}

                                    {Object.keys(pluginList).map((x) => {
                                        return (
                                            <div
                                                className='flex justify-between'
                                                key={x}
                                            >
                                                <Button
                                                    fullWidth
                                                    className='mr-2 mb-0.5'
                                                    onPress={() => {
                                                        setCurrentConfigKey(createServiceInstanceKey(x));
                                                        onConfigOpen();
                                                    }}
                                                >
                                                    <img
                                                        src={pluginList[x].icon}
                                                        className='size-6 shrink-0 my-auto'
                                                    />
                                                    <div className='w-full'>{pluginList[x].display}</div>
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    variant='danger-soft'
                                                    onPress={() => {
                                                        remove(`plugins/${pluginType}/${x}`, {
                                                            baseDir: BaseDirectory.AppConfig,
                                                            recursive: true,
                                                        }).then(
                                                            (v) => {
                                                                toast.success(t('config.service.uninstall_success'));
                                                                deleteService(x);
                                                                emit('reload_plugin_list');
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
                                    <div>
                                        <Button
                                            fullWidth
                                            isPending={installing}
                                            onPress={async () => {
                                                setInstalling(true);
                                                const selected = await open({
                                                    multiple: true,
                                                    directory: false,
                                                    filters: [
                                                        {
                                                            name: '*.potext',
                                                            extensions: ['potext'],
                                                        },
                                                    ],
                                                });
                                                if (selected !== null) {
                                                    invoke('install_plugin', {
                                                        pathList: selected,
                                                    }).then(
                                                        (count) => {
                                                            setInstalling(false);
                                                            toast.success(
                                                                t('config.service.installed_plugins', { count })
                                                            );
                                                            emit('reload_plugin_list');
                                                        },
                                                        (e) => {
                                                            setInstalling(false);
                                                            toast.danger(e.toString());
                                                        }
                                                    );
                                                } else {
                                                    setInstalling(false);
                                                }
                                            }}
                                        >
                                            <div className='w-full'>{t('config.service.install_plugin')}</div>
                                        </Button>
                                    </div>
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
