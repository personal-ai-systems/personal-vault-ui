# Personal Vault

Personal Vault is local-first memory for AI that you own. It stores your notes and files as ordinary Markdown and attachments in a folder on your Mac, so you can use them with any editor without locking your data into one app or AI provider.

The Mac app lets you browse, search and edit the same files. No account or cloud subscription is needed.

## Try the early preview

**[Download for Mac — Apple Silicon (.dmg)](https://github.com/personal-ai-systems/personal-vault-ui/releases/download/v0.1.0-preview.2/Personal.Vault-0.1.0-arm64.dmg)**

For Macs with an Apple M-series chip. Intel Macs and Windows are not supported by this build.

1. Open the DMG and drag **Personal Vault** into **Applications**.
2. Open the app. This preview is unsigned and not notarized: macOS may block it. If you choose to proceed, use **System Settings → Privacy & Security → Open Anyway** after the first launch attempt. Do not disable macOS security globally.
3. Choose a new, empty folder for testing. This build starts with a folder picker; the welcome-screen redesign is still in development.
4. Create a note, attach a file, search for it, and try archiving and restoring it.

This is an early test version, with rough edges. Start with copies of files you can afford to lose. Cloud backup/sync and automatic app updates are not included.

**[Report a problem or suggest an improvement](https://github.com/personal-ai-systems/personal-vault-ui/issues)** — tell us what you tried, what happened, and your macOS version. Please leave private notes and personal information out of reports and screenshots.

[Release notes and ZIP download](https://github.com/personal-ai-systems/personal-vault-ui/releases/tag/v0.1.0-preview.2)

## For developers

This repository contains the desktop interface and macOS packaging. The [Personal Vault engine](https://github.com/personal-ai-systems/personal-vault) handles file operations through a local MCP service, bundled with the desktop app. End users do not need Node.js or MCP configuration.

Keep both source repositories as sibling directories. See [desktop development](docs/desktop-macos.md) for build instructions and limitations. The downloadable preview is an earlier build; uncommitted local development is not part of that release.
