import { load } from 'js-yaml';

export interface ParsedMarkdown {
  data: Record<string, unknown>;
  content: string;
}

const opening = /^---[\t ]*\r?\n/;
const closing = /\r?\n---[\t ]*(?:\r?\n|$)/;

export default function parseFrontmatter(source: string): ParsedMarkdown {
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const start = text.match(opening);
  if (!start) return { data: {}, content: text };

  const rest = text.slice(start[0].length);
  const end = rest.match(closing);
  if (!end || end.index === undefined) return { data: {}, content: text };

  const parsed = load(rest.slice(0, end.index));
  const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};

  return {
    data,
    content: rest.slice(end.index + end[0].length),
  };
}
