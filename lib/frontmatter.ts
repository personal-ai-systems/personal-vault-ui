import { parseFrontmatter, METADATA_UNREADABLE } from './frontmatter.mjs';

export interface ParsedMarkdown {
  data: Record<string, unknown>;
  content: string;
  /**
   * Set when the metadata block exists but is not valid YAML. `content` then
   * holds the complete original file so the note stays readable.
   */
  metadataError: string | null;
}

export { METADATA_UNREADABLE };

export default function matter(source: string): ParsedMarkdown {
  return parseFrontmatter(source) as ParsedMarkdown;
}
