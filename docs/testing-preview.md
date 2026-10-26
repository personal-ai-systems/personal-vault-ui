# Try Personal Vault preview.3

Personal Vault keeps your conversations and notes as ordinary files you own. You can read them without AI, or share selected context with an AI without starting from scratch. Importing your history is not training a model and does not automatically change ChatGPT's memory.

This installer is for Apple Silicon Macs (M1/M2/M3 and later), not Intel Macs or Windows. Start with a separate test folder. Do not use your only copy of important notes.

## Install

1. Save any open notes and quit the old Personal Vault app.
2. Download [Personal Vault 0.2.1-preview.3 DMG](https://github.com/personal-ai-systems/personal-vault-ui/releases/download/v0.2.1-preview.3/Personal.Vault-0.2.1-preview.3-arm64.dmg). A [ZIP alternative](https://github.com/personal-ai-systems/personal-vault-ui/releases/download/v0.2.1-preview.3/Personal.Vault-0.2.1-preview.3-arm64-mac.zip) is also available.
3. Open the DMG and drag Personal Vault into Applications. Confirm replacing the old app if asked. Replacing the app does not migrate or delete your separate Vault folder.
4. Open Personal Vault from Applications, not an older Chrome shortcut named Personal Vault.
5. This preview is ad-hoc signed, not Apple-notarized. macOS may block it again even if you approved an older build. After attempting to open it, use System Settings → Privacy & Security → Open Anyway only if you trust this download. Do not disable Gatekeeper or your Mac's security globally. If there is no safe approval option, stop and send the exact message.
6. Check Personal Vault → About Personal Vault in the macOS menu bar: the version must be **0.2.1-preview.3**.
7. On first launch, create a new Vault and choose a test location. If the app remembers an existing folder, that is expected: use Personal Vault → Open another Vault… → Create a new Vault. Check the full folder path in the sidebar before testing.

## The first ten checks

| Check | What to do | Expected result |
| --- | --- | --- |
| 1. Your folder | Open the Vault location menu in the sidebar and choose Show in Finder. | Finder opens the exact folder shown in the app. Your notes are not hidden inside the application. |
| 2. Any language | Choose New note. Name it `Мои мысли 📝.md` and write `Планы: обсудить отпуск. Проверка-7429`. Save. | The note opens, a readable `.md` file exists in Finder, and Russian text, punctuation and emoji stay intact. |
| 3. Latest first | Create a second note. Then edit and save the first one. Open Recent and the containing folder. | The most recently modified note is above the older note. No scrolling to the bottom is needed. |
| 4. Find it | Search for `Проверка-7429`, then open the result. | The correct note and its full content appear. Clear the search to return to browsing. |
| 5. Save safely | Try creating another note with the same filename in the same folder. | The app refuses to replace the existing note. Its original content remains. |
| 6. Attachment | Open the first note, attach a disposable picture, and inspect its folder in Finder. | The image appears in the note; a visible sibling `.assets` folder holds the attachment. |
| 7. Archive and restore | Archive that note, open Archive, and restore it. | The note leaves its original folder, is visible in Archive, then returns with its picture and working link. |
| 8. Reopen | Quit and reopen Personal Vault. | The same selected folder, saved notes and attachment remain. Settings contains import controls, not a version or local server address. |
| 9. Import history | If your ChatGPT account offers Export data, request the ZIP from Settings → Data controls. In the test Vault choose Import OpenAI data and select it. | Conversations become `.md` files in `raw/year/month`. Open a familiar conversation and search for a distinctive phrase. Export availability depends on your account/workspace. |
| 10. Repeat import | Select that same export again. | Previously imported conversations are skipped, not duplicated or overwritten. |

The importer currently converts conversation text. Referenced images/files remain in the original export; keep that ZIP private and retain it. A large export can take time. Do not send your export or private screenshots with a bug report.

## Regression checks for the two reported bugs (optional)

In the **test folder only**, create a plain-text UTF-8 file named `broken-header.md` using a Markdown/text editor:

```markdown
---
title: Мысли: планы 📝
---
# The note must still open
Nothing in this file should be silently rewritten.
```

The header deliberately has a formatting mistake. Recent must still list all notes. Opening it from the folder or Recent must show a short warning and the complete original text, including the header. Russian and emoji are not the error.

Create a second file, `object-title.md`:

```markdown
---
title: {nested: value}
---
# Another readable note
```

Its title is not text. Recent and search must use `object-title.md` as the display name, not crash or show `[object Object]`. Both original files must remain unchanged.

## Ask ChatGPT about your imported history

### Available immediately: one selected file

Find an imported conversation in Personal Vault, open its folder in Finder, and attach that `.md` file to a new ChatGPT conversation if file upload is available in your account. Ask:

> Based only on the attached conversation, what did I decide about [topic]? Quote the relevant passage. If the answer is not in this file, say so.

Expected: the answer agrees with the file you can inspect yourself. ChatGPT only receives what you attach; it cannot search the rest of your Vault this way. Ask a question about a different, unshared conversation: it should not claim to have searched that file.

### Optional: automatic search through MCP

**Not connected automatically in this preview.** The bundled server is local to the Mac. A local compatible client can be configured separately. ChatGPT on the web needs a reachable server or a separately configured Secure MCP Tunnel, with access limited to **your** selected folder. Do not paste `localhost` into ChatGPT and expect it to reach your Mac. Never use another person's Vault endpoint or expose an unauthenticated server to the internet.

For setup, follow OpenAI's [custom MCP connection guide](https://developers.openai.com/api/docs/guides/custom-mcp-server) and [Secure MCP Tunnel guide](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels). This is a separate setup step, not evidence that your connection is already working.

After the connection is configured and its selected Vault has been verified, select that plugin in a new ChatGPT web conversation and ask:

> Use only my Personal Vault connection. Search for Проверка-7429, read the matching file, and quote the line with its file path. If the connection is unavailable or there is no match, say so. Do not guess or change files.

Expected: an actual search and read of the test note with the exact phrase/path. Then ask about one imported conversation and compare the answer with its Markdown. A disconnected test must report unavailable, not invent a remembered answer. Do not mark this scenario passed if ChatGPT merely answers from its own chat history.

## Report the result

Reply with the version from About, your macOS version, the check number, what you clicked, what you expected and what happened. A cropped screenshot is useful; remove private content. Mark a check as **passed**, **failed**, **not tested** or **connection not configured**. A successful local MCP test is not proof of ChatGPT access.
