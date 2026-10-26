'use client';

import { useEffect, useState } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { vaultLink } from '@/lib/vault-links.mjs';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  sourcePath?: string;
}

export default function MarkdownRenderer({ content, className = '', sourcePath }: MarkdownRendererProps) {
  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderMarkdown = async () => {
      try {
        const processor = unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkRehype)
          .use(rehypeHighlight, {
            detect: true,
            ignoreMissing: true,
          })
          .use(() => (tree: any) => {
            const visit = (node: any) => {
              if (node.type === 'element' && (node.tagName === 'a' || node.tagName === 'img')) {
                const attribute = node.tagName === 'img' ? 'src' : 'href';
                const link = vaultLink(String(node.properties?.[attribute] || ''), sourcePath);
                if (link.kind === 'asset') node.properties[attribute] = link.href;
                else if (link.kind === 'note' && node.tagName === 'a') {
                  node.properties.href = '#'; node.properties['data-vault-note'] = link.path;
                } else if (link.kind === 'external' && node.tagName === 'a') {
                  node.properties.target = '_blank'; node.properties.rel = 'noopener noreferrer';
                } else if (link.kind === 'external' && node.tagName === 'img') {
                  // Opening a private note must not contact a tracking-image host.
                  node.tagName = 'a';
                  node.properties = { href: link.href, target: '_blank', rel: 'noopener noreferrer' };
                  node.children = [{ type: 'text', value: 'View remote image in browser' }];
                } else if (link.kind === 'blocked') delete node.properties[attribute];
              }
              for (const child of node.children || []) visit(child);
            };
            visit(tree);
          })
          .use(rehypeStringify);

        const file = await processor.process(content);
        setHtml(String(file));
        setError(null);
      } catch (err) {
        console.error('Error rendering markdown:', err);
        setError('Failed to render markdown');
        // Fallback to simple preformatted text
        setHtml(`<pre class="whitespace-pre-wrap">${content}</pre>`);
      }
    };

    renderMarkdown();
  }, [content, sourcePath]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{content}</pre>
      </div>
    );
  }

  return (
    <div 
      className={`markdown-content ${className}`}
      onClick={(event) => {
        const link = (event.target as Element).closest('a[data-vault-note]');
        if (!link) return;
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('vault:open-note', { detail: link.getAttribute('data-vault-note') }));
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
