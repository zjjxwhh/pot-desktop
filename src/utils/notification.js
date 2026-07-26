import {
    sendNotification as _sendNotification,
    isPermissionGranted,
    requestPermission,
} from '@tauri-apps/plugin-notification';

export async function sendNotification(options) {
    let granted = await isPermissionGranted();
    if (!granted) {
        granted = (await requestPermission()) === 'granted';
    }
    if (granted) {
        _sendNotification(options);
    }
}
