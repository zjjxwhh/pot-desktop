use screenshots::{
    image::{imageops, Rgba, RgbaImage},
    Screen,
};
use tauri::Manager;

// Physical desktop pixels, including negative monitor origins.
fn desktop_bounds(rects: &[(i32, i32, u32, u32)]) -> Option<(i32, i32, u32, u32)> {
    let left = rects.iter().map(|r| r.0).min()?;
    let top = rects.iter().map(|r| r.1).min()?;
    let right = rects
        .iter()
        .map(|r| i64::from(r.0) + i64::from(r.2))
        .max()?;
    let bottom = rects
        .iter()
        .map(|r| i64::from(r.1) + i64::from(r.3))
        .max()?;
    Some((
        left,
        top,
        u32::try_from(right - i64::from(left)).ok()?,
        u32::try_from(bottom - i64::from(top)).ok()?,
    ))
}

#[tauri::command]
pub fn screenshot(window: tauri::WebviewWindow) -> Result<(), String> {
    let screens = Screen::all().map_err(|e| e.to_string())?;
    let rects: Vec<_> = screens
        .iter()
        .map(|screen| {
            let info = screen.display_info;
            (info.x, info.y, info.width, info.height)
        })
        .collect();
    let (left, top, width, height) = desktop_bounds(&rects).ok_or("No screens available")?;
    let mut desktop = RgbaImage::from_pixel(width, height, Rgba([0, 0, 0, 255]));
    for screen in screens {
        let info = screen.display_info;
        // Windows exposes physical bounds to this DPI-aware process; avoid
        // applying the display scale a second time in screenshots::capture.
        #[cfg(target_os = "windows")]
        let image = screen.capture_area_ignore_area_check(0, 0, info.width, info.height);
        #[cfg(not(target_os = "windows"))]
        let image = screen.capture();
        let image = image.map_err(|e| e.to_string())?;
        let image = if image.dimensions() == (info.width, info.height) {
            image
        } else {
            imageops::resize(
                &image,
                info.width,
                info.height,
                imageops::FilterType::Lanczos3,
            )
        };
        imageops::replace(
            &mut desktop,
            &image,
            i64::from(info.x) - i64::from(left),
            i64::from(info.y) - i64::from(top),
        );
    }
    let mut path = dirs::cache_dir().ok_or("Cache directory unavailable")?;
    path.push(&window.app_handle().config().identifier);
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push("pot_screenshot.png");
    desktop.save(path).map_err(|e| e.to_string())?;
    #[cfg(target_os = "windows")]
    position_overlay(&window, left, top, width, height)?;
    #[cfg(not(target_os = "windows"))]
    {
        window
            .set_position(tauri::PhysicalPosition::new(left, top))
            .map_err(|e| e.to_string())?;
        window
            .set_size(tauri::PhysicalSize::new(width, height))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn position_overlay(
    window: &tauri::WebviewWindow,
    left: i32,
    top: i32,
    width: u32,
    height: u32,
) -> Result<(), String> {
    use windows::Win32::Foundation::{HWND, RECT};
    use windows::Win32::UI::WindowsAndMessaging::{
        GetClientRect, GetWindowRect, SetWindowPos, SWP_NOACTIVATE, SWP_NOZORDER,
    };
    let hwnd = HWND(window.hwnd().map_err(|e| e.to_string())?.0);
    let width = i32::try_from(width).map_err(|e| e.to_string())?;
    let height = i32::try_from(height).map_err(|e| e.to_string())?;
    // Apply origin and size together. Separate Tauri operations can trigger a
    // DPI change that subsequently resizes/repositions the spanning window.
    unsafe {
        for _ in 0..2 {
            SetWindowPos(
                hwnd,
                None,
                left,
                top,
                width,
                height,
                SWP_NOACTIVATE | SWP_NOZORDER,
            )
            .map_err(|e| e.to_string())?;
            let mut rect = RECT::default();
            GetWindowRect(hwnd, &mut rect).map_err(|e| e.to_string())?;
            let mut client = RECT::default();
            GetClientRect(hwnd, &mut client).map_err(|e| e.to_string())?;
            log::debug!(
                "Screenshot geometry: expected=({left}, {top}, {width}, {height}), outer={rect:?}, client={client:?}"
            );
            if rect.left == left
                && rect.top == top
                && rect.right - rect.left == width
                && rect.bottom - rect.top == height
                && client.right - client.left == width
                && client.bottom - client.top == height
            {
                return Ok(());
            }
        }
    }
    Err("Screenshot window does not cover the captured desktop".into())
}

#[cfg(test)]
mod tests {
    use super::desktop_bounds;
    #[test]
    fn supports_negative_origins_and_vertical_layouts() {
        assert_eq!(
            desktop_bounds(&[(-1920, 0, 1920, 1080), (0, -1200, 2560, 1440)]),
            Some((-1920, -1200, 4480, 2280))
        );
    }
    #[test]
    fn supports_single_screen_and_empty_desktop() {
        assert_eq!(
            desktop_bounds(&[(0, 0, 1920, 1080)]),
            Some((0, 0, 1920, 1080))
        );
        assert_eq!(desktop_bounds(&[]), None);
    }
}
