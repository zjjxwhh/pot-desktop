use arboard::{Clipboard, ImageData};
use log::{error, info, warn};
use std::error::Error;
use std::time::{Duration, Instant};
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_ALL, COINIT_MULTITHREADED,
};
use windows::Win32::System::DataExchange::GetClipboardSequenceNumber;
use windows::Win32::UI::Accessibility::{
    CUIAutomation, IUIAutomation, IUIAutomationTextPattern, UIA_TextPatternId,
};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    GetAsyncKeyState, VIRTUAL_KEY, VK_CONTROL, VK_LWIN, VK_MENU, VK_RWIN, VK_SHIFT,
};

/// How long to wait for the user to physically let go of the hotkey before
/// injecting Ctrl+C.
const MODIFIER_RELEASE_TIMEOUT: Duration = Duration::from_millis(300);
/// How long to wait for the target application to answer Ctrl+C.
const CLIPBOARD_UPDATE_TIMEOUT: Duration = Duration::from_millis(800);
/// Polling granularity for both waits above.
const POLL_INTERVAL: Duration = Duration::from_millis(10);
/// How often to retry opening the clipboard, and how long to back off between
/// attempts.
const CLIPBOARD_OPEN_RETRIES: u32 = 5;
const CLIPBOARD_OPEN_BACKOFF: Duration = Duration::from_millis(20);

pub fn get_text() -> String {
    // UI Automation expects its clients to live in an MTA. `selection_translate`
    // runs us on a dedicated worker thread exactly so we can be one: the Tauri
    // main thread is an STA (tao calls `OleInitialize`) whose message pump we
    // would be blocking for the entire capture.
    let _com = ComGuard::enter();

    match get_text_by_automation() {
        Ok(text) => {
            if !text.is_empty() {
                return text;
            } else {
                info!("get_text_by_automation is empty");
            }
        }
        Err(err) => {
            error!("get_text_by_automation error:{}", err);
        }
    }
    info!("fallback to get_text_by_clipboard");
    match get_text_by_clipboard() {
        Ok(text) => {
            if !text.is_empty() {
                return text;
            } else {
                info!("get_text_by_clipboard is empty");
            }
        }
        Err(err) => {
            error!("get_text_by_clipboard error:{}", err);
        }
    }
    // Return Empty String
    String::new()
}

/// Puts the calling thread's COM apartment into MTA for the lifetime of the guard.
struct ComGuard {
    /// Whether our own `CoInitializeEx` is the one that has to be undone.
    /// `RPC_E_CHANGED_MODE` means the thread already belongs to a different
    /// apartment, and then we must not call `CoUninitialize`.
    initialized: bool,
}

impl ComGuard {
    fn enter() -> Self {
        let hr = unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) };
        if hr.is_err() {
            warn!("CoInitializeEx(MTA) failed, using the existing apartment: {hr:?}");
        }
        Self {
            initialized: hr.is_ok(),
        }
    }
}

impl Drop for ComGuard {
    fn drop(&mut self) {
        if self.initialized {
            unsafe { CoUninitialize() };
        }
    }
}

// Available for Edge, Chrome and UWP
fn get_text_by_automation() -> Result<String, Box<dyn Error>> {
    // Create IUIAutomation instance
    let auto: IUIAutomation = unsafe { CoCreateInstance(&CUIAutomation, None, CLSCTX_ALL) }?;
    // Get Focused Element
    let el = unsafe { auto.GetFocusedElement() }?;
    // Get TextPattern
    let res: IUIAutomationTextPattern = unsafe { el.GetCurrentPatternAs(UIA_TextPatternId) }?;
    // Get TextRange Array
    let text_array = unsafe { res.GetSelection() }?;
    let length = unsafe { text_array.Length() }?;
    // Iterate TextRange Array
    let mut target = String::new();
    for i in 0..length {
        let text = unsafe { text_array.GetElement(i) }?;
        let str = unsafe { text.GetText(-1) }?;
        let str = str.to_string();
        target.push_str(&str);
    }
    Ok(target.trim().to_string())
}

// Available for almost all applications
fn get_text_by_clipboard() -> Result<String, Box<dyn Error>> {
    let backup = ClipboardBackup::capture();

    if !copy() {
        // The clipboard never changed, so there is nothing to restore. (If the
        // copy did land but only after our timeout, we deliberately leave the
        // clipboard alone rather than writing the backup back over it and
        // pushing a duplicate entry into the user's clipboard history.)
        return Err("Copy Failed".into());
    }

    let text = open_clipboard().and_then(|mut clipboard| clipboard.get_text());
    backup.restore();

    Ok(text?.trim().to_string())
}

/// The clipboard content from before we hijacked the clipboard for a copy.
enum ClipboardBackup {
    Text(String),
    Image(ImageData<'static>),
    /// The clipboard was empty, unreadable, or held something we cannot
    /// round-trip (files, rich text). Ctrl+C has already destroyed it by the
    /// time we would restore, so the best remaining option is to leave the
    /// freshly copied text in place rather than clearing the clipboard on top.
    None,
}

impl ClipboardBackup {
    fn capture() -> Self {
        // Failing to back up must never abort the capture: losing the previous
        // clipboard is a far smaller problem than not translating at all.
        let mut clipboard = match open_clipboard() {
            Ok(clipboard) => clipboard,
            Err(err) => {
                warn!("Could not back up the clipboard, continuing anyway: {err}");
                return Self::None;
            }
        };
        if let Ok(text) = clipboard.get_text() {
            Self::Text(text)
        } else if let Ok(image) = clipboard.get_image() {
            Self::Image(image)
        } else {
            Self::None
        }
    }

    fn restore(self) {
        let restored = match self {
            Self::None => return,
            Self::Text(text) => open_clipboard().and_then(|mut c| c.set_text(text)),
            Self::Image(image) => open_clipboard().and_then(|mut c| c.set_image(image)),
        };
        if let Err(err) = restored {
            warn!("Could not restore the clipboard: {err}");
        }
    }
}

/// Opens the clipboard, retrying for a short while.
///
/// The Windows clipboard is a global exclusive lock and clipboard managers
/// (clipboard history, Ditto, IM clients) take it constantly, so a single failed
/// attempt says nothing about whether we can use it at all.
fn open_clipboard() -> Result<Clipboard, arboard::Error> {
    let mut attempt = 1;
    loop {
        match Clipboard::new() {
            Ok(clipboard) => return Ok(clipboard),
            Err(err) if attempt < CLIPBOARD_OPEN_RETRIES => {
                info!("Clipboard is busy ({err}), attempt {attempt}");
                attempt += 1;
                std::thread::sleep(CLIPBOARD_OPEN_BACKOFF);
            }
            Err(err) => return Err(err),
        }
    }
}

/// Sends Ctrl+C to the focused application and reports whether the clipboard
/// actually changed as a result.
fn copy() -> bool {
    use enigo::{
        Direction::{Click, Press, Release},
        Enigo, Key, Keyboard, Settings,
    };

    // The hotkey fires on key *down*, so the combo is still held right now.
    // Injecting immediately would interleave with the real key-up events the
    // keyboard sends a moment later.
    wait_for_modifiers_release(MODIFIER_RELEASE_TIMEOUT);

    let mut enigo = match Enigo::new(&Settings::default()) {
        Ok(enigo) => enigo,
        Err(err) => {
            error!("Failed to create the input simulator: {err}");
            return false;
        }
    };

    let sequence_before = unsafe { GetClipboardSequenceNumber() };

    // Drop whatever the system still considers held, so the target application
    // sees a clean Ctrl+C instead of e.g. Ctrl+Shift+C.
    for key in [
        Key::Control,
        Key::Alt,
        Key::Shift,
        Key::Space,
        Key::Meta,
        Key::Tab,
        Key::Escape,
        Key::CapsLock,
        Key::C,
    ] {
        if let Err(err) = enigo.key(key, Release) {
            warn!("Failed to release {key:?}: {err}");
        }
    }

    let failure = enigo
        .key(Key::Control, Press)
        .err()
        .or_else(|| enigo.key(Key::C, Click).err());
    // Release Ctrl even if the sequence above failed halfway through, so we
    // never leave the user's keyboard in a stuck modifier state.
    let _ = enigo.key(Key::Control, Release);
    if let Some(err) = failure {
        error!("Failed to send Ctrl+C: {err}");
        return false;
    }

    wait_for_clipboard_update(sequence_before, CLIPBOARD_UPDATE_TIMEOUT)
}

/// Waits until the user has physically released every modifier key.
///
/// Injecting Ctrl+C while the hotkey is still held races with the user's own
/// key-up events: the target application can end up seeing a bare `C`, which
/// both fails the copy and types a stray character into whatever has focus.
///
/// Gives up after `timeout` and lets the caller try anyway — a stuck modifier is
/// a reason to expect a bad copy, not a reason to skip the attempt.
fn wait_for_modifiers_release(timeout: Duration) {
    const MODIFIERS: [VIRTUAL_KEY; 5] = [VK_CONTROL, VK_SHIFT, VK_MENU, VK_LWIN, VK_RWIN];

    let deadline = Instant::now() + timeout;
    loop {
        // The high-order bit of GetAsyncKeyState is the current physical state.
        let held = MODIFIERS
            .iter()
            .any(|key| unsafe { GetAsyncKeyState(key.0 as i32) } as u16 & 0x8000 != 0);
        if !held {
            return;
        }
        if Instant::now() >= deadline {
            warn!("Modifier keys still held after {timeout:?}, sending Ctrl+C anyway");
            return;
        }
        std::thread::sleep(POLL_INTERVAL);
    }
}

/// Polls until the clipboard sequence number moves, i.e. the target application
/// actually answered our Ctrl+C.
///
/// A fixed sleep does not work here: Office, Electron apps, PDF readers and
/// remote desktop sessions routinely need more than 100ms, and treating that as
/// a failed copy is what made selection translation flaky. Polling also returns
/// as soon as the copy lands, so the common case gets faster rather than slower.
fn wait_for_clipboard_update(sequence_before: u32, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    loop {
        std::thread::sleep(POLL_INTERVAL);
        if unsafe { GetClipboardSequenceNumber() } != sequence_before {
            return true;
        }
        if Instant::now() >= deadline {
            return false;
        }
    }
}
