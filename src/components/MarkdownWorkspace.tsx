import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ui } from '../i18n/ui';
import { parseMarkdown } from '../utils/markdown';
import { calculateReadingTime } from '../utils/readingTime';
import DOMPurify from 'isomorphic-dompurify';

type Lang = keyof typeof ui;

interface Props {
    lang: Lang;
}

export const MarkdownWorkspace: React.FC<Props> = ({ lang }) => {
    const [markdown, setMarkdown] = useState<string>('');
    const [html, setHtml] = useState<string>('');
    const [stats, setStats] = useState({ words: 0, minutes: 0 });
    const [isParsing, setIsParsing] = useState(false);

    // Debounce ref
    const timeoutRef = useRef<NodeJs.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const t = (key: keyof typeof ui['en']) => {
        return ui[lang][key] || ui['en'][key];
    };

    // Safe client-side hook for target blank
    useEffect(() => {
        DOMPurify.addHook('afterSanitizeAttributes', function (node) {
            if ('target' in node) {
                node.setAttribute('target', '_blank');
                node.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }, []);

    const processContent = useCallback(async (content: string) => {
        setIsParsing(true);

        // Calculate stats immediately (cheap)
        const newStats = calculateReadingTime(content, lang);
        setStats(newStats);

        // Parse markdown (async/expensive)
        const newHtml = await parseMarkdown(content);
        setHtml(newHtml);
        setIsParsing(false);
    }, [lang]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setMarkdown(newVal);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            processContent(newVal);
        }, 300); // 300ms debounce
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setMarkdown(text);
            processContent(text);
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const handleClear = () => {
        setMarkdown('');
        setHtml('');
        setStats({ words: 0, minutes: 0 });
    };

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-background border border-border rounded-md hover:bg-secondary transition-colors text-foreground"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        {t("workspace.upload")}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".md,.markdown,.txt"
                        className="hidden"
                    />

                    <button
                        onClick={handleClear}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        {t("workspace.clear")}
                    </button>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{stats.words}</span> {t("workspace.words")}
                    </span>
                    <span className="w-px h-4 bg-border"></span>
                    <span className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">~{stats.minutes}</span> {t("workspace.minutes")}
                    </span>
                </div>
            </div>

            {/* Editor & Preview Split */}
            <div className="flex-1 flex flex-col md:flex-row min-h-[500px]">
                {/* Editor */}
                <div className="relative flex-1 border-b md:border-b-0 md:border-r border-border min-h-[300px]">
                    <textarea
                        value={markdown}
                        onChange={handleChange}
                        placeholder={t("workspace.placeholder.editor")}
                        className="editor-textarea"
                        spellCheck={false}
                    />
                </div>

                {/* Preview */}
                <div className="flex-1 bg-background min-h-[300px] overflow-y-auto max-h-screen">
                    {html ? (
                        <div
                            className="markdown-preview"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground p-8 text-center italic">
                            {t("workspace.placeholder.preview")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
