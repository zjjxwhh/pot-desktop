// 解析服务实例的显示图标：
// 实例配置中存在自定义 icon（data URI / URL）时优先使用，否则回退到内置默认图标。
export function resolveServiceIcon(
    instanceConfig: Record<string, unknown> | null | undefined,
    defaultIcon: string
): string {
    const customIcon = instanceConfig?.icon;
    return typeof customIcon === 'string' && customIcon.trim() !== '' ? customIcon : defaultIcon;
}
