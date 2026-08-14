import { Button, Dropdown, Input, Label, Surface, TextField, toast } from '@heroui/react';
import { IconTrash, IconVolume } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';

import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { languageList, LanguageFlag } from '../../../utils/language';
import { getDefaultVoice, getVoiceLabel, voiceOptions } from './voices';
import { useConfig } from '../../../hooks/useConfig';
import { Language } from './info';
import { tts } from './index';

// Edge 未提供发音人的语言不出现在下拉列表中
const supportedLanguages = languageList.filter((language) => language in Language);

// 试听文本，key 为应用内语言标识，未覆盖的语言回退到英文
const PREVIEW_TEXT = {
    zh_cn: '你好，这是一段试听语音。',
    zh_tw: '你好，這是一段試聽語音。',
    en: 'Hello, this is a voice preview.',
    ja: 'こんにちは、これは音声のプレビューです。',
    ko: '안녕하세요, 음성 미리듣기입니다.',
    fr: 'Bonjour, ceci est un aperçu vocal.',
    es: 'Hola, esta es una vista previa de voz.',
    ru: 'Здравствуйте, это предварительное прослушивание голоса.',
    de: 'Hallo, dies ist eine Sprachvorschau.',
    it: "Ciao, questa è un'anteprima vocale.",
    tr: 'Merhaba, bu bir ses önizlemesidir.',
    pt_pt: 'Olá, esta é uma prévia da voz.',
    pt_br: 'Olá, esta é uma prévia da voz.',
    vi: 'Xin chào, đây là bản xem trước giọng nói.',
    id: 'Halo, ini adalah pratinjau suara.',
    th: 'สวัสดี นี่คือตัวอย่างเสียง',
    ms: 'Hai, ini ialah pratonton suara.',
    ar: 'مرحباً، هذه معاينة للصوت.',
    hi: 'नमस्ते, यह आवाज़ का पूर्वावलोकन है।',
    km: 'សួស្តី នេះជាការសាកសំឡេង។',
    mn_cy: 'Сайн байна уу, энэ бол дуу хоолойн урьдчилсан сонсгол.',
    nb_no: 'Hei, dette er en forhåndsvisning av stemmen.',
    nn_no: 'Hei, dette er en forhåndsvisning av stemmen.',
    fa: 'سلام، این پیش‌نمایش صدا است.',
    sv: 'Hej, det här är en förhandsvisning av rösten.',
    pl: 'Cześć, to jest podgląd głosu.',
    nl: 'Hallo, dit is een voorbeeld van de stem.',
    uk: 'Привіт, це попереднє прослуховування голосу.',
    he: 'שלום, זו תצוגה מקדימה של הקול.',
};

// 试听播放：总是替换正在播放的音频，便于连续对比多个音色
let previewContext = null;
let previewSource = null;

function playPreview(data) {
    const context = previewContext ?? (previewContext = new (window.AudioContext || window.webkitAudioContext)());
    if (previewSource) {
        previewSource.stop();
        previewSource.disconnect();
        previewSource = null;
    }
    context.decodeAudioData(
        new Uint8Array(data).buffer,
        (buffer) => {
            const sourceNode = context.createBufferSource();
            sourceNode.buffer = buffer;
            sourceNode.connect(context.destination);
            // onended 必须引用局部 sourceNode：旧音频被 stop() 时其 onended 会延迟派发，
            // 若闭包读共享变量 previewSource，可能误断开之后才播放的新音频
            sourceNode.onended = () => {
                sourceNode.disconnect();
                if (previewSource === sourceNode) {
                    previewSource = null;
                }
            };
            sourceNode.start();
            previewSource = sourceNode;
        },
        () => {
            // 解码失败（例如音频数据损坏），让问题可感知
            console.error('Edge TTS preview audio decode failed');
        }
    );
}

export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [edgeConfig, setEdgeConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.tts.edge_tts.title'),
            voiceConfig: [],
        },
        { sync: false }
    );
    const [isLoading, setIsLoading] = useState(false);

    const setVoiceConfig = (voiceConfig) => {
        setEdgeConfig({
            ...edgeConfig,
            voiceConfig: voiceConfig,
        });
    };

    const addVoiceItem = () => {
        const used = new Set(edgeConfig.voiceConfig.map((item) => item.language));
        const language = supportedLanguages.find((item) => !used.has(item)) ?? supportedLanguages[0];
        setVoiceConfig([...edgeConfig.voiceConfig, { language, voice: getDefaultVoice(Language[language]) }]);
    };

    // 试听指定音色：用临时 voiceConfig 让 tts 直接命中该音色，避免污染已配置的音色列表
    const previewVoice = (language, voice) => {
        tts(PREVIEW_TEXT[language] ?? PREVIEW_TEXT.en, Language[language], {
            config: { ...edgeConfig, voiceConfig: [{ language, voice }] },
        }).then(playPreview, (e) => {
            toast.danger(t('config.service.test_failed'), {
                description: e.toString(),
            });
        });
    };

    return (
        edgeConfig !== null && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    tts('hello', Language.en, { config: edgeConfig }).then(
                        () => {
                            setIsLoading(false);
                            setEdgeConfig(edgeConfig, true);
                            updateServiceList(instanceKey);
                            onClose();
                        },
                        (e) => {
                            setIsLoading(false);
                            toast.danger(t('config.service.test_failed'), {
                                description: e.toString(),
                            });
                        }
                    );
                }}
            >
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.instance_name')}</h3>
                    <TextField
                        value={edgeConfig[INSTANCE_NAME_CONFIG_KEY]}
                        onChange={(value) => {
                            setEdgeConfig({
                                ...edgeConfig,
                                [INSTANCE_NAME_CONFIG_KEY]: value,
                            });
                        }}
                    >
                        <Input variant='secondary' />
                    </TextField>
                </div>

                <h3 className='my-auto'>{t('services.tts.edge_tts.voice_config')}</h3>
                <p className='text-xs text-foreground py-2'>{t('services.tts.edge_tts.voice_config_description')}</p>

                <Surface
                    className='flex flex-col rounded-3xl p-3'
                    variant='secondary'
                >
                    {edgeConfig.voiceConfig &&
                        edgeConfig.voiceConfig.map((item, index) => {
                            const voices = voiceOptions[Language[item.language]] ?? [];
                            return (
                                <div
                                    className='config-item gap-2'
                                    key={index}
                                >
                                    <Dropdown>
                                        <Button
                                            size='sm'
                                            variant='tertiary'
                                            className='my-auto w-35 shrink-0'
                                        >
                                            <span className={`fi fi-${LanguageFlag[item.language]} shrink-0`} />
                                            <span className='min-w-0 truncate'>{t(`languages.${item.language}`)}</span>
                                        </Button>
                                        <Dropdown.Popover className='max-h-[50vh]'>
                                            <Dropdown.Menu
                                                onAction={(key) => {
                                                    // 换语言后原音色不再属于该语言，回落到新语言的默认音色
                                                    setVoiceConfig(
                                                        edgeConfig.voiceConfig.map((old, i) =>
                                                            i === index
                                                                ? {
                                                                      language: key,
                                                                      voice: getDefaultVoice(Language[key]),
                                                                  }
                                                                : old
                                                        )
                                                    );
                                                }}
                                            >
                                                {supportedLanguages.map((language) => (
                                                    <Dropdown.Item
                                                        key={language}
                                                        id={language}
                                                        textValue={t(`languages.${language}`)}
                                                    >
                                                        <span className={`fi fi-${LanguageFlag[language]}`} />
                                                        <Label>{t(`languages.${language}`)}</Label>
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown.Popover>
                                    </Dropdown>

                                    <Dropdown>
                                        <Button
                                            size='sm'
                                            variant='tertiary'
                                            className='my-auto grow min-w-0'
                                        >
                                            <span className='min-w-0 truncate'>{getVoiceLabel(item.voice ?? '')}</span>
                                        </Button>
                                        <Dropdown.Popover className='max-h-[50vh]'>
                                            <Dropdown.Menu
                                                selectionMode='single'
                                                selectedKeys={[item.voice]}
                                                onAction={(key) => {
                                                    setVoiceConfig(
                                                        edgeConfig.voiceConfig.map((old, i) =>
                                                            i === index ? { ...old, voice: key } : old
                                                        )
                                                    );
                                                }}
                                            >
                                                {voices.map((voice) => (
                                                    <Dropdown.Item
                                                        key={voice}
                                                        id={voice}
                                                        textValue={getVoiceLabel(voice)}
                                                        className={({ isSelected }) =>
                                                            isSelected ? 'bg-accent/15 text-accent font-medium' : undefined
                                                        }
                                                    >
                                                        <Dropdown.ItemIndicator type='checkmark' />
                                                        <Label>{getVoiceLabel(voice)}</Label>
                                                        <button
                                                            type='button'
                                                            className='ms-auto flex size-6 shrink-0 items-center justify-center rounded-full border border-muted text-muted transition-colors hover:bg-foreground/15 hover:text-foreground'
                                                            onClick={(e) => {
                                                                // 阻止事件冒泡，避免触发音色选中
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                previewVoice(item.language, voice);
                                                            }}
                                                        >
                                                            <IconVolume className='size-3.5' />
                                                        </button>
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown.Popover>
                                    </Dropdown>

                                    <Button
                                        isIconOnly
                                        size='sm'
                                        className='my-auto shrink-0'
                                        variant='danger-soft'
                                        onPress={() => {
                                            setVoiceConfig(edgeConfig.voiceConfig.filter((_, i) => i !== index));
                                        }}
                                    >
                                        <IconTrash />
                                    </Button>
                                </div>
                            );
                        })}
                    <Button
                        fullWidth
                        onPress={addVoiceItem}
                    >
                        {t('services.tts.edge_tts.add')}
                    </Button>
                </Surface>
                <br />

                <Button
                    type='submit'
                    isPending={isLoading}
                    fullWidth
                    variant='primary'
                >
                    {t('common.save')}
                </Button>
            </form>
        )
    );
}
