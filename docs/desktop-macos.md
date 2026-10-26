# macOS Apple Silicon preview

Status: **public early preview**, not a production release. Vault and UI source
repositories are public. New archives require tests and separate publication;
local preparation does not update an existing GitHub download.

## Current QA build — 0.2.1-preview.2, 26 October 2026

Vault revision: `af344aa`. Prepared locally; no GitHub release was replaced.

Fixed and regression-tested:

- Files use last-modified time, newest first, in both list and sidebar. Calendar
  folders use newest first; ordinary folder names remain alphabetical.
- Real desktop writes no longer fail with `Invalid origin` when Next normalizes
  its internal URL to localhost. Token checks and foreign-Origin rejection remain.
- Recent scans folders instead of truncating the entire Vault at 1000 entries.
  Archives and adjacent attachment folders are excluded. A single folder at the
  1000-entry cap produces an explicit incomplete-list warning, not a false claim.
- Attaching a file adds a readable Markdown link. Relative images and note links
  resolve from the note's folder. Binary previews use a bounded generic MCP read.
- Newly created notes open during search, sidebar navigation clears search,
  duplicate names do not overwrite, and edit controls wait for note content.
- Search results carry real metadata. Download/copy preserve original Markdown,
  including frontmatter. Preview closes with Escape.
- Settings shows the app version and its current loopback MCP address; that
  address is available on this Mac while the app runs and changes on restart.

Evidence: `npm test` (including an 1800-note Recent fixture), source typecheck,
`desktop:build`, and the packaged `test:desktop` suite passed. The native rendered
suite clicks list/tree navigation, linked notes, new note during search, duplicate
save, edit/save, image attachment, archive/restore, Recent/Archive/Settings,
preview/download and close. Download bytes equal the original Markdown. Copy
payload is checked with a renderer clipboard stub; the user's clipboard is not
changed. A separate SDK client discovers the packaged MCP tools and reads the
saved fixture note. Binary preview without the UI token is rejected; a foreign
Origin is rejected even with the token. Post-launch signature, ZIP integrity and
DMG checksum checks passed. All automated writes use temporary Vaults/settings.

Native macOS inspection of the installed app's Open another Vault chooser and
Escape cancellation left its saved folder configuration byte-for-byte unchanged.
Its existing Vault reopening is expected upgrade behaviour, not an automatic
import or migration. A read-only SDK connection to its own dynamic MCP port also
succeeded; it was not confused with the separate port-8788 service.

Limits: a second Mac and the successful native import-picker journey were not
tested in this run (conversion/import and native bridge are tested separately).
External-web-link browser acceptance remains pending. Larger-than-10-MiB preview
files need Finder. This build does not add remote/mobile hosting, internet file
sharing, encrypted restore drills or unsaved-draft protection on app exit.
Legacy Assistant-shaped MCP tools remain compatibility debt; this additive
preview operation does not remove them or claim a strict Assistant-free surface.

Archives in `dist/`:

- `Personal Vault-0.2.1-preview.2-arm64-mac.zip`: SHA-256
  `991bd4de15d1c03d221af1785fea1b9e32d4f81390505f5ca27c8d7f1a67b2ef`.
- `Personal Vault-0.2.1-preview.2-arm64.dmg`: SHA-256
  `18cb8fd4478d13c088e857196f17b65ba381b80baa12f75396f40fc48597130f`.

## Earlier local preparation

The local `0.2.1-preview.1` preparation uses Vault revision `71e5c0d`: typed
file operations, attachment-safe note renames and stricter metadata paths.
This version is not a GitHub release until its tested archives are published.

Local verification, 26 October 2026: `desktop:build`, packaged `test:desktop`,
post-launch signature verification, ZIP integrity and DMG checksum checks passed.
The bundled Vault ref is `71e5c0d`. External-Chrome review and installation on a
second Mac were not performed for this build. It remains ad-hoc signed and not
notarized. No GitHub assets were replaced by local preparation.

## How the two repositories connect

Keep `personal-vault` and `personal-vault-ui` as siblings. UI owns desktop packaging; Vault owns file operations. `PERSONAL_VAULT_SOURCE=/another/checkout` overrides the source location at build time only.

The Vault is installed as a **pinned npm dependency**, not copied by hand.

`desktop/vault-dependency.json` records the exact commit the app ships:

```json
{
  "remote": "git+ssh://git@github.com/personal-ai-systems/personal-vault.git",
  "ref": "<commit sha>",
  "refKind": "commit"
}
```

`scripts/build-desktop.mjs` installs that ref into `.desktop-stage/vault/node_modules/personal-vault`, so the packaged server and its shared library always come from one resolved package. Three checks run before anything is packaged, and any failure stops the build instead of producing an app that crashes on launch:

1. the local checkout is at the pinned commit and has no uncommitted changes;
2. the installed package resolves through its exports map and exports `createVault`;
3. the installed server starts against a throwaway root and answers `/status`.

Shipped values land in `Contents/Resources/build-info.json` under `vault`: the ref, the resolved package version, the server's reported version, and SHA-256 hashes of `mcp/personal-vault-server.mjs` and `lib/index.mjs`.

**When you commit to `personal-vault`, update the pin.** The build refuses to run against a different commit, because that is how the app previously shipped a server nobody had tested. One-line edit, then rebuild.

The desktop runtime resolves the server at
`Resources/vault/node_modules/personal-vault/mcp/personal-vault-server.mjs`.

```
Electron window -> bundled Next.js UI/API -> bundled Vault MCP -> selected folder
```

The desktop launcher picks loopback ports, generates a random per-launch secret, starts both servers using Electron's bundled Node runtime, waits for readiness and opens the existing web UI in a sandboxed window. Closing the app stops its children. MCP does not require user configuration. UI list/read/search/recent and create/update/attach/archive/restore use MCP, not a second store. Legacy Assistant API routes are blocked. Domain features are not part of this preview.

On first normal launch the app explains itself before asking for anything: a welcome step ("Your notes and files, in your own folder.") offers **Create a new Vault** (defaults to `~/Documents/Personal Vault`, with a "Choose location…" override; the folder is created only after confirmation) or **Open an existing folder** (native folder picker, with the copy "Your files stay where they are. Nothing is moved or imported."). Only its path is saved in Electron's normal Application Support settings. Notes remain in the selected folder, never in the application bundle, and no files are imported or moved. The sidebar always shows the folder name and full path with its own menu: Show in Finder, Open another Vault…, Copy folder path. App menu → Open another Vault… offers both actions and **Cancel keeps the current Vault open**; cancelling never deletes the saved setting.

## Build automatically (developer only)

Requires an Apple Silicon Mac, Node 24+, npm and sibling source checkouts. From personal-vault-ui:

```sh
npm ci
npm run desktop:build
npm run test:desktop
```

The build runs Vault tests, builds the Next standalone web server, stages only the web output/public assets and the Vault server/package manifests/LICENSE, installs locked production Vault dependencies, packages Electron arm64, and emits DMG and ZIP in `dist/`. An after-pack hook copies standalone runtime dependencies explicitly and checks their presence. No user's Vault or `.env` file is copied. Staging and output are ignored by Git. `desktop:pack` produces only `.app`; `desktop:stage` only stages resources.

Review changes with `git diff` and `git status` in BOTH repositories. No automatic commits/pushes.

### Unsigned local builds (default)

By default no Apple credentials are required and no codesigning identity is used:

```sh
npm run desktop:build
```

`CSC_IDENTITY_AUTO_DISCOVERY=false` makes electron-builder skip Developer ID
signing. The notarization hook skips without credentials. This allows local
verification, but does not remove Gatekeeper warnings for downloaded previews.

### Signed and notarized release build

To produce a signed/notarized build suitable for distribution you must first complete the Apple-side setup below, then run:

```sh
# Option A: App Store Connect API key (recommended for CI)
export APPLE_API_KEY="/path/to/AuthKey_xxxxxxxxxx.p8"
export APPLE_API_KEY_ID="xxxxxxxxxx"
export APPLE_API_ISSUER="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export CSC_IDENTITY_AUTO_DISCOVERY=true
npm run desktop:build

# Option B: Apple ID + app-specific password (interactive/local)
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
export CSC_IDENTITY_AUTO_DISCOVERY=true
npm run desktop:build
```

## Install (tester)

Open the DMG, drag Personal Vault to Applications. **Because this build is not Developer ID signed or notarized, do not double-click it the first time.** Instead:

1. Open **Finder** → **Applications**.
2. **Right-click (or Control-click)** on **Personal Vault** and choose **Open**.
3. In the security dialog click **Open**. The app will launch and this warning will not appear again for this copy.

Alternative methods if the above does not appear:

- **System Settings → Privacy & Security**, scroll down to the **Security** section, and click **"Open Anyway"** next to the Personal Vault block.
- From **Terminal**:
  ```sh
  xattr -d com.apple.quarantine "/Applications/Personal Vault.app"
  ```
  Then double-click the app normally.

Select a NEW empty test folder first. Node, Terminal, MCP clients and developer checkouts are not needed at runtime.

> Do not ask testers to disable Gatekeeper globally (`spctl --master-disable`).
> The preview is not Developer ID signed or notarized. Testers may encounter
> warnings; never describe the manual workaround as equivalent to notarization.

## Verification

`npm run test:desktop` runs the actual packaged executable against an automatically removed temporary folder, uses isolated temporary app settings, loads the window, and verifies UI -> MCP -> filesystem create/edit/attach/search/archive/restore, service authorization, the `/api/vault-info` folder reporting and blocked domain routes. It bypasses the folder dialog for testing. This is NOT evidence of a clean second-Mac install or interactive first-run dialog acceptance.

`npm run test:onboarding` (no window, no packaging) runs the Next.js standalone server exactly as Electron forks it against a temporary Vault and a real MCP server, and checks: unauthorized requests are refused, `/api/vault-info` reports the real folder, `/api/files` no longer returns a placeholder name, nested listing works, create/update/archive/restore reach the filesystem through MCP, no hidden storage appears, the Show in Finder / Open another Vault actions arrive in the main process over IPC, legacy Assistant routes stay blocked, and the rendered page carries the new copy without the account chrome.

## Known limitations before external release

- Current npm audit reports zero known vulnerabilities after dependency updates; this is not a security audit.
- The editor is now a visible "New note" action (toolbar, `⌘N`) that writes a Markdown file into the folder shown in the sidebar; editing an existing note happens in the note detail panel next to the file list. Both go through MCP only. A Finder-like rename/move workflow is still not implemented.
- Attachment files are saved beside notes; automatic Markdown insertion/inline local attachment preview is not implemented.
- List/recent is capped at 1000 enumerated entries; not a complete large-vault index.
- Existing web components remain, but Assistant endpoints are intentionally blocked. Unused early drafts of the sidebar/top bar still live in `app/components/` and `components/*.backup`; nothing imports them, and they still contain their old mock copy.
- Filesystem symlinks are refused in operations; not a sandbox against a hostile local process replacing directories concurrently. Concurrent-writer and crash-atomic-save guarantees need further review.
- No auto-updater, Intel/Windows build or cloud sync in this preview.
- A normal folder-dialog and install test on the target M2 is still required.
- Developer ID signing and notarization remain release-readiness work; current
  preview testing does not prove frictionless installation on another Mac.

## Apple Developer Program prerequisites (for a frictionless public release)

The project cannot sign or notarize without genuine Apple credentials. Local
ad-hoc testing can continue, but downloaded previews still need the documented
manual approval. Do not promise that approval carries over to a changed build.

Before that public macOS release, the Apple account owner must:

1. **Enroll in the Apple Developer Program** (Organization or Individual).  
   https://developer.apple.com/programs/
2. **Create a Developer ID Application certificate** in Certificates, Identifiers & Profiles, download and import it into the macOS Keychain, then verify with:
   ```sh
   security find-identity -v -p codesigning
   ```
   The identity should read `Developer ID Application: Your Name/Org (TEAMID)`.
3. **Create an App Store Connect API key** with **Admin** or **App Manager** role, download the `.p8` private key file, and note the Key ID and Issuer ID.  
   https://appstoreconnect.apple.com/access/integrations/api
4. **Register the app identifier** `org.personalaisystems.vault` (or update `appId` in `package.json` to match an existing identifier) at:  
   https://developer.apple.com/account/resources/identifiers/list

### Useful notarytool commands once credentials exist

Store credentials in the keychain interactively (optional, for local Apple ID flow):
```sh
xcrun notarytool store-credentials \
  --apple-id "you@example.com" \
  --team-id "XXXXXXXXXX" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  personal-vault-notary
```

Submit an archive manually for a dry run:
```sh
xcrun notarytool submit "dist/Personal Vault-0.1.1-arm64-mac.zip" \
  --key /path/to/AuthKey_xxxxxxxxxx.p8 \
  --key-id xxxxxxxxxx \
  --issuer xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  --wait
```

Staple after successful notarization:
```sh
xcrun stapler staple "dist/mac-arm64/Personal Vault.app"
```

## Verified locally on 2026-10-23

- `npm run desktop:build`: exit 0; Next 16.4.2 production build; DMG and ZIP generated.
- `npm run test:desktop`: exit 0 against the final packaged app; the **New note** dialog rendered at 672 px and the full API/file journey passed.
- `hdiutil verify`: DMG checksum VALID.
- Executable identified as Mach-O arm64.
- Backend regression tests pass. The production dependency audit and the packaged runtime audit report zero known vulnerabilities.
- Child service processes absent after successful test exit.
- The extracted ZIP and mounted read-only DMG both passed the packaged UI/file journey and retained a valid ad-hoc bundle signature after launch.
- No Developer ID signing, Apple notarization or manual clean-machine folder-dialog acceptance claimed.
