# Personal Vault desktop browser: implementation handoff

Prepared 30 October 2026. This is an additional handoff for a developer or another
model to continue the requested redesign. Keep the earlier
`docs/ui-ux-qa-handoff.md`: it records a different corrective QA task and contains
historical evidence, not the current redesign's completion status.

## Files and contextual search — 1 November 2026

Personally tested on the installed preview.4 and accepted the current views,
with two narrow corrections. These supersede only the older Files-collection
and Settings / All files design below, not the product or storage boundary:

- Files is the existing full folder/file browser, opened at the selected Vault
  root. Reuse its tree, breadcrumbs and previews. Technical folders and original
  filenames are deliberately visible here. Selecting Files again returns to root;
  selecting a folder closes the previous preview. No disk migration is needed.
- Recent, Memory, Archive and Recently Deleted keep their existing views.
- Search is contextual, including its label: Search in Recent, Search in Memory
  and Search in Files. Recent searches only its newest 50 ordinary memories;
  Memory searches all ordinary Markdown memory. Files searches names, paths and
  supported text across the whole visible Vault tree, even from a nested folder.
  Files results show relative paths so identical names remain distinguishable.
  Archive and Recently Deleted search only their own current collections.
- Navigating to another section clears the query. Cancel stale requests so an
  older response cannot populate a newer file, folder or search selection.
- Remove the redundant Settings / All files destination. This full access is now
  the primary Files tab, not an extra collection or an Assistant feature.

Source implementation is complete. Five UI/source suites, MCP relay tests,
production build/typecheck, 46 shared-library checks and MCP/import fixtures
passed. The locally packaged rendered-window suite passed the new Files and
search journeys, duplicate paths, preview resets, delayed-response cancellation,
and the existing save/edit/attachment/archive/recovery checks. Strict signature
verification passed after launch. All test data/settings were temporary.

After fresh user approval on 1 November, the exact tested Files/search candidate
was installed in Applications and launched. Its displayed version is still
`0.2.1-preview.4`; distinguish this correction by web build ID
`6KIGJy-HQIg2FyWH-RVEE` (built `2026-11-01T04:28:51.028Z`), replacing the earlier
local build `qAXpg5bMuPHEGCy7mLLse`. The previous app and exact settings were kept
in a private local rollback folder. The saved settings checksum and selected
Vault root are unchanged. Installed read-only checks verified MCP initialize /
tools / existing-file readback, the root file listing, Recent and UI readiness;
strict signature validation passed after copying and launching. No real memory
was written for verification. Native window visibility was checked separately.

Source remains uncommitted and this candidate uses an explicit local working-tree
Vault package, not a new public dependency pin. No publication, dependency repin,
client registration or schedule change occurred. Earlier dated test/install
receipts below apply to earlier snapshots. This is not Windows/Linux native
acceptance or Apple Developer ID/notarization. Installation receipts and local
rollback locations are private artifacts, not files to commit to this repository.

## Local installation — 1 November 2026

`0.2.1-preview.4` has now been built from the current working snapshot and
installed over preview.2 on the maintainer's Mac, with fresh confirmation that
drafts were saved and the old app closed. The old application and exact settings
copy are retained locally in Downloads for rollback. The saved settings hash is
unchanged and the installed app reopened the same existing Vault folder.

Verified for this candidate: five UI/source suites, MCP relay tests, 46 library
checks, MCP/import fixtures, production build/typecheck, packaged rendered-window
journey and strict post-launch signature validation. After copying into
Applications, strict signature validation passed again; the actual installed
MCP endpoint listed tools and read existing source bytes without test writes.

This is a local ad-hoc-signed preview from an explicit working-tree package,
not a clean public-pin release, Developer ID/notarization or second-Mac
acceptance. The normal dependency pin remains unchanged; no source commit,
GitHub release, client registration or remote tunnel was created. The user's
first local review and requested corrections are recorded above. Rollback/installation
receipts are private local artifacts, not files to add to this public repository.

## Outcome and scope

Read `../personal-vault/docs/product-boundary.md` from the UI repository root.
Vault is the independent memory store; this UI is its file client, not a daily
Assistant. Usability is an interface requirement, not a different product
identity. Review artifacts must use that same distinction.

Make Personal Vault understandable to people without IT knowledge on Windows,
macOS and Linux. The ordinary screen should help someone find, read, create and
organise their own notes and files without learning Markdown, filename
extensions or the application's internal folders.

The files remain the product. Keep ordinary readable notes and attachments in
the selected folder. This redesign is a presentation and interaction change,
not a storage migration, cleanup or permission to delete existing material.
Existing folders, filenames, note contents and links must remain usable outside
the app. Do not add a second canonical store.

Continue implementation, not just design documentation. Work in the paired
`personal-vault-ui` and `personal-vault` repositories. Do not involve unrelated
projects, change the live Vault, install a release over the user's app, publish,
commit, configure services or change accounts without the applicable authority.

## Confirmed UX decisions

The user has now answered the earlier dictated-wording clarification: keep the
saved material in `raw/`, Recent and exported files. This settles “Pro/Drone”;
do not ask that question again. `raw/` remains a physical folder, presented as
Memory in the ordinary UI; Recent shows recent saved material, and Files
includes exports. This does not rename `raw/`, narrow all content to that folder,
or supersede the later explicit Memory terminology. Custom user material stays
accessible under the shared content rules below.

- Put Recent and the user's own notes/content ahead of technical folders.
- Make exported/generated documents, images and video findable through Files in
  their existing folders. Memory keeps its date grouping. Neither view authorises
  moving files into a new physical layout.
- Separate the ordinary content navigation from Recently Deleted and Archive
  with a visible separator. Recently Deleted and Archive are different actions
  and different views.
- Keep technical folders/files in Files, including agent instructions,
  configuration, logs and indexes. They stay out of Memory, Recent and those
  sections' searches. Files/global search deliberately includes them.
- Files retains full access to the original folder tree. It is a visibility
  choice, not an authorisation boundary. Do not remove access or alter the file
  API's permissions to implement a quieter ordinary screen.
- Preserve custom folders and unclassified user content. Do not hide every file
  outside `raw/` or `notes/`. `structured/` contains durable user material as well
  as generated material and cannot be treated as one disposable technical tree.
  Exports, output folders and user attachments are not all junk.
- New attachments stay beside their note in `note.assets/`. Retain existing
  global attachment folders and existing links; no automatic migration.
- Ordinary create/edit controls use plain labels such as Title and Text. A user
  should not need to type `.md` or understand frontmatter. Preserve the existing
  readable file format and raw-text fallback for malformed metadata.
- Reuse the existing shadcn/ui, Tailwind and icon approach. A design reference is
  not a reason to replace the component library with MUI.
- Use native folder dialogs and platform-appropriate labels and shortcuts.
  Command on macOS and Control on Windows/Linux should work where appropriate.
  Do not describe the existing macOS build as a verified Windows/Linux installer.

### Vocabulary confirmed by the user, 30 October

The user clarified: “Это просто память, это то, что происходило. Это не нот,
это не капча, это просто память.” This settles the ordinary content terminology;
do not restart the earlier ambiguous dictation question or substitute Entry.

- Product: Personal Vault. Purpose: personal memory independent of an AI vendor,
  Assistant or dashboard. It stores what the user saved about what happened,
  thoughts and conversations; it does not certify every saved claim as fact.
- Primary section: Memory, replacing Notes. Main navigation: Recent, Memory,
  Files; separator; Recently Deleted, Archive.
- A saved item is a memory. Do not require a user to learn Note, Capture, Entry,
  Record, Node or Entity. Context may describe an imported conversation without
  inventing a new content model.
- Primary action: Add to memory; save button: Save; editing action: Edit.
- Brain is a whole-system metaphor, not the content unit. Do not turn Vault into
  the Assistant or give it ownership of domain meaning.

The source previously said `Note` / `Notes`, not `Node`. This wording correction
does not request a Node.js runtime replacement. Internal view keys, types,
module names, `.md` files, readable paths and existing API/MCP operation names
remain compatible. Only ordinary UI copy changes; no disk migration or new
canonical store is introduced.

Primary-source comparison (terminology only, not dependency recommendations):
[Basic Memory](https://github.com/basicmachines-co/basic-memory) uses memory and
notes; [Mem0](https://github.com/mem0ai/mem0) uses a memory layer and memories;
[Khoj](https://github.com/khoj-ai/khoj) uses second brain for its AI application;
[Logseq's database documentation](https://github.com/logseq/docs/blob/master/db-version.md)
uses Node for its unified page/block concept. These implementations differ from
Vault; none establishes a mandatory industry-wide vocabulary or a reason to
adopt a database, graph model or automatic fact-extraction system.

## Safety rules for Archive and Recently Deleted

Archive means keeping something intentionally outside active work. It is not
deleted content. Preserve the existing archive/restore behaviour while adding a
separate recoverable deletion concept.

Recently Deleted means a recoverable move with a clear restore action, including
the note's adjacent assets. Do not relabel the existing Archive as Recently
Deleted. Do not permanently delete, auto-purge, promise “30 days”, empty a bin or
silently overwrite a restore destination. The implemented readable lifecycle
convention is `.trash/YYYY-MM-DD/original/path`, with adjacent `.assets` kept
together. This is recoverable deleted content, not a hidden canonical store.
Flat legacy `.trash` entries with unknown original locations are reported for
manual recovery, not guessed or migrated. The existing backup excludes `.trash`;
do not claim that a deleted copy is backed up. Same-day destination collisions
refuse safely, and the current move requires filesystem hard-link support.

Keep file movement and attachment handling in the shared `personal-vault` file
library. UI routes should adapt those operations, not implement a competing
filesystem mechanism. A restore conflict needs an explicit, non-destructive
result that leaves both existing content and the recoverable copy intact.

## Starting checkpoint: recheck before editing

At the start of this redesign, UI HEAD was `057f50e` (`0.2.1-preview.3`); the
packaged Vault dependency was pinned to `115c249`. These identify the starting
point, not a claim that the current worktree or installed application matches it.

The following UI changes already existed before this redesign. Preserve them:

- Modified: `desktop/main.cjs`, `desktop/qa-smoke.cjs`,
  `docs/desktop-macos.md`, `docs/testing-preview.md`, `package.json`.
- Untracked: `desktop/codex-mcp-bridge.cjs`, `desktop/mcp-connection.cjs`,
  `scripts/test-mcp-bridge.mjs`, `docs/ui-ux-qa-handoff.md`.
- The sibling Vault checkout also had documentation changes. Inspect its current
  status rather than guessing ownership or cleaning the tree.

First-slice source is implemented locally. The original 30 October checkpoint
had not installed or published it; the 1 November local installation above now
supersedes only that installation status. Source remains uncommitted/unpublished.
Pre-existing MCP-connection work remains present and was not reverted. Status:

| Area | Status at handoff preparation |
| --- | --- |
| Normal/advanced content classification | Shared `lib/content-view.mjs`, materials API, ordinary Recent and filename/content search implemented; fixture suites pass |
| Simpler navigation and note controls | Recent / Memory / Files, separated recovery area, Settings / All files, month/year grouping, file-type/year filters and plain controls implemented; final renamed-label packaged recheck passed |
| Recently Deleted / restore | Shared library and MCP operations implemented; 41 library checks plus transport/import tests pass, including assets, conflicts and legacy handling |
| Source build and automated tests | Five UI/source suites, TypeScript and production build pass. The restaged rendered window passed the boundary cleanup; earlier packaged macOS receipts apply to their earlier snapshot, not a newly published cleanup build |
| External Chrome visual review | Review opened in the existing external macOS Chrome profile; title, local URL, rendered handoff text and synthetic snapshot captions verified through native accessibility |
| Windows/Linux native acceptance | Not established |

Do not use an older test receipt to claim that these new behaviours work.

### Boundary correction after the original UI slice — 30 October 2026

The product identity is the independent memory store, not an everyday Assistant.
Both repository instructions point to `personal-vault/docs/product-boundary.md`.
The old review-wrapper heading was removed and the app/manifest descriptions now
state the memory purpose rather than the design system.

Removed four unused Assistant implementations from this UI checkout:
`components/ResumeMe.tsx`, `app/api/resume/route.ts`, `app/api/today/route.ts`,
`app/api/transcript/route.ts`. They were tracked/unmodified before this cleanup
and are recoverable from Git history. Their paths still return 404 through the
existing proxy guard. No active MCP tool was removed.

`scripts/test-product-boundary.mjs` now runs in `npm test`: it checks the memory
identity, shared decision pointer, absence of those implementations, active-page
separation and rejection of old Assistant routes. The production build/typecheck
passed after moving a stale generated dev validator into a local recovery copy;
no source type error was suppressed and no running service was restarted.
The restaged rendered-window acceptance passed this exact cleanup. A new packaged
release/signature check was not performed for it; earlier packaged receipts below
remain evidence for their earlier source snapshot only.

The normal Memory editor hides a valid optional saved header while preserving its
exact text during body editing. Malformed headers remain visible with a warning.
Attach, Archive and Delete are disabled while editing; attachment file reading
also marks the note busy and catches read failures. This fixes the discovered
attachment-triggered draft reset, not every possible unsaved navigation path.
Normal Files defaults to Documents & media; Other formats remain reachable via
the explicitly labelled All file types filter, and original files stay in All
files. File paths are under File details rather than every ordinary list row.
Recent currently means ordinary Markdown notes, not every media modification.

Vault library additions: `trash(path)`, `listDeleted(limit)`, `restoreDeleted(path)` and
MCP `vault_files_trash`, `vault_files_list_deleted`,
`vault_files_restore_deleted`. UI routes only adapt MCP; they do not move files
directly. No temporary-file cleanup, permanent deletion or retention timer was
introduced. Filesystem data, API authorisation and existing relative paths are
not migrated by visibility filters.

Classification uses known service-root conventions, exact root instruction
files and the assistant-infrastructure subtree. Only the two proven legacy
`app/api/projects/.../route.ts` files are excluded as source: an `app/user-note.md`
and custom folders such as `custom/logs` remain ordinary user content. Review
future classification changes against this regression, not a blanket blacklist.

Local QA preparation uses a disposable working-tree npm package to include the
uncommitted Vault library additions. It is not a shippable release or proof that the
public pin contains those additions. Never distribute this QA bundle as
preview.3; release work must commit the intended source, update the dependency
pin normally, use a new version, rerun packaging checks and obtain publication
approval. Do not carry a dirty-build override into a normal release.

## What happens to the existing folders

This is the current view policy, not permission to reorganise the disk.
Folder names alone do not prove every file's purpose or who owns its cleanup.

| Existing location | Ordinary view / reason |
| --- | --- |
| `raw/`, `notes/`, ordinary custom folders | Markdown appears in Memory and Recent; other file types in Files |
| `structured/` | User memory in Memory/Recent; all original files accessible in Files |
| `incoming/` | Treat as user content by file type; do not assume it is disposable |
| `exports/`, `output/` | Original directories in Files, including exported Markdown |
| Legacy `attachments/` | Files remain visible; retain original links and location |
| A memory's adjacent `note.assets/` | Linked from its memory; original directories/files also browsable in Files |
| `indexes/`, `logs/`, `config/`, `tmp/` | Files only; no new expiry or cleanup is introduced |
| `app/` | Mixed/unknown: preserve user content; exclude only the two proven legacy source files listed below |
| Root `AGENTS.md`, `README.md` | Files, not Memory/Recent |
| `archive/` | Dedicated Archive view; deliberately kept content |
| `.trash/` | Dedicated Recently Deleted; new readable date/original-path convention is restorable, legacy unknown paths need manual recovery |

The generic API still returns the same readable paths. Presentation filtering is
not a security control or a change to what an authorised client may access.

## Relevant code and ownership

UI repository (`personal-vault-ui`):

- `app/page.tsx`: current view, search, note-opening and shortcut coordination.
- `components/Sidebar.tsx`, `FolderTree.tsx`, `TopAppBar.tsx`: navigation,
  original Files tree, contextual search labels and ordinary settings.
- `components/RecentView.tsx`, `SearchView.tsx`, `FileBrowser.tsx`: content lists,
  previews and empty/error states.
- `components/NoteActions.tsx`, `ArchiveView.tsx`: note actions and recovery UI.
- `components/LibraryView.tsx`, `DeletedView.tsx`: grouped ordinary material and
  separate recovery views; `lib/view-types.ts` defines navigation destinations.
- `lib/content-view.mjs`, `app/api/materials/route.ts`,
  `app/api/deleted/route.ts`: shared classification/grouping and thin adapters.
- `lib/editor-text.mjs`, `scripts/test-editor-text.mjs`: keep optional headers
  unchanged while the ordinary editor changes the note body.
- `app/api/files/route.ts`, `app/api/recent/route.ts`,
  `app/api/search/route.ts`, `lib/recent-files.mjs`: listing/search adapters and
  filtering; `lib/search-scope.mjs` selects the matching search collection.
  Inspect the shared classification helper before adding
  another list of technical filenames.
- `lib/frontmatter.mjs`, `lib/frontmatter.ts`: preserve optional metadata,
  Unicode and non-destructive malformed-header recovery.
- `desktop/main.cjs`, `desktop/preload.cjs`, `lib/desktop.ts`: native integration;
  coordinate carefully with the pre-existing connection work.
- `scripts/test-ui-rules.mjs`, `scripts/test-frontmatter.mjs`,
  `scripts/test-content-views.mjs`, `desktop/qa-smoke.cjs`,
  `desktop/simple-ui-qa.cjs`, `scripts/test-desktop.mjs`: test entry points.

Vault repository (`personal-vault`): read its own `AGENTS.md`, `lib/` public
operations, `mcp/personal-vault-server.mjs` adapters and existing fixture tests
before extending recoverable file operations. Keep the public API small and
neutral. The UI owns presentation; the file library owns file mechanics.

## Bounded follow-up tasks

Each item is intended to fit in at most one working day. Split an item further
if its evidence or implementation cannot fit that bound. Check the current
first-slice changes before duplicating any work.

1. Review the first slice with Nastia using the confirmed Memory vocabulary.
   Record whether she can import, save something and find it again without
   explanation. Do not ask the settled naming question again or replace Memory
   with a new abstraction. Make a narrow interaction/copy adjustment only.
2. Audit remaining content classification with representative fixtures. The
   shared policy already works across Memory, Recent and search. Add evidence for
   any further exclusions, especially mixed `app/` and `structured/`; do not
   replace the policy with a broad folder blacklist. Verify explicit warnings
   at the per-folder listing limit and large-vault search performance.
3. Protect unsaved drafts across view changes, selecting another file, closing
   previews and refreshing. Attachment, archive and delete are now disabled
   during editing; that does not protect against every navigation path. Add one
   consistent save/discard/cancel interaction and rendered regression tests.
4. Finish first-run and folder-choice acceptance. Verify an empty folder,
   importing conversations, choosing an existing folder and cancelling the
   native dialog. Cancellation must preserve the selected folder/settings.
   Do not turn this into a new account or model-connection setup requirement.
5. Polish collections and dates. Distinguish an actually empty collection from
   no filter matches, add Clear filters, and test titles/date fallbacks. Current
   month grouping uses a valid filename date or UTC modification-time fallback;
   “Updated” is actual mtime, not an invented creation date. Do not move files.
6. Finish Recently Deleted ordering and portability. The recoverable operations
   and rendered asset restore already pass. Check newest-first ordering before
   the list limit: the current bounded traversal can let old items occupy the
   first page. Add failure-mid-move checks, readable conflict messages and
   unsupported-filesystem handling. No purge, retention timer or guessed legacy
   destination. Existing backups still exclude `.trash`.
7. Improve file preview and native reveal. Verify image, PDF, video, Office and
   unknown-file paths, original download and attachment links. The current Open
   folder action opens the Vault root, not the selected file's folder; implement
   actual cross-platform reveal before claiming selected-file reveal works.
8. Complete keyboard/focus and platform audit. The 600px fixture layout and
   Escape in Settings pass, not a complete accessibility audit. Test Tab order,
   focus return, Enter/Space, preview close and shortcuts. Audit the pre-existing
   native MCP bridge for Windows/Linux assumptions; record untested platforms
   honestly. Full non-macOS packaging is a separate deliverable.
9. Prepare a real release only after integration review. Reconcile the existing
   uncommitted MCP work with this slice, commit the intended Vault source, update
   the UI dependency pin, choose a new version, build from clean source and
   repeat packaged fixtures. Present the actual release candidate for review.
   Publishing, replacing the installed app and sending a test email need their
   respective approval; this task does not grant it.

## Acceptance scenarios

All data is synthetic in a temporary folder, with isolated temporary app
settings. Never point a test at the real Vault or copy private notes into a
fixture. Check the actual rendered buttons, not only direct API calls.

- Fresh folder: create/open a new disposable Vault, see useful empty states,
  create a titled note without typing an extension, save and reopen it. The
  resulting ordinary file is readable outside the app.
- Existing folder: open a disposable pre-populated Vault with raw notes,
  `notes/`, mixed `structured/`, exports, generated media, technical folders,
  a global attachments folder and an unfamiliar custom folder. Opening and
  switching views do not migrate, rename, edit or delete any source bytes.
- Quiet Recent/search: recently modified technical files and a search term that
  appears in many logs do not crowd out actual user notes. All files still shows
  those same original technical paths. Incomplete results are labelled honestly.
- Custom content: a user document under a previously unknown folder remains
  reachable in normal content and search. User material in `structured/` is not
  lost because the enclosing folder also contains generated records.
- Unicode and metadata: Russian, other scripts, emoji, quotes, colon-space,
  BOM/CRLF, missing title and malformed YAML remain readable. No transliteration,
  automatic source repair or encoding conversion occurs.
- Archive versus deletion: archive one fixture note and delete another. They
  appear only in their respective views and are not silently shown as the same
  state. Restore each with its adjacent assets and working relative links. A
  conflicting destination is not overwritten. Legacy global attachments remain.
- Non-destructive inspection: record fixture file hashes before view/search
  checks and compare afterwards. Separately assert expected changes for explicit
  save/archive/delete/restore operations. Test logs must show a temporary root;
  no real files or normal application settings are changed.
- Layout and keyboard: at narrow and wide sizes, reach all navigation/actions
  using only the keyboard, create and cancel, open/close a preview, clear search,
  enter/leave All files, restore and recover focus. Visible labels and focus do
  not disappear on collapse or resizing.
- Native cancellation: opening another folder and cancelling leaves the current
  selected folder and saved settings unchanged. Verify on each actual target
  host before calling that operating system supported.

## Commands and verification boundaries

Use sibling checkouts, not a guessed `personal-vault-core` path. From their
common parent folder, inspect both worktrees first:

```sh
git -C personal-vault-ui status --short
git -C personal-vault-ui log -1 --oneline
git -C personal-vault status --short
git -C personal-vault log -1 --oneline
```

From `personal-vault-ui`:

```sh
npm test
npx tsc --noEmit
npm run build
```

The existing UI rule tests are fixture-based. Inspect changed test code before
running it. Add any new first-slice test script to the normal test command so the
next model does not overlook it. If shared file operations change, run the
fixture suites from `personal-vault` as well:

```sh
npm test
```

For the existing macOS packaged rendered-window suite, from `personal-vault-ui`:

```sh
npm run desktop:pack
npm run test:desktop
```

The packaged suite creates a temporary Vault using `mkdtemp`, passes
`PV_DESKTOP_SMOKE_ROOT`, and uses isolated test settings. Verify this isolation
still holds after edits. Packaging checks the Vault pin and clean dependency
state; a dirty-tree refusal is a real checkpoint. Do not casually set a dirty
override, discard other work, change the pin or claim a stale package tested the
new source. Inspect and coordinate the relevant changes first. If a new Vault
operation is uncommitted, a build of the old pin does not verify it.

The coordinating implementation did run the unit, build and rendered suites;
the exact observed receipts are below. Local fixture services were temporary,
not the user's running Vault service. The onboarding shell smoke script also
starts local services; inspect its current
authentication and fixture isolation before choosing it for future acceptance.
Do not run a default server command that might select the user's real folder.

### Observed verification, 30 October 2026

- UI: `npm test` passed `UI_RULES_OK`, `FRONTMATTER_OK`, `CONTENT_VIEWS_OK`,
  `EDITOR_TEXT_OK`. TypeScript and the production build passed. Existing Next.js
  viewport/themeColor warnings remain; do not call the build warning-free.
- Shared Vault: 41 library checks, MCP smoke, OpenAI import and 12 context checks
  passed. No real provider calls or user data were needed.
- Rendered source run: `node scripts/test-desktop.mjs --source` passed. This
  exercises the staged build at `.desktop-stage/web`, not live source files;
  restage after source edits. The boundary cleanup was rebuilt/restaged before
  its successful run. This mode is not a packaged signature check.
- Local QA-only app: `/tmp/pv-simple-ui-qa.wmsNrQ/app/mac-arm64/Personal Vault.app`.
  It uses a disposable working-tree npm package, not the unchanged public pin.
  Packaged checks passed `DESKTOP_CODEX_BRIDGE_OK`, `DESKTOP_METADATA_QA_OK`,
  `DESKTOP_SIMPLE_UI_QA_OK`, `DESKTOP_QA_OK`, `DESKTOP_OPENAI_IMPORT_OK`,
  `DESKTOP_NEW_NOTE_OK`, `DESKTOP_SMOKE_OK`, and post-launch signature validation.
  The final rebuilt QA app also passed the attachment-draft guard regression.
  It was rebuilt and retested again after the user's Memory terminology decision;
  rendered navigation, Add to memory, Save/Edit and recovery selectors passed.
  This is local ad-hoc signature validation, not Developer ID/notarization or a
  clean-machine Gatekeeper acceptance test.
- Synthetic snapshots: `/tmp/pv-simple-ui-qa.wmsNrQ/welcome.png`, `notes.png`,
  `files.png`. These are fixture images, not screenshots of private notes.
- Installed `/Applications/Personal Vault.app` was not replaced. No DMG/ZIP,
  public version, commit, service configuration or real Vault was changed.
- External review: `/tmp/pv-simple-ui-qa.wmsNrQ/review.html`, title “Personal Vault
  — User-owned memory”. The HTML renders this exact Markdown
  revision with its source SHA-256 and the three synthetic screenshots. Chrome
  title, URL and displayed content were verified; no embedded browser was used.
- Continuation, 30 October (later): bounded task 5 was partly implemented. An
  empty collection and a filter that hides every row are now separate states:
  `emptyState({ total, visible })` in `lib/content-view.mjs` returns `empty`,
  `no-matches` or `null`, and `components/LibraryView.tsx` renders “Nothing
  matches these filters” with a **Clear filters** action (widest view, not the
  default filter) instead of claiming the collection is empty. `npm test`
  (including new assertions), `npx tsc --noEmit` and `npm run build` passed. A
  rendered assertion covering no-match → Clear filters → rows restored was added
  to `desktop/simple-ui-qa.cjs` and passed against a disposable fixture. That
  rendered run required a stage built with `PERSONAL_VAULT_ALLOW_DIRTY=1`, so it
  later stopped at Delete with `Tool vault_files_trash not found`: the staged
  package is the pinned commit, which lacks the uncommitted Vault operations.
  The stage built for that check was deleted afterwards. Remaining in task 5:
  the genuine-empty rendered case and the title/date fallback padding.
- Finding for the next run: `scripts/test-desktop.mjs --source` serves
  `.desktop-stage/web`, not the working source tree. A stale stage silently
  tests older code — this run first “failed” against a 22:20 stage that predated
  the edit. Restage after every source change or the rendered receipt describes
  a build that no longer exists.
- Backup pending: a single-file upload to the configured private Google Drive
  remote at `Personal Vault/Backups/Project handoffs/2026-10-30/` returned success,
  but metadata/content verification failed with Google Drive HTTP 403
  `rateLimitExceeded` (shared API-client request quota, not disk space). This
  newer checkpoint revision has not been verified remotely. Do not call the
  handoff or uncommitted code backed up. Local repositories remain authoritative;
  verify the current revision before replacing an existing cloud copy.

## Resume here

1. Read both repository instructions and current changes; identify each active
   owner and preserve unrelated edits.
2. Recheck the observed results and remaining limitations above. Inspect the
   code instead of assuming a follow-up item is still unimplemented; this slice
   already includes the navigation, classification, grouped files and recovery.
3. Apply the confirmed Memory vocabulary above. Do not reopen the settled
   Note/Node/Capture/Entry naming question; inspect actual labels and fixtures.
4. Pick the next unfinished bounded task and verify it with disposable fixtures.
   Keep the distinction between prepared source, tested source, packaged build,
   external review, installed build and published release.
5. For user-facing handoff, open the exact prepared artifact in external macOS
   Google Chrome and verify it is displayed. An embedded preview or response
   link is not a substitute. If external verification is unavailable, retain the
   artifact, report the precise blocker and leave handoff status pending.
