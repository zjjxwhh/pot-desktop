export const normalizeText = (text, deleteNewline) => {
    if (deleteNewline) {
        return text
            .replace(/\-\s+/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    return text.trim();
};

export const appendText = (oldText, newText) => {
    return oldText === '' ? newText : oldText + ' ' + newText;
};

export const removeAllSpaces = (text) => {
    return text.replace(/[ \t]+/g, '').trim();
};