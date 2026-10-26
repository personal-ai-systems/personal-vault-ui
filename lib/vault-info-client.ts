'use client';

import { useCallback, useEffect, useState } from 'react';

export interface VaultInfo {
  root: string | null;
  name: string | null;
  desktop: boolean;
  mcpEndpoint?: string | null;
  appVersion?: string | null;
}

async function request(method: 'GET' | 'POST', body?: object): Promise<any> {
  const response = await fetch('/api/vault-info', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Vault information is unavailable.');
  return data;
}

/** The folder the desktop app selected, as read-only display information. */
export function useVaultInfo() {
  const [info, setInfo] = useState<VaultInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    request('GET')
      .then((data) => { if (active) setInfo(data); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  return { info, error };
}

/** Reveals or re-chooses the Vault through the Electron main process. */
export function useVaultActions() {
  const [busy, setBusy] = useState<'reveal' | 'choose' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(async (action: 'reveal' | 'choose') => {
    setBusy(action);
    setMessage(null);
    try {
      const data = await request('POST', { action });
      if (!data.ok) setMessage(data.reason || 'That action is only available in the Personal Vault app.');
      return data.ok as boolean;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
      return false;
    } finally { setBusy(null); }
  }, []);

  return { run, busy, message, clearMessage: () => setMessage(null) };
}

declare global {
  interface Window {
    personalVault?: {
      importOpenAI: () => Promise<{ ok: boolean; canceled?: boolean; imported?: number; skipped?: number; error?: string }>;
    };
  }
}

/** Opens the native file picker and imports an OpenAI export into readable notes. */
export function useOpenAIImport() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (!window.personalVault?.importOpenAI) {
        setMessage('OpenAI import is available in the installed Personal Vault app.');
        return false;
      }
      const result = await window.personalVault.importOpenAI();
      if (result.canceled) return false;
      if (!result.ok) {
        setMessage(result.error || 'The OpenAI export could not be imported.');
        return false;
      }
      const imported = result.imported || 0;
      const skipped = result.skipped || 0;
      setMessage(`${imported} conversation${imported === 1 ? '' : 's'} imported${skipped ? `; ${skipped} already present` : ''}.`);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return { run, busy, message };
}
