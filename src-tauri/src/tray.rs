use crate::clipboard::*;
use crate::config::{get, set};
use crate::window::config_window;
use crate::window::input_translate;
use crate::window::ocr_recognize;
use crate::window::ocr_translate;
use crate::window::updater_window;
use log::info;
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::tray::{TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Wry};
use tauri_plugin_global_shortcut::GlobalShortcutExt;
use tauri_plugin_opener::OpenerExt;

// Tray menu labels for one language
struct TrayLabels {
    input_translate: &'static str,
    clipboard_monitor: &'static str,
    copy_source: &'static str,
    copy_target: &'static str,
    copy_source_target: &'static str,
    copy_disable: &'static str,
    auto_copy: &'static str,
    ocr_recognize: &'static str,
    ocr_translate: &'static str,
    config: &'static str,
    check_update: &'static str,
    view_log: &'static str,
    restart: &'static str,
    quit: &'static str,
}

fn labels_for(language: &str) -> TrayLabels {
    match language {
        "zh_cn" => TrayLabels {
            input_translate: "输入翻译",
            clipboard_monitor: "监听剪切板",
            copy_source: "原文",
            copy_target: "译文",
            copy_source_target: "原文+译文",
            copy_disable: "关闭",
            auto_copy: "自动复制",
            ocr_recognize: "文字识别",
            ocr_translate: "截图翻译",
            config: "偏好设置",
            check_update: "检查更新",
            view_log: "查看日志",
            restart: "重启应用",
            quit: "退出",
        },
        "zh_tw" => TrayLabels {
            input_translate: "輸入翻譯",
            clipboard_monitor: "偵聽剪貼簿",
            copy_source: "原文",
            copy_target: "譯文",
            copy_source_target: "原文+譯文",
            copy_disable: "關閉",
            auto_copy: "自動複製",
            ocr_recognize: "文字識別",
            ocr_translate: "截圖翻譯",
            config: "偏好設定",
            check_update: "檢查更新",
            view_log: "查看日誌",
            restart: "重啓程式",
            quit: "退出",
        },
        "ja" => TrayLabels {
            input_translate: "翻訳を入力",
            clipboard_monitor: "クリップボードを監視する",
            copy_source: "原文",
            copy_target: "訳文",
            copy_source_target: "原文+訳文",
            copy_disable: "閉じる",
            auto_copy: "自動コピー",
            ocr_recognize: "テキスト認識",
            ocr_translate: "スクリーンショットの翻訳",
            config: "プリファレンス設定",
            check_update: "更新を確認する",
            view_log: "ログを見る",
            restart: "アプリの再起動",
            quit: "退出する",
        },
        "ko" => TrayLabels {
            input_translate: "입력 번역",
            clipboard_monitor: "감청 전단판",
            copy_source: "원문",
            copy_target: "번역문",
            copy_source_target: "원문+번역문",
            copy_disable: "닫기",
            auto_copy: "자동 복사",
            ocr_recognize: "문자인식",
            ocr_translate: "스크린샷 번역",
            config: "기본 설정",
            check_update: "업데이트 확인",
            view_log: "로그 보기",
            restart: "응용 프로그램 다시 시작",
            quit: "퇴출",
        },
        "fr" => TrayLabels {
            input_translate: "Traduction d'entrée",
            clipboard_monitor: "Surveiller le presse-papiers",
            copy_source: "Source",
            copy_target: "Cible",
            copy_source_target: "Source+Cible",
            copy_disable: "Désactiver",
            auto_copy: "Copier automatiquement",
            ocr_recognize: "Reconnaissance de texte",
            ocr_translate: "Traduction d'image",
            config: "Paramètres",
            check_update: "Vérifier les mises à jour",
            view_log: "Voir le journal",
            restart: "Redémarrer l'application",
            quit: "Quitter",
        },
        "de" => TrayLabels {
            input_translate: "Eingabeübersetzung",
            clipboard_monitor: "Zwischenablage überwachen",
            copy_source: "Quelle",
            copy_target: "Ziel",
            copy_source_target: "Quelle+Ziel",
            copy_disable: "Deaktivieren",
            auto_copy: "Automatisch kopieren",
            ocr_recognize: "Texterkennung",
            ocr_translate: "Bildübersetzung",
            config: "Einstellungen",
            check_update: "Auf Updates prüfen",
            view_log: "Protokoll anzeigen",
            restart: "Anwendung neu starten",
            quit: "Beenden",
        },
        "ru" => TrayLabels {
            input_translate: "Ввод перевода",
            clipboard_monitor: "Следить за буфером обмена",
            copy_source: "Источник",
            copy_target: "Цель",
            copy_source_target: "Источник+Цель",
            copy_disable: "Отключить",
            auto_copy: "Автоматическое копирование",
            ocr_recognize: "Распознавание текста",
            ocr_translate: "Перевод изображения",
            config: "Настройки",
            check_update: "Проверить обновления",
            view_log: "Просмотр журнала",
            restart: "Перезапустить приложение",
            quit: "Выход",
        },
        "pt_br" => TrayLabels {
            input_translate: "Traduzir Entrada",
            clipboard_monitor: "Monitorando a área de transferência",
            copy_source: "Origem",
            copy_target: "Destino",
            copy_source_target: "Origem+Destino",
            copy_disable: "Desabilitar",
            auto_copy: "Copiar Automaticamente",
            ocr_recognize: "Reconhecimento de Texto",
            ocr_translate: "Tradução de Imagem",
            config: "Configurações",
            check_update: "Checar por Atualização",
            view_log: "Exibir Registro",
            restart: "Reiniciar aplicativo",
            quit: "Sair",
        },
        "fa" => TrayLabels {
            input_translate: "متن",
            clipboard_monitor: "گوش دادن به تخته برش",
            copy_source: "منبع",
            copy_target: "هدف",
            copy_source_target: "منبع + هدف",
            copy_disable: "متن",
            auto_copy: "کپی خودکار",
            ocr_recognize: "تشخیص متن",
            ocr_translate: "ترجمه عکس",
            config: "تنظیمات ترجیح",
            check_update: "بررسی بروزرسانی",
            view_log: "مشاهده گزارشات",
            restart: "راه‌اندازی مجدد برنامه",
            quit: "خروج",
        },
        "uk" => TrayLabels {
            input_translate: "Введення перекладу",
            clipboard_monitor: "Стежити за буфером обміну",
            copy_source: "Джерело",
            copy_target: "Мета",
            copy_source_target: "Джерело+Мета",
            copy_disable: "Відключивши",
            auto_copy: "Автоматичне копіювання",
            ocr_recognize: "Розпізнавання тексту",
            ocr_translate: "Переклад зображення",
            config: "Настройка",
            check_update: "Перевірити оновлення",
            view_log: "Перегляд журналу",
            restart: "Перезапустити додаток",
            quit: "Вихід",
        },
        // "en" and any unknown language fall back to English
        _ => TrayLabels {
            input_translate: "Input Translate",
            clipboard_monitor: "Clipboard Monitor",
            copy_source: "Source",
            copy_target: "Target",
            copy_source_target: "Source+Target",
            copy_disable: "Disable",
            auto_copy: "Auto Copy",
            ocr_recognize: "OCR Recognize",
            ocr_translate: "OCR Translate",
            config: "Config",
            check_update: "Check Update",
            view_log: "View Log",
            restart: "Restart",
            quit: "Quit",
        },
    }
}

fn build_menu(
    app: &AppHandle,
    l: &TrayLabels,
    copy_mode: &str,
    clipboard_enabled: bool,
) -> tauri::Result<Menu<Wry>> {
    let input_translate =
        MenuItem::with_id(app, "input_translate", l.input_translate, true, None::<&str>)?;
    let clipboard_monitor = CheckMenuItem::with_id(
        app,
        "clipboard_monitor",
        l.clipboard_monitor,
        true,
        clipboard_enabled,
        None::<&str>,
    )?;
    let copy_source = CheckMenuItem::with_id(
        app,
        "copy_source",
        l.copy_source,
        true,
        copy_mode == "source",
        None::<&str>,
    )?;
    let copy_target = CheckMenuItem::with_id(
        app,
        "copy_target",
        l.copy_target,
        true,
        copy_mode == "target",
        None::<&str>,
    )?;
    let copy_source_target = CheckMenuItem::with_id(
        app,
        "copy_source_target",
        l.copy_source_target,
        true,
        copy_mode == "source_target",
        None::<&str>,
    )?;
    let copy_disable = CheckMenuItem::with_id(
        app,
        "copy_disable",
        l.copy_disable,
        true,
        copy_mode == "disable",
        None::<&str>,
    )?;
    let auto_copy = Submenu::with_items(
        app,
        l.auto_copy,
        true,
        &[
            &copy_source,
            &copy_target,
            &copy_source_target,
            &PredefinedMenuItem::separator(app)?,
            &copy_disable,
        ],
    )?;
    let ocr_recognize =
        MenuItem::with_id(app, "ocr_recognize", l.ocr_recognize, true, None::<&str>)?;
    let ocr_translate =
        MenuItem::with_id(app, "ocr_translate", l.ocr_translate, true, None::<&str>)?;
    let config = MenuItem::with_id(app, "config", l.config, true, None::<&str>)?;
    let check_update = MenuItem::with_id(app, "check_update", l.check_update, true, None::<&str>)?;
    let view_log = MenuItem::with_id(app, "view_log", l.view_log, true, None::<&str>)?;
    let restart = MenuItem::with_id(app, "restart", l.restart, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", l.quit, true, None::<&str>)?;

    Menu::with_items(
        app,
        &[
            &input_translate,
            &clipboard_monitor,
            &auto_copy,
            &PredefinedMenuItem::separator(app)?,
            &ocr_recognize,
            &ocr_translate,
            &PredefinedMenuItem::separator(app)?,
            &config,
            &check_update,
            &view_log,
            &PredefinedMenuItem::separator(app)?,
            &restart,
            &quit,
        ],
    )
}

// Create the tray icon (called once during setup)
pub fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    #[cfg(target_os = "macos")]
    let icon = tauri::image::Image::from_bytes(include_bytes!("../icons_mac/tray.ico"))?;
    #[cfg(target_os = "windows")]
    let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/icon.ico"))?;
    #[cfg(target_os = "linux")]
    let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/icon.png"))?;

    // Build the menu at tray-creation time. Tray menu events only route to
    // `on_menu_event` when the menu is provided to the builder here — a menu assigned
    // afterwards via `set_menu` keeps that same routing.
    let language = match get("app_language") {
        Some(v) => v.as_str().unwrap_or("en").to_string(),
        None => "en".to_string(),
    };
    let copy_mode = match get("translate_auto_copy") {
        Some(v) => v.as_str().unwrap_or("disable").to_string(),
        None => "disable".to_string(),
    };
    let clipboard_enabled = match get("clipboard_monitor") {
        Some(v) => v.as_bool().unwrap_or(false),
        None => false,
    };
    let labels = labels_for(&language);
    let menu = build_menu(app, &labels, &copy_mode, clipboard_enabled)?;

    #[allow(unused_mut)]
    let mut builder = TrayIconBuilder::with_id("main")
        .icon(icon)
        .menu(&menu)
        // Left-click should trigger our tray-icon handler (open window), not the menu.
        .show_menu_on_left_click(false)
        .on_menu_event(tray_menu_event_handler)
        .on_tray_icon_event(tray_icon_event_handler);

    #[cfg(target_os = "macos")]
    {
        builder = builder.icon_as_template(true);
    }

    let tray = builder.build(app)?;
    #[cfg(not(target_os = "linux"))]
    {
        let _ = tray.set_tooltip(Some(format!("pot {}", app.package_info().version)));
    }
    Ok(())
}

#[tauri::command]
pub fn update_tray(app_handle: tauri::AppHandle, mut language: String, mut copy_mode: String) {
    if language.is_empty() {
        language = match get("app_language") {
            Some(v) => v.as_str().unwrap().to_string(),
            None => {
                set("app_language", "en");
                "en".to_string()
            }
        };
    }
    if copy_mode.is_empty() {
        copy_mode = match get("translate_auto_copy") {
            Some(v) => v.as_str().unwrap().to_string(),
            None => {
                set("translate_auto_copy", "disable");
                "disable".to_string()
            }
        };
    }

    info!(
        "Update tray with language: {}, copy mode: {}",
        language, copy_mode
    );

    let enable_clipboard_monitor = match get("clipboard_monitor") {
        Some(v) => v.as_bool().unwrap(),
        None => {
            set("clipboard_monitor", false);
            false
        }
    };

    let tray = match app_handle.tray_by_id("main") {
        Some(v) => v,
        None => return,
    };

    let labels = labels_for(&language);
    match build_menu(&app_handle, &labels, &copy_mode, enable_clipboard_monitor) {
        Ok(menu) => {
            let _ = tray.set_menu(Some(menu));
        }
        Err(e) => {
            log::warn!("Failed to build tray menu: {}", e);
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = tray.set_tooltip(Some(format!("pot {}", app_handle.package_info().version)));
    }
}

fn tray_menu_event_handler(app: &AppHandle, event: tauri::menu::MenuEvent) {
    match event.id.as_ref() {
        "input_translate" => on_input_translate_click(),
        "copy_source" => on_auto_copy_click(app, "source"),
        "clipboard_monitor" => on_clipboard_monitor_click(app),
        "copy_target" => on_auto_copy_click(app, "target"),
        "copy_source_target" => on_auto_copy_click(app, "source_target"),
        "copy_disable" => on_auto_copy_click(app, "disable"),
        "ocr_recognize" => on_ocr_recognize_click(),
        "ocr_translate" => on_ocr_translate_click(),
        "config" => on_config_click(),
        "check_update" => on_check_update_click(),
        "view_log" => on_view_log_click(app),
        "restart" => on_restart_click(app),
        "quit" => on_quit_click(app),
        _ => {}
    }
}

#[allow(unused_variables)]
fn tray_icon_event_handler(tray: &TrayIcon, event: TrayIconEvent) {
    #[cfg(target_os = "windows")]
    {
        use tauri::tray::{MouseButton, MouseButtonState};
        if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        } = event
        {
            on_tray_click();
        }
    }
}

#[cfg(target_os = "windows")]
fn on_tray_click() {
    let event = match get("tray_click_event") {
        Some(v) => v.as_str().unwrap().to_string(),
        None => {
            set("tray_click_event", "config");
            "config".to_string()
        }
    };
    match event.as_str() {
        "config" => config_window(),
        "translate" => input_translate(),
        "ocr_recognize" => ocr_recognize(),
        "ocr_translate" => ocr_translate(),
        "disable" => {}
        _ => config_window(),
    }
}
fn on_input_translate_click() {
    input_translate();
}
fn on_clipboard_monitor_click(app: &AppHandle) {
    let enable_clipboard_monitor = match get("clipboard_monitor") {
        Some(v) => v.as_bool().unwrap(),
        None => {
            set("clipboard_monitor", false);
            false
        }
    };
    let current = !enable_clipboard_monitor;
    // Update Config File
    set("clipboard_monitor", current);
    // Update State and Start Monitor
    let state = app.state::<ClipboardMonitorEnableWrapper>();
    state
        .0
        .lock()
        .unwrap()
        .replace_range(.., &current.to_string());
    if current {
        start_clipboard_monitor(app.app_handle().clone());
    }
    // Update Tray Menu Status
    update_tray(app.app_handle().clone(), "".to_string(), "".to_string());
}
fn on_auto_copy_click(app: &AppHandle, mode: &str) {
    info!("Set copy mode to: {}", mode);
    set("translate_auto_copy", mode);
    app.emit("translate_auto_copy_changed", mode).unwrap();
    update_tray(app.app_handle().clone(), "".to_string(), mode.to_string());
}
fn on_ocr_recognize_click() {
    ocr_recognize();
}
fn on_ocr_translate_click() {
    ocr_translate();
}

fn on_config_click() {
    config_window();
}

fn on_check_update_click() {
    updater_window();
}
fn on_view_log_click(app: &AppHandle) {
    let log_path = app.path().app_log_dir().unwrap();
    let _ = app.opener().open_path(log_path.to_str().unwrap(), None::<&str>);
}
fn on_restart_click(app: &AppHandle) {
    info!("============== Restart App ==============");
    app.restart();
}
fn on_quit_click(app: &AppHandle) {
    let _ = app.global_shortcut().unregister_all();
    info!("============== Quit App ==============");
    app.exit(0);
}
