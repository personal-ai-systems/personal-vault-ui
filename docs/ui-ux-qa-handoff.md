# Personal Vault desktop: corrective UX/QA handoff

## Requested outcome

The user prefers this handoff to further implementation by the current agent.
Audit and repair the actual installed desktop experience, not only source/API
tests. This file is the only repository change made for this handoff. Do not
interpret earlier successful smoke tests as complete acceptance.

User requirements:

- Notes and filenames may be in any language, including Russian and emoji.
- Keep ordinary readable Markdown and attachments in the user's chosen folder.
- Show most recently modified files first; calendar folders newest first.
- Fix the reported broken Show in Finder icon/appearance.
- Remove version/preview information from Settings. Put version information in
  the native macOS About Personal Vault / application-information interface.
- Remove Local MCP Connection from ordinary Settings. If diagnostics are kept,
  expose them separately as an explicit developer/help action, not normal UX.
- Inspect all main views, actions and keyboard interactions in the real app.
- Preserve the working local MCP service and verified readable-file behaviour.

## Current verified state

- UI checkout: `/Users/<username>/development/personal/personal-ai-systems/personal-vault-ui`.
- Vault checkout: `/Users/<username>/development/personal/personal-ai-systems/personal-vault`.
- Assistant checkout: `/Users/<username>/development/personal/personal-dashboard`.
- Installed app: `/Applications/Personal Vault.app`, version `0.2.1-preview.2`.
- UI commit: `83659e7`; Vault commit: `af344aa`. Recheck Git before editing.
- Prior versions are preserved in Downloads as backup `.app` bundles.
- Current settings: `~/Library/Application Support/personal-vault-ui/settings.json`.
  The app remembers the chosen folder; reopening an existing Vault on upgrade is
  expected. Do not reset settings or silently move/import files.
- A test copy exists at `/Users/<username>/Personal Vault Test`. Automated tests
  should still use synthetic temporary folders, not private records in that copy.
- The old Chrome-installed shortcut with the same name targets localhost:3000;
  it is not this Electron app. Do not test the wrong application or delete that
  shortcut without approval.
- Bundled MCP uses a dynamically chosen loopback port. Discover the child of
  the installed app; do not confuse it with the separate service on port 8788.
  The previously observed port is not a permanent connector URL.
- An independent MCP SDK client has completed initialize/discovery/read against
  the installed app. This does not mean the chat's connector was reconfigured.

## P0: one malformed metadata header breaks Recent

### Evidence, not an encoding hypothesis

The user's screenshot shows `bad indentation of a mapping entry (1:65)` in
Recent. Read-only investigation confirmed that the affected source bytes are
valid UTF-8. YAML frontmatter parsing fails. A synthetic reproduction is:

```yaml
title: Notes from September (architecture: triggers instead of endpoints)
```

The unquoted colon-space inside the scalar causes the YAML error. Russian text
is not the cause. Do not switch the store to ANSI/UTF-16, transliterate names,
strip punctuation from user prose, or bulk rewrite existing files.

### Verified failure path

1. `lib/frontmatter.ts`: `load(...)` from `js-yaml` has no recovery path.
2. `lib/vault-client.ts`: `document()` passes that exception through.
3. `app/api/recent/route.ts`: one rejected item rejects the entire `Promise.all`.
4. `failure()` exposes the raw parser exception in the ordinary UI.

The same shared parser is used by file preview and search; audit those callers
instead of patching only the Recent component.

### Required behaviour

- Metadata is optional. A malformed header must not make the file unreadable.
- Preserve the original bytes, body, filename and raw Markdown. On metadata
  failure, fall back to a readable filename/title and a full raw-text view;
  do not silently strip the malformed header or pretend parsing succeeded.
- Healthy entries remain usable when one entry has malformed metadata.
- Surface a concise, actionable per-file warning where appropriate, not a raw
  stack trace. Keep genuine root/auth/permission errors distinct from optional
  metadata problems; do not turn failures into a falsely empty/fresh Vault.
- New metadata emitted by the app/importer must quote/serialize scalar values
  correctly. Existing user Markdown must not be automatically rewritten.
- Continue to support UTF-8, Cyrillic, other scripts, emoji, quotes, colon-space,
  CRLF and optional UTF-8 BOM. Invalid/non-UTF-8 input, if encountered, needs an
  explicit non-destructive error/conversion choice, not silent replacement.

## P1: macOS placement and Finder UX

- `components/TopAppBar.tsx` currently renders both Version and Local MCP
  Connection in Settings. Remove those ordinary-settings elements as requested.
- `desktop/main.cjs` builds a custom app menu without an About item. Implement
  the native About role/panel with real app metadata. Do not invent copyright,
  organisation registration or signing claims.
- Keep MCP available; removing a diagnostic label is not permission to remove
  tools, change authentication or disable the service.
- The Finder icon issue is user-reported, not independently reproduced in this
  handoff. `components/Sidebar.tsx` uses Lucide `FolderOpen` for Show in Finder;
  inspect actual icon rendering, clipping, alignment, menu width and the action
  result. Do not assume whether the report means the SVG or the Finder launch.
- Verify macOS application-menu actions, cancel behaviour, keyboard navigation,
  focus, Escape, Cmd+N, close/reopen, and window resizing. Do not add developer
  controls to ordinary screens to make tests easier.

## Existing fixes to preserve

- `lib/file-order.mjs`, `components/FolderTree.tsx`, `app/api/files/route.ts`:
  newest modification first, with deterministic ties; numeric date folders
  newest first, ordinary folder names alphabetical.
- `lib/recent-files.mjs`: per-folder discovery rather than a global first-1000
  cutoff. A single folder hitting the cap still warns of incomplete coverage.
- `proxy.ts`: real desktop writes were broken by localhost/127.0.0.1 origin
  normalization. Token checking happens first; Origin is compared with received
  Host/protocol. Do not remove CSRF/origin checks to fix local writes.
- `components/NoteActions.tsx`, `lib/vault-links.mjs`, `MarkdownRenderer.tsx`:
  attachments get relative Markdown links; note/image paths resolve relative to
  the note. Remote images are explicit links, not automatic tracking requests.
- `/api/assets/[...path]` uses generic MCP `vault_files_read_binary`, bounded to
  10 MiB. Larger files remain usable in Finder. UI routes require the desktop
  token; do not confuse that with MCP authentication. Local MCP can deliberately
  allow loopback clients; the old `PERSONAL_VAULT_TOKEN` variable alone is not
  proof that the generic server enforces bearer authentication.
- Creating while searching opens the saved note; duplicates do not overwrite;
  edit controls wait for loaded content. Download/copy preserve raw Markdown,
  including metadata. Do not regress these while making parsing fault-tolerant.

## Architecture constraints

- Vault is ordinary files, not an ID-based database or hidden canonical store.
- Vault owns neutral file operations; Assistant owns Health, Today and Planner.
- Local Assistant access through the shared file library is explicitly approved.
  Do not introduce mandatory MCP/API hosting for localhost Assistant.
- The desktop currently uses MCP adapters over the same library. No second store.
- Legacy Assistant-shaped MCP tools remain known compatibility debt. Removing
  them is a separately reviewed breaking change, not part of this UX repair.
- Do not alter public hosting, repository visibility, credentials, signing
  identities, accounts or cloud services as a side effect of this task.

## Honest limits of previous QA

Previously passed: ordering rules, an 1800-note Recent fixture, package build,
native rendered create/edit/attach/archive/restore controls, duplicates, search,
preview/download, Settings, independent MCP read, binary preview, token denial,
foreign-Origin denial, ZIP/DMG integrity and post-launch signature verification.

Those checks used well-formed synthetic metadata and missed this real defect.
An earlier API-only smoke test also missed the browser-Origin write failure.
Some native-window actions are driven through renderer JavaScript, not OS input.
Copy payload uses a clipboard stub; native clipboard integration is not proven.
Successful native import-picker completion, external-web-link browser acceptance,
and a second Mac are not yet accepted. Native Vault chooser Escape cancellation
was manually tested and left saved configuration unchanged.

Unsaved-draft protection on app exit is not implemented. If adding it, also
inspect shutdown order: the current before-quit handler stops child services.
A cancelled quit must not leave an open window with dead services.

## Step-by-step execution and acceptance

1. Read this file, repository AGENTS and current Git state. Preserve other edits.
2. Reproduce the YAML failure using the synthetic fixture, in a temporary Vault.
3. Repair shared parsing/recovery and caller isolation without editing raw notes.
4. Add multilingual/malformed fixtures across Recent, search and preview. Include
   missing metadata, BOM/CRLF, normal `---` in prose, colon-space and quoted titles.
5. Repair About/Settings placement and inspect the reported Finder icon/action.
6. Walk a control matrix in the actual desktop app: folder expansion/selection,
   breadcrumbs, Recent/refresh, Archive/restore, search/clear/results, new note,
   edit/save/cancel, duplicate refusal, attachment/image/file link, copy/download,
   Settings/import, Finder reveal, choose/create/cancel, native menus and shortcuts.
   Use synthetic data and test both success and failure states.
7. Run existing tests plus the new negative/multilingual cases. Exercise actual
   browser-origin requests, not only direct Node fetches. Show useful UI errors
   without making healthy views unusable.
8. Build and test the packaged `.app`; source/dev success alone is insufficient.
   Read the installed package's actual version and pinned Vault revision.
9. Test upgrade/restart against a disposable existing Vault. Verify file bytes,
   chosen-folder settings, rollback and signature. No live-data mutations.
10. Report exact evidence, remaining failures and untested cases. Save/review
    prepared artifacts before any public push/release. Ask before closing a user
    session with potentially unsaved drafts or replacing an installed build.

Useful commands:

```sh
# UI checkout
npm test
npx tsc --noEmit --incremental false
npm run desktop:build
npm run test:desktop

# Vault checkout, if neutral operations are changed
npm test
npm run test:context
```

Use external signed-in Google Chrome for user-facing review artifacts, not the
Codex embedded browser. Native macOS AppleScript/System Events access is available;
absence of a specialised Computer Use tool is not proof that desktop access is
impossible. Never bypass OS/security restrictions or change permissions silently.

Definition of done: a malformed or multilingual note cannot break an entire view;
the raw note remains readable and unchanged; ordinary screens are user-focused;
macOS metadata has native placement; main controls work in the shipped package;
and the report distinguishes verified behaviour from remaining gaps.
