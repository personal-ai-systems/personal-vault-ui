# macOS Apple Silicon preview

Status: **internal verification/testing only**. Repositories remain private. Do not distribute the preview release publicly.

## How the two repositories connect

Keep `personal-vault` and `personal-vault-ui` as siblings. UI owns desktop packaging; Vault owns file operations. `PERSONAL_VAULT_SOURCE=/another/checkout` overrides the source location at build time only.

```
Electron window -> bundled Next.js UI/API -> bundled Vault MCP -> selected folder
```

The desktop launcher picks loopback ports, generates a random per-launch secret, starts both servers using Electron's bundled Node runtime, waits for readiness and opens the existing web UI in a sandboxed window. Closing the app stops its children. MCP does not require user configuration. UI list/read/search/recent and create/update/attach/archive/restore use MCP, not a second store. Legacy Assistant API routes are blocked. Domain features are not part of this preview.

On first normal launch a native folder dialog lets the user select/create a folder. Only its path is saved in Electron's normal Application Support settings. Notes remain in the selected folder, never in the application bundle. App menu -> Choose another Vault changes the selection.

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

`CSC_IDENTITY_AUTO_DISCOVERY=false` is set inside the build script so electron-builder skips Developer ID signing. The `afterSign` notarization hook also checks for credentials and skips notarization when none are present. This keeps the existing internal verification path intact while the repo is private.

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

Open the DMG, drag Personal Vault to Applications, then double-click it. Select a NEW empty test folder first. Node, Terminal, MCP clients and developer checkouts are not needed at runtime.

IMPORTANT: preview builds before signing are not Developer ID signed or notarized. macOS Gatekeeper may block an Internet-downloaded copy. Do not ask testers to disable Gatekeeper. Developer ID signing and Apple notarization are release prerequisites for a frictionless nontechnical installation; they need the owner's credentials.

## Verification

`npm run test:desktop` runs the actual packaged executable against an automatically removed temporary folder, uses isolated temporary app settings, loads the window, and verifies UI -> MCP -> filesystem create/edit/attach/search/archive/restore, service authorization and blocked domain routes. It bypasses the folder dialog for testing. This is NOT evidence of a clean second-Mac install or interactive first-run dialog acceptance.

## Known limitations before external release

- Current npm audit reports zero known vulnerabilities after dependency updates; this is not a security audit.
- The editor is an initial expandable panel requiring a relative filename, not a polished Finder-like save workflow.
- Attachment files are saved beside notes; automatic Markdown insertion/inline local attachment preview is not implemented.
- List/recent is capped at 1000 enumerated entries; not a complete large-vault index.
- Existing web components remain, but Assistant endpoints are intentionally blocked. Some legacy navigation labels need cleanup.
- Filesystem symlinks are refused in operations; not a sandbox against a hostile local process replacing directories concurrently. Concurrent-writer and crash-atomic-save guarantees need further review.
- No auto-updater, Intel/Windows build or cloud sync in this preview.
- A normal folder-dialog and install test on the target M2 is still required.

## Apple Developer Program prerequisites (owner must complete)

The project cannot sign or notarize with fabricated credentials. Before a public macOS release, the Apple account owner must:

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
xcrun notarytool submit dist/Personal.Vault-0.1.0-arm64-mac.zip \
  --key /path/to/AuthKey_xxxxxxxxxx.p8 \
  --key-id xxxxxxxxxx \
  --issuer xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
  --wait
```

Staple after successful notarization:
```sh
xcrun stapler staple "dist/mac-arm64/Personal Vault.app"
```

## Verified locally on 2026-09-18

- `npm run desktop:build`: exit 0; Next 16.3.5 production build; DMG and ZIP generated.
- `npm run test:desktop`: exit 0 against the final packaged app; window title and full API/file journey verified.
- `hdiutil verify`: DMG checksum VALID.
- Executable identified as Mach-O arm64.
- Backend regression tests and working-tree secret scan pass. Both npm audits report zero known vulnerabilities.
- Child service processes absent after successful test exit.
- No clean-machine installation, signing/notarization or manual native folder-dialog acceptance claimed.
