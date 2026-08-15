import React, { useEffect, useState } from 'react';
import { Button, Input, Modal, TextField, toast, useOverlayState } from '@heroui/react';
import { PulseLoader } from 'react-spinners';
import { useTranslation } from 'react-i18next';

const GROUPS = ['all', 'application', 'model', 'provider'];

// Mono 兜底时品牌主色可能过浅（如纯白），在浅色主题下不可见，替换为中性深灰
function toVisibleColor(color) {
    const hex = String(color ?? '').trim();
    const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex);
    if (!m) return '#808080';
    let full = hex;
    if (hex.length === 4) {
        full = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    const r = parseInt(full.slice(1, 3), 16);
    const g = parseInt(full.slice(3, 5), 16);
    const b = parseInt(full.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#3f3f46' : full;
}

export default function IconPicker(props) {
    const { value, onChange } = props;
    const { t } = useTranslation();
    const state = useOverlayState();
    const [iconsData, setIconsData] = useState(null);
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('all');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    // 首次打开时动态加载图标库（不进主 bundle）
    useEffect(() => {
        if (state.isOpen && iconsData === null) {
            Promise.all([import('@lobehub/icons/es/icons.js'), import('@lobehub/icons/es/toc.json')]).then(
                ([mod, toc]) => {
                    setIconsData({ mod, toc: toc.default ?? toc });
                },
                (e) => {
                    toast.danger(t('services.translate.openai_compatible.icon_load_failed'), {
                        description: e.toString(),
                    });
                }
            );
        }
    }, [state.isOpen, iconsData]);

    // 每次打开时清空搜索文本并重置分组
    useEffect(() => {
        if (state.isOpen) {
            setSearch('');
            setGroup('all');
            setSelectedId(null);
        }
    }, [state.isOpen]);

    const keyword = search.trim().toLowerCase();
    const filtered =
        iconsData === null
            ? []
            : iconsData.toc.filter((item) => {
                  if (group !== 'all' && item.group !== group) return false;
                  if (keyword === '') return true;
                  return (
                      item.id.toLowerCase().includes(keyword) ||
                      (item.title ?? '').toLowerCase().includes(keyword) ||
                      (item.fullTitle ?? '').toLowerCase().includes(keyword)
                  );
              });

    // 点击确认后，将选中的图标渲染为 data URI 并提交
    const handleConfirm = async () => {
        const item = iconsData?.toc.find((it) => it.id === selectedId);
        if (!item) return;
        setIsGenerating(true);
        try {
            const Compound = iconsData.mod[item.id];
            if (!Compound) {
                toast.danger(t('services.translate.openai_compatible.icon_not_found'), {
                    description: item.id,
                });
                return;
            }
            const { renderToStaticMarkup } = await import('react-dom/server');
            // 运行时特性检测：优先彩色变体，缺失时用 Mono + 品牌主色兜底
            const Icon = Compound.Color ?? Compound.BrandColor ?? Compound;
            const primary = toVisibleColor(Compound.colorPrimary ?? item.color ?? '#808080');
            let svg = renderToStaticMarkup(
                React.createElement(Icon, {
                    size: 40,
                    ...(Icon === Compound ? { color: primary } : {}),
                })
            );
            if (!Compound.Color && !Compound.BrandColor) {
                // Mono 变体使用 currentColor，在 <img> 中会解析为黑色，强制替换为品牌主色
                svg = svg.replaceAll('fill="currentColor"', `fill="${primary}"`);
            }
            onChange(`data:image/svg+xml,${encodeURIComponent(svg)}`);
            state.setOpen(false);
        } catch (e) {
            toast.danger(t('services.translate.openai_compatible.icon_create_failed'), {
                description: e.toString(),
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <div className='flex items-center gap-2'>
                {value !== '' && value !== undefined && (
                    <Button
                        size='sm'
                        variant='outline'
                        onPress={() => onChange('')}
                    >
                        {t('services.translate.openai_compatible.restore_default')}
                    </Button>
                )}
                <Button
                    size='sm'
                    variant='primary'
                    className='px-3 py-2'
                    onPress={state.open}
                >
                    {value
                        ? t('services.translate.openai_compatible.change_icon')
                        : t('services.translate.openai_compatible.select_icon')}
                </Button>
            </div>
            <Modal state={state}>
                <Modal.Backdrop>
                    <Modal.Container scroll='inside'>
                        <Modal.Dialog className='h-[75vh] w-[80vw]! max-w-none!'>
                            {({ close }) => (
                                <>
                                    <Modal.Header>
                                        <Modal.Heading>
                                            {t('services.translate.openai_compatible.select_icon')}
                                        </Modal.Heading>
                                        <div className='flex items-center gap-2'>
                                            <div className='flex-1'>
                                                <TextField
                                                    fullWidth
                                                    value={search}
                                                    onChange={setSearch}
                                                >
                                                    <Input
                                                        variant='secondary'
                                                        placeholder={t(
                                                            'services.translate.openai_compatible.search_icon'
                                                        )}
                                                    />
                                                </TextField>
                                            </div>
                                            <div className='flex gap-1 shrink-0'>
                                                {GROUPS.map((g) => {
                                                    return (
                                                        <Button
                                                            key={g}
                                                            size='sm'
                                                            variant={group === g ? 'primary' : 'tertiary'}
                                                            onPress={() => setGroup(g)}
                                                        >
                                                            {t(`services.translate.openai_compatible.icon_group_${g}`)}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </Modal.Header>
                                    <Modal.Body>
                                        {iconsData === null ? (
                                            <div className='flex justify-center py-10'>
                                                <PulseLoader
                                                    loading
                                                    color='var(--muted)'
                                                    size={8}
                                                />
                                            </div>
                                        ) : (
                                            <div className='grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2 pb-2'>
                                                {filtered.map((item) => {
                                                    const Compound = iconsData.mod[item.id];
                                                    if (!Compound) return null;
                                                    const Icon = Compound.Color ?? Compound;
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className='flex flex-col items-center gap-1'
                                                        >
                                                            <Button
                                                                variant='ghost'
                                                                isIconOnly
                                                                className={`aspect-square size-14 border-2 ${
                                                                    selectedId === item.id
                                                                        ? 'border-muted bg-muted/20'
                                                                        : 'border-transparent'
                                                                }`}
                                                                title={item.fullTitle ?? item.title ?? item.id}
                                                                onPress={() => setSelectedId(item.id)}
                                                            >
                                                                {React.createElement(Icon, { className: '!size-8' })}
                                                            </Button>
                                                            <span className='text-[10px] leading-none truncate max-w-full'>
                                                                {item.title}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button
                                            variant='danger-soft'
                                            isDisabled={isGenerating}
                                            onPress={close}
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                        <Button
                                            variant='primary'
                                            isDisabled={isGenerating || selectedId === null}
                                            onPress={handleConfirm}
                                        >
                                            {t('common.ok')}
                                        </Button>
                                    </Modal.Footer>
                                </>
                            )}
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}
