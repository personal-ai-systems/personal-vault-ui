'use client';

import { useCallback, useEffect, useState } from 'react';

export interface VaultInfo {
  root: string | null;
  name: string | null;
  desktop: boolean;
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
