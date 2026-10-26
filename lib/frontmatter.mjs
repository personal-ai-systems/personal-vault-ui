import { load } from 'js-yaml';

const opening = /^---[\t ]*\r?\n/;
const closing = /\r?\n---[\t ]*(?:\r?\n|$)/;

/**
 * Shown when a metadata block exists but is not valid YAML.
 *
 * Deliberately free of parser internals. The operator does not need
 * "bad indentation of a mapping entry (1:65)" to understand that the note
 * still opened -- and that message was previously reaching the UI verbatim.
 */
export const METADATA_UNREADABLE =
  'This note opened, but its metadata could not be read. The file is shown exactly as it is saved.';

/**
 * Parse optional YAML frontmatter. Never throws.
 *
 * A note hand-edited in another editor can contain metadata that js-yaml
 * rejects, e.g. `title: Notes from September 12: the plan` (unquoted
 * colon-space). That must degrade to "no metadata, show the whole file",
 * never to a failed request or a blank note.
 *
 * @param {unknown} source
 * @returns {{ data: Record<string, unknown>, content: string, metadataError: string | null }}
 */
export function parseFrontmatter(source) {
  const text = typeof source === 'string' ? source : String(source ?? '');
  // A UTF-8 BOM must not stop the opening fence from matching.
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const start = body.match(opening);
  if (!start) return { data: {}, content: body, metadataError: null };

  const rest = body.slice(start[0].length);
  const end = rest.match(closing);
  // An opening fence with no closing fence is not metadata; show the file.
  if (!end || end.index === undefined) return { data: {}, content: body, metadataError: null };

  try {
    const parsed = load(rest.slice(0, end.index));
    const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? /** @type {Record<string, unknown>} */ (parsed)
      : {};
    return { data, content: rest.slice(end.index + end[0].length), metadataError: null };
  } catch {
    // Keep the complete original text, fence included, so the note is still
    // readable and copyable exactly as it exists on disk.
    return { data: {}, content: body, metadataError: METADATA_UNREADABLE };
  }
}

/**
 * Read many notes without letting one unreadable file reject the batch.
 *
 * Recent and search both fan out over every note; a bare `Promise.all`
 * meant one bad file blanked the entire view. A rejection here becomes a
 * marked entry instead of a failure for the whole list.
 *
 * @param {string[]} paths
 * @param {(path: string) => Promise<unknown>} read
 * @returns {Promise<Array<{ path: string, ok: true, value: unknown } | { path: string, ok: false, error: string }>>}
 */
export async function readNotesSettled(paths, read) {
  return Promise.all(paths.map(async (path) => {
    try {
      return { path, ok: true, value: await read(path) };
    } catch {
      // The reason is reported per file; the batch continues.
      return { path, ok: false, error: 'This note could not be read.' };
    }
  }));
}

export default parseFrontmatter;
