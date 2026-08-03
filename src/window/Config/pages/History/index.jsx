import {
    Modal,
    useOverlayState,
    Table,
    TextArea,
    TextField,
    Button,
    ButtonGroup,
    Pagination,
    EmptyState,
    toast,
} from '@heroui/react';
import { IoFileTrayOutline } from 'react-icons/io5';
import { readDir, BaseDirectory, readTextFile, exists } from '@tauri-apps/plugin-fs';
import { appConfigDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Database from '@tauri-apps/plugin-sql';

import * as builtinCollectionServices from '../../../../services/collection';
import { invoke_plugin } from '../../../../utils/invoke_plugin';
import * as builtinServices from '../../../../services/translate';
import { useConfig } from '../../../../hooks';
import { LanguageFlag } from '../../../../utils/language';
import { store } from '../../../../utils/store';
import { osType } from '../../../../utils/env';
import {
    ServiceSourceType,
    ServiceType,
    getServiceName,
    getServiceSouceType,
    whetherAvailableService,
} from '../../../../utils/service_instance';

export default function History() {
    const [collectionServiceList] = useConfig('collection_service_list', []);
    const state = useOverlayState();
    const [pluginList, setPluginList] = useState(null);
    const [selectedItem, setSelectItem] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [items, setItems] = useState([]);
    const { t } = useTranslation();
    useEffect(() => {
        init();
        loadPluginList();
    }, []);

    useEffect(() => {
        getData();
    }, [total, page]);

    const init = async () => {
        const db = await Database.load('sqlite:history.db');
        const result = await db.select('SELECT COUNT(*) FROM history');
        if (result[0] && result[0]['COUNT(*)']) {
            setTotal(result[0]['COUNT(*)']);
        }
    };
    const getData = async () => {
        const db = await Database.load('sqlite:history.db');
        let result = await db.select('SELECT * FROM history ORDER BY id DESC LIMIT 20 OFFSET $1', [20 * (page - 1)]);
        setItems(result);
    };

    const getSelectedData = async (id) => {
        const db = await Database.load('sqlite:history.db');
        let result = await db.select('SELECT * FROM history WHERE id=$1', [id]);
        setSelectItem(result[0]);
    };
    const clearData = async () => {
        const db = await Database.load('sqlite:history.db');
        await db.execute('DROP TABLE history');
        await db.execute('VACUUM');
        setItems([]);
        setTotal(0);
        setPage(1);
    };
    const updateData = async () => {
        const db = await Database.load('sqlite:history.db');
        await db.execute('UPDATE history SET text=$1, result=$2 WHERE id=$3', [
            selectedItem.text,
            selectedItem.result,
            selectedItem.id,
        ]);
        await getData();
    };

    const formatDate = (date) => {
        function padTo2Digits(num) {
            return num.toString().padStart(2, '0');
        }
        const year = date.getFullYear().toString().slice(2, 4);
        const month = padTo2Digits(date.getMonth() + 1);
        const day = padTo2Digits(date.getDate());
        const hour = padTo2Digits(date.getHours());
        const minute = padTo2Digits(date.getMinutes());
        const second = padTo2Digits(date.getSeconds());
        return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
    };
    const loadPluginList = async () => {
        const serviceTypeList = ['translate', 'collection'];
        let temp = {};
        for (const serviceType of serviceTypeList) {
            temp[serviceType] = {};
            if (await exists(`plugins/${serviceType}`, { baseDir: BaseDirectory.AppConfig })) {
                const plugins = await readDir(`plugins/${serviceType}`, { baseDir: BaseDirectory.AppConfig });
                for (const plugin of plugins) {
                    const infoStr = await readTextFile(`plugins/${serviceType}/${plugin.name}/info.json`, {
                        baseDir: BaseDirectory.AppConfig,
                    });
                    let pluginInfo = JSON.parse(infoStr);
                    if ('icon' in pluginInfo) {
                        const appConfigDirPath = await appConfigDir();
                        const iconPath = await join(
                            appConfigDirPath,
                            `/plugins/${serviceType}/${plugin.name}/${pluginInfo.icon}`
                        );
                        pluginInfo.icon = convertFileSrc(iconPath);
                    }
                    temp[serviceType][plugin.name] = pluginInfo;
                }
            }
        }
        setPluginList({ ...temp });
    };

    const getPaginationItems = () => {
        const totalPages = Math.ceil(total / 20);
        const maxItems = 7;

        if (totalPages <= maxItems) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const items = [];

        if (page <= 4) {
            items.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
        } else if (page >= totalPages - 3) {
            items.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            items.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages);
        }

        return items;
    };

    return (
        pluginList !== null && (
            <>
                <Table
                    className={`${
                        osType === 'linux' ? 'h-[calc(100vh-130px)]' : 'h-[calc(100vh-100px)]'
                    } overflow-y-auto pt-1`}
                >
                    <Table.ScrollContainer className='h-full'>
                        {items.length === 0 ? (
                            <EmptyState className='flex h-full w-full flex-col items-center justify-center gap-4 text-center'>
                                <IoFileTrayOutline className='size-8 text-muted' />
                                <span className='text-base text-muted'>No History to Display</span>
                            </EmptyState>
                        ) : (
                            <Table.Content
                                aria-label='History Table'
                                selectionMode='single'
                                selectionBehavior='toggle'
                                onRowAction={(id) => {
                                    getSelectedData(id);
                                    state.open();
                                }}
                            >
                                <Table.Header className='hidden'>
                                    <Table.Column id='service' isRowHeader>service</Table.Column>
                                    <Table.Column id='text'>text</Table.Column>
                                    <Table.Column id='source'>source</Table.Column>
                                    <Table.Column id='target'>target</Table.Column>
                                    <Table.Column id='result'>result</Table.Column>
                                    <Table.Column id='timestamp'>timestamp</Table.Column>
                                </Table.Header>
                                <Table.Body items={items}>
                                {(item) =>
                                    whetherAvailableService(item.service, {
                                        [ServiceSourceType.BUILDIN]: builtinServices,
                                        [ServiceSourceType.PLUGIN]: pluginList[ServiceType.TRANSLATE],
                                    }) && (
                                        <Table.Row id={item.id}>
                                            <Table.Cell className='px-0 pl-3'>
                                                {getServiceSouceType(item.service) === ServiceSourceType.PLUGIN ? (
                                                    <img
                                                        src={pluginList['translate'][getServiceName(item.service)].icon}
                                                        className='h-[18px] w-[18px] my-auto mr-[8px]'
                                                        draggable={false}
                                                    />
                                                ) : (
                                                    <img
                                                        src={`${builtinServices[getServiceName(item.service)].info.icon}`}
                                                        className='h-[18px] w-[18px] my-auto mr-[8px]'
                                                        draggable={false}
                                                    />
                                                )}
                                            </Table.Cell>
                                            <Table.Cell className='px-0'>
                                                <p
                                                    className={`whitespace-nowrap ${
                                                        osType === 'linux'
                                                            ? 'w-[calc((100vw-287px-26px-60px-140px-30px)*0.5)]'
                                                            : 'w-[calc((100vw-287px-26px-60px-140px)*0.5)]'
                                                    } text-ellipsis overflow-hidden`}
                                                >
                                                    {item.text}
                                                </p>
                                            </Table.Cell>
                                            <Table.Cell className='px-0'>
                                                <span className={`w-[30px] fi fi-${LanguageFlag[item.source]}`} />
                                            </Table.Cell>
                                            <Table.Cell className='px-0'>
                                                <span className={`w-[30px] fi fi-${LanguageFlag[item.target]}`} />
                                            </Table.Cell>
                                            <Table.Cell className='px-0'>
                                                <p
                                                    className={`whitespace-nowrap ${
                                                        osType === 'linux'
                                                            ? 'w-[calc((100vw-287px-26px-60px-140px-30px)*0.5)]'
                                                            : 'w-[calc((100vw-287px-26px-60px-140px)*0.5)]'
                                                    } text-ellipsis overflow-hidden`}
                                                >
                                                    {item.result}
                                                </p>
                                            </Table.Cell>
                                            <Table.Cell className='px-0'>
                                                <p className='text-center whitespace-nowrap w-[140px]'>
                                                    {formatDate(new Date(item.timestamp))}
                                                </p>
                                            </Table.Cell>
                                        </Table.Row>
                                    )
                                }
                            </Table.Body>
                        </Table.Content>
                        )}
                    </Table.ScrollContainer>
                </Table>
                <div className='mt-[8px] flex justify-around'>
                    <Pagination className='my-auto'>
                        <Pagination.Content>
                            <Pagination.Item>
                                <Pagination.Previous
                                    isDisabled={page === 1}
                                    onPress={() => setPage(page - 1)}
                                >
                                    <Pagination.PreviousIcon />
                                </Pagination.Previous>
                            </Pagination.Item>
                            {getPaginationItems().map((item, index) => (
                                <Pagination.Item key={`${item}-${index}`}>
                                    {item === 'ellipsis' ? (
                                        <Pagination.Ellipsis />
                                    ) : (
                                        <Pagination.Link
                                            isActive={item === page}
                                            onPress={() => setPage(item)}
                                        >
                                            {item}
                                        </Pagination.Link>
                                    )}
                                </Pagination.Item>
                            ))}
                            <Pagination.Item>
                                <Pagination.Next
                                    isDisabled={page === Math.ceil(total / 20)}
                                    onPress={() => setPage(page + 1)}
                                >
                                    <Pagination.NextIcon />
                                </Pagination.Next>
                            </Pagination.Item>
                        </Pagination.Content>
                    </Pagination>
                    <Button
                        size='sm'
                        variant='danger'
                        className='my-auto'
                        onPress={clearData}
                    >
                        {t('common.clear')}
                    </Button>
                </div>

                <Modal
                    state={state}
                >
                    <Modal.Backdrop>
                        <Modal.Container scroll='inside'>
                            <Modal.Dialog className='max-h-[80vh]'>
                                {({ close }) =>
                                    selectedItem && (
                                        <>
                                            <Modal.Header>
                                                <div className='flex justify-start'>
                                                    {getServiceSouceType(selectedItem.service) === ServiceSourceType.PLUGIN ? (
                                                        <img
                                                            src={
                                                                pluginList['translate'][getServiceName(selectedItem.service)]
                                                                    .icon
                                                            }
                                                            className='h-[24px] w-[24px] m-auto'
                                                            draggable={false}
                                                        />
                                                    ) : (
                                                        <img
                                                            src={`${builtinServices[getServiceName(selectedItem.service)].info.icon}`}
                                                            className='h-[24px] w-[24px] m-auto ml-[8px]'
                                                            draggable={false}
                                                        />
                                                    )}
                                                </div>
                                                <div className='w-2'/>
                                            </Modal.Header>
                                            <Modal.Body>
                                                <TextField
                                                    className='mb-[8px]'
                                                    value={selectedItem.text}
                                                    onChange={(value) => {
                                                        setSelectItem({ ...selectedItem, text: value });
                                                    }}
                                                >
                                                    <TextArea variant='secondary' />
                                                </TextField>
                                                <TextField
                                                    value={selectedItem.result}
                                                    onChange={(value) => {
                                                        setSelectItem({ ...selectedItem, result: value });
                                                    }}
                                                >
                                                    <TextArea variant='secondary' />
                                                </TextField>
                                            </Modal.Body>
                                            <Modal.Footer className='flex justify-between'>
                                                <Button
                                                    variant='primary'
                                                    onPress={async () => {
                                                        await updateData();
                                                        close();
                                                    }}
                                                >
                                                    {t('common.save')}
                                                </Button>
                                                <ButtonGroup>
                                                    {collectionServiceList &&
                                                        collectionServiceList.map((instanceKey) => {
                                                            return (
                                                                <Button
                                                                    key={instanceKey}
                                                                    isIconOnly
                                                                    variant='tertiary'
                                                                    onPress={async () => {
                                                                        if (
                                                                            getServiceSouceType(instanceKey) ===
                                                                            ServiceSourceType.PLUGIN
                                                                        ) {
                                                                            const pluginConfig =
                                                                                (await store.get(instanceKey)) ?? {};
                                                                            let [func, utils] = await invoke_plugin(
                                                                                'collection',
                                                                                getServiceName(instanceKey)
                                                                            );
                                                                            func(selectedItem.text, selectedItem.result, {
                                                                                config: pluginConfig,
                                                                                utils,
                                                                            }).then(
                                                                                (_) => {
                                                                                    toast.success(
                                                                                        t('translate.add_collection_success')
                                                                                    );
                                                                                },
                                                                                (e) => {
                                                                                    toast.danger(e.toString());
                                                                                }
                                                                            );
                                                                        } else {
                                                                            const instanceConfig =
                                                                                (await store.get(instanceKey)) ?? {};
                                                                            builtinCollectionServices[
                                                                                getServiceName(instanceKey)
                                                                            ]
                                                                                .collection(
                                                                                    selectedItem.text,
                                                                                    selectedItem.result,
                                                                                    {
                                                                                        config: instanceConfig,
                                                                                    }
                                                                                )
                                                                                .then(
                                                                                    (_) => {
                                                                                        toast.success(
                                                                                            t(
                                                                                                'translate.add_collection_success'
                                                                                            )
                                                                                        );
                                                                                    },
                                                                                    (e) => {
                                                                                        toast.danger(e.toString());
                                                                                    }
                                                                                );
                                                                        }
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={
                                                                            getServiceSouceType(instanceKey) ===
                                                                            ServiceSourceType.PLUGIN
                                                                                ? pluginList['collection'][
                                                                                      getServiceName(instanceKey)
                                                                                  ].icon
                                                                                : builtinCollectionServices[
                                                                                      getServiceName(instanceKey)
                                                                                  ].info.icon
                                                                        }
                                                                        className='h-[24px] w-[24px]'
                                                                    />
                                                                </Button>
                                                            );
                                                        })}
                                                </ButtonGroup>
                                            </Modal.Footer>
                                        </>
                                    )
                                }
                            </Modal.Dialog>
                        </Modal.Container>
                    </Modal.Backdrop>
                </Modal>
            </>
        )
    );
}
