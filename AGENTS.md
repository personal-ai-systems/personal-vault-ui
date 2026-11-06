# Personal Vault UI - Agent Development Guide

## Project Context
You are building the independent desktop/file client for Personal Vault, a
user-owned memory store. Read `../personal-vault/docs/product-boundary.md`
before architecture or positioning changes. This client is not Personal
Assistant, a daily dashboard or an agent runtime. Saved memory stays in ordinary
Markdown and attachments in the selected folder; headers are optional.

## MVP language
The default interface and all public documentation are in English. Additional
interface translations are deferred. Preserve user filenames, memory, archives
and index content in their original language; do not translate stored data or
infer a user's language profile from their messages. Keep multilingual and
Unicode preservation tests. See the shared product boundary for this decision.

## Architecture
- **Storage**: `~/personal-vault/raw/YYYY/MM/YYYY-MM-DD-topic.md`
- **Frontend**: Next.js 16 (App Router) + TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **Markdown**: optional frontmatter parsed with `js-yaml`, `unified` for rendering
- **File Operations**: generic Vault MCP tools backed by the sibling `personal-vault` file library; do not duplicate file mechanics in UI routes.

## Vault client capabilities
1. **File Browser**: Navigate year/month structure, list files with metadata
2. **Markdown Viewer**: Render content with syntax highlighting, show frontmatter
3. **Search**: Search ordinary readable files; no required database.
4. **Editor**: Simple markdown editor for creating/editing files
5. **API Endpoints**: UI adapters for the real MCP service, not a second storage implementation.

## Current State
The project has a working Next.js/Electron desktop client with shadcn/ui
components. The simpler normal/advanced redesign is local, uncommitted work;
see its handoff below before continuing. Review existing code in:
- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utility functions (if exists)

## Development Rules
1. **Local-first**: Vault is the memory data store. Do not add a mandatory hidden
   database or replace readable files. File mechanics belong in the shared Vault
   library; UI routes use the generic MCP adapters rather than direct filesystem
   access. This does not prohibit other local applications from using the shared
   library directly.
2. **Portable**: Use relative paths inside the user-selected folder; never hardcode the developer's Vault.
3. **Simple UI**: Clean, fast, keyboard-navigable
4. **No WhatsApp**: Ignore any WhatsApp-related files in the vault

## Testing
Test ONLY with temporary fixture folders. Never use the real user Vault.
Desktop architecture and commands: see docs/desktop-macos.md.

Run `npm test` and `npm run test:desktop` after changes. The desktop suite must
exercise rendered buttons, not only direct HTTP calls: a missing browser Origin
header previously allowed the API test to pass while every real UI save failed.
Dates/files use newest modification first; calendar folders use newest first.
Health, Today and Planner belong to Assistant, not this desktop browser.

## Current redesign

Continue from `docs/simple-ui-redesign-handoff.md`. Normal navigation is Recent,
Memory and Files, with Recently Deleted and Archive separated below. User-facing
content is memory, not Note, Node, Capture, Entry or Record. Preserve internal
API names and readable paths; a vocabulary change is not a storage migration.
The default home remains Recent. Files is the original filesystem browser,
starting at the selected Vault root, with folders, files and breadcrumbs.
Technical folders are intentionally accessible there, not in Memory or Recent.
Do not replace Files with a filtered media collection or duplicate it in Settings.
Search follows the selected section: Recent searches its newest 50 memories,
Memory searches its full memory collection, and Files searches the whole visible
Vault tree regardless of the current folder. Global results show relative paths.
Archive and Recently Deleted search only their own collections. Preserve custom
memory and exact files; this is not a storage migration or cleanup.

Recently Deleted is recoverable, distinct from Archive, and has no automatic
purge or permanent-delete action. File movement belongs in the shared Vault
library, not UI filesystem code. Preserve unrelated MCP-connection work.
Run the content-view and packaged `simple-ui-qa.cjs` checks after changes.
The redesign is local work until explicitly packaged, reviewed and published;
the public preview.3 must not be described as containing it.

## Notes
- Research references and old mixed-product plans do not override the product boundary.
- Focus on simplicity over features
- Ensure the UI works without internet connection
