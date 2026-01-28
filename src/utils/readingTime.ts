export const WPM_CONFIG = {
    en: 200,
    pt: 180,
    es: 190,
    default: 200,
};

export function calculateReadingTime(text: string, lang: string = 'en') {
    // Remove markdown syntax to get cleaner word count
    const cleanText = text
        .replace(/#+\s/g, '') // Headers
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
        .replace(/`{3}[\s\S]*?`{3}/g, '') // Code blocks
        .replace(/`([^`]+)`/g, '$1') // Inline code
        .replace(/\*|_|~|=/g, ''); // Formatting chars

    const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const wpm = (WPM_CONFIG as any)[lang] || WPM_CONFIG.default;
    const minutes = Math.max(1, Math.ceil(words / wpm));

    return { words, minutes };
}
