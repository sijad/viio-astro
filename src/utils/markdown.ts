import { remark } from 'remark';
import html from 'remark-html';
import gfm from 'remark-gfm';
import DOMPurify from 'isomorphic-dompurify';

export async function parseMarkdown(markdown: string): Promise<string> {
    if (!markdown) return '';

    try {
        const processedContent = await remark()
            .use(gfm)
            .use(html)
            .process(markdown);

        const rawHtml = processedContent.toString();

        // Sanitize HTML
        // Allow standard tags but ensure links open in new tab
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
            ADD_ATTR: ['target', 'rel'],
        });

        // Add target="_blank" to links manually if DOMPurify doesn't (or hook into DOMPurify)
        // Actually DOMPurify has a hook for this
        DOMPurify.addHook('afterSanitizeAttributes', function (node) {
            if ('target' in node) {
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
            }
        });

        return DOMPurify.sanitize(rawHtml); // Run sanitize again/effectively with hook
    } catch (error) {
        console.error('Error parsing markdown:', error);
        return '<p class="text-red-500">Error parsing markdown</p>';
    }
}
