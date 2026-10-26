# Personal Vault UI - Agent Development Guide

## Project Context
You are building a local-first web UI for the personal vault at `~/personal-vault/`. The vault stores AI conversations, notes, and imported content in date-prefixed Markdown files with YAML frontmatter.

## Architecture
- **Storage**: `~/personal-vault/raw/YYYY/MM/YYYY-MM-DD-topic.md`
- **Frontend**: Next.js 16 (App Router) + TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **Markdown**: `gray-matter` for frontmatter, `unified` for rendering
- **File Operations**: generic Vault MCP tools backed by the sibling `personal-vault` file library; do not duplicate file mechanics in UI routes.

## Core Features to Implement
1. **File Browser**: Navigate year/month structure, list files with metadata
2. **Markdown Viewer**: Render content with syntax highlighting, show frontmatter
3. **Search**: Search ordinary readable files; no required database.
4. **Editor**: Simple markdown editor for creating/editing files
5. **API Endpoints**: UI adapters for the real MCP service, not a second storage implementation.

## Current State
The project has basic Next.js setup with shadcn/ui components. Review existing code in:
- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utility functions (if exists)

## Development Rules
1. **Local-first**: No database, direct file system access
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

## Next Priority
1. Fix any broken file paths after move to `~/development/personal/personal-vault-ui/`
2. Implement file browser showing year/month/day structure
3. Add markdown rendering for selected files
4. Implement basic search functionality

## Notes
- The vault follows Karpathy's "second brain" approach (see Twitter thread in vault)
- Focus on simplicity over features
- Ensure the UI works without internet connection
