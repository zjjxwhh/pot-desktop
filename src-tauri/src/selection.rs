// Inlined from the `selection` crate (https://github.com/pot-app/Selection, GPL-3.0)
// so we can control the selected-text capture behavior directly instead of
// depending on the external crate.

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "windows")]
mod windows;

#[cfg(target_os = "linux")]
use self::linux::get_text as _get_text;
#[cfg(target_os = "macos")]
use self::macos::get_text as _get_text;
#[cfg(target_os = "windows")]
use self::windows::get_text as _get_text;

/// Get the text selected by the cursor
///
/// Return empty string if no text is selected or error occurred
pub fn get_text() -> String {
    _get_text().trim().to_owned()
}
