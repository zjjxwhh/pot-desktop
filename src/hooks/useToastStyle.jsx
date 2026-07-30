// HeroUI v3 主题色通过 CSS 变量提供，内联样式中直接引用即可随 `.dark` class 自动切换明暗。
export const useToastStyle = () => {
    const toastStyle = {
        background: 'var(--surface)',
        color: 'var(--foreground)',
        wordBreak: 'break-all',
        select: 'text',
    };

    return toastStyle;
};
