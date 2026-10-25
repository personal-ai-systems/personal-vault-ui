# Personal Vault

**Your AI memory should belong to you, not to one model.**

Personal Vault keeps your notes, decisions, project context and attachments as ordinary files in a folder you own. The app gives you a simple way to browse, search and edit them. The same files remain readable in Finder, Windows File Explorer, Obsidian, VS Code or any Markdown editor.

This repository contains the first desktop client, and the current download is a macOS Apple Silicon preview. The Personal Vault engine itself is verified on macOS, Windows and Linux. Windows/Linux installers and secure access from ChatGPT or other compatible mobile MCP clients are **coming soon**; see the [platform support and architecture](https://github.com/personal-ai-systems/personal-vault#platform-support) in the main repository.

## Why use Personal Vault?

- **Switch AI models without rebuilding your memory.** Your saved context lives in your folder instead of being trapped inside one provider's chat history.
- **Choose the right model for each job.** Use OpenAI GPT or Codex models, Anthropic Claude, Google Gemini, DeepSeek, Kimi, or local models such as Llama, Qwen and Mistral through a suitable client.
- **Use it without AI.** The Mac app and ordinary files work on their own. No connector or MCP setup is required.
- **Connect AI when it helps.** A compatible client can use the optional MCP interface to list, read, search, create and update the same files.
- **Stay in control.** There is no hidden canonical database, required account or cloud subscription. You choose the folder and your backup.

## Three ways to use it

1. **As a Mac app:** choose a folder, then browse, search and edit your notes.
2. **As ordinary files:** open them directly or give selected files to any AI client that accepts file input.
3. **Through MCP:** connect a compatible AI client for controlled access to the Vault's file tools.

Personal Vault does not bundle model subscriptions or automatically connect every provider. Model support depends on the client you use and the access you grant it. Switching models preserves your files; the new client still needs to load the relevant context.

## Try the early preview

**[Download for Mac — Apple Silicon (.dmg)](https://github.com/personal-ai-systems/personal-vault-ui/releases/download/v0.2.0-preview.1/Personal.Vault-0.2.0-arm64.dmg)**

For Macs with an Apple M-series chip. Intel Macs and Windows are not supported by this build.

1. Open the DMG and drag **Personal Vault** into **Applications**.
2. Open the app. This preview is ad-hoc signed but is not Developer ID signed or notarized: macOS may block it. If you choose to proceed, use **System Settings → Privacy & Security → Open Anyway** after the first launch attempt. A new preview build may require this approval again. Do not disable macOS security globally.
3. Create a new Vault or open an existing folder. Personal Vault does not move or import anything automatically.
4. To bring your ChatGPT history with you, choose **1. Import OpenAI data** and select the ZIP downloaded from **ChatGPT → Settings → Data controls → Export data**. Each conversation becomes a readable `.md` file under `raw/year/month`.
5. Or create a note, attach a file, search for it, and try archiving and restoring it.

The OpenAI import is also available later under **Settings → Import OpenAI data**. Re-importing the same export skips conversations already in the Vault. The current importer converts conversation text; files and images referenced inside conversations remain in the original export. See [OpenAI's data export guide](https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data) for how to request the ZIP.

This is an early test version, with rough edges. Start with copies of files you can afford to lose. Cloud backup/sync and automatic app updates are not included.

**[Report a problem or suggest an improvement](https://github.com/personal-ai-systems/personal-vault-ui/issues)** — tell us what you tried, what happened, and your macOS version. Please leave private notes and personal information out of reports and screenshots.

[Release notes and ZIP download](https://github.com/personal-ai-systems/personal-vault-ui/releases/tag/v0.2.0-preview.1)

## For developers

This repository contains the desktop interface and macOS packaging. The [Personal Vault engine](https://github.com/personal-ai-systems/personal-vault) handles file operations through a local MCP service, bundled with the desktop app. End users do not need Node.js or MCP configuration.

Keep both source repositories as sibling directories. See [desktop development](docs/desktop-macos.md) for build instructions and limitations. Each downloadable preview is built from its tagged release; later source changes are not part of that download.
