# Personal Vault

**Your AI memory should belong to you, not to one model.**

Personal Vault keeps your notes, decisions, project context and attachments as ordinary files in a folder on your Mac. Browse, search and edit them in the app, or open the same files in Finder, Obsidian, VS Code or any Markdown editor.

Because the memory stays outside the AI provider, you can use it with OpenAI GPT or Codex models, Anthropic Claude, Google Gemini, DeepSeek, Kimi, or local models such as Llama, Qwen and Mistral through a suitable client.

Use Personal Vault on its own, give selected files directly to an AI, or connect a compatible AI client through the optional MCP interface. No account or cloud subscription is required. You choose the folder and your backup.

Personal Vault does not bundle model subscriptions or automatically connect every provider. Model support depends on the client and the access you grant it. Switching models preserves your files; the new client still needs to load the relevant context.

## Try the early preview

**[Download for Mac — Apple Silicon (.dmg)](https://github.com/personal-ai-systems/personal-vault-ui/releases/download/v0.2.0-preview.1/Personal.Vault-0.2.0-arm64.dmg)**

For Macs with an Apple M-series chip. Intel Macs and Windows are not supported by this build.

1. Open the DMG and drag **Personal Vault** into **Applications**.
2. Open the app. This preview is ad-hoc signed but is not Developer ID signed or notarized: macOS may block it. If you choose to proceed, use **System Settings → Privacy & Security → Open Anyway** after the first launch attempt. A new preview build may require this approval again. Do not disable macOS security globally.
3. Create a new Vault or open an existing folder.
4. To bring your ChatGPT history with you, choose **1. Import OpenAI data** and select the ZIP downloaded from **ChatGPT → Settings → Data controls → Export data**. Each conversation becomes a readable Markdown file under `raw/year/month`.
5. Or create a note, attach a file, search for it, and try archiving and restoring it.

OpenAI import remains available later under **Settings → Import OpenAI data**. Re-importing the same export skips conversations already present. This preview imports conversation text; files and images referenced inside conversations remain in the original export.

This is an early test version, with rough edges. Start with copies of files you can afford to lose. Cloud backup/sync and automatic app updates are not included.

**[Report a problem or suggest an improvement](https://github.com/personal-ai-systems/personal-vault-ui/issues)** — tell us what you tried, what happened, and your macOS version. Please leave private notes and personal information out of reports and screenshots.

[Release notes and ZIP download](https://github.com/personal-ai-systems/personal-vault-ui/releases/tag/v0.2.0-preview.1)


Version 0.2.0 Preview 1 adds OpenAI export import as the first onboarding action. It preserves the clean-Mac New note layout fix and all readable-file workflows from 0.1.1.

SHA-256:
```
165dc157ff12c9584a9f731fadbd0653a4d11eafa56aab1e0e6cc406542061b9  Personal.Vault-0.2.0-arm64.dmg
f75ffc93943cc4dafed11195f621ba83f4270b83385fc83ece8334c3605076da  Personal.Vault-0.2.0-arm64-mac.zip
```
