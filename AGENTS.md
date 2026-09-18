# Personal Vault UI - Agent Development Guide

## Project Context
You are building a local-first web UI for the personal vault at `~/personal-vault/`. The vault stores AI conversations, notes, and imported content in date-prefixed Markdown files with YAML frontmatter.

## Architecture
- **Storage**: `~/personal-vault/raw/YYYY/MM/YYYY-MM-DD-topic.md`
- **Frontend**: Next.js 15 (App Router) + TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **Markdown**: `gray-matter` for frontmatter, `unified` for rendering
- **File Operations**: Node.js `fs/promises` API

## Core Features to Implement
1. **File Browser**: Navigate year/month structure, list files with metadata
2. **Markdown Viewer**: Render content with syntax highlighting, show frontmatter
3. **Search**: Full-text search across vault (start with grep, later SQLite FTS5)
4. **Editor**: Simple markdown editor for creating/editing files
5. **API Endpoints**: REST endpoints for AI agent integration (MCP-style)

## Current State
The project has basic Next.js setup with shadcn/ui components. Review existing code in:
- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utility functions (if exists)

## Development Rules
1. **Local-first**: No database, direct file system access
2. **Portable**: Use relative paths, assume vault at `~/personal-vault/`
3. **Simple UI**: Clean, fast, keyboard-navigable
4. **No WhatsApp**: Ignore any WhatsApp-related files in the vault

## Testing
Test ONLY with temporary fixture folders. Never use the real user Vault.
Desktop architecture and commands: see docs/desktop-macos.md.

## Next Priority
1. Fix any broken file paths after move to `~/development/personal/personal-vault-ui/`
2. Implement file browser showing year/month/day structure
3. Add markdown rendering for selected files
4. Implement basic search functionality

## Notes
- The vault follows Karpathy's "second brain" approach (see Twitter thread in vault)
- Focus on simplicity over features
- Ensure the UI works without internet connection
