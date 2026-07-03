/** localStorage user bank + JSON export/import. */

import type { Patch } from '../engine/types';

const KEY = 'dx1.userBank.v1';

export function loadUserBank(): Patch[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserBank(bank: Patch[]): void {
  localStorage.setItem(KEY, JSON.stringify(bank));
}

export function savePatchToBank(patch: Patch): Patch[] {
  const bank = loadUserBank();
  const idx = bank.findIndex(p => p.name === patch.name);
  if (idx >= 0) bank[idx] = patch;
  else bank.push(patch);
  saveUserBank(bank);
  return bank;
}

export function deletePatchFromBank(name: string): Patch[] {
  const bank = loadUserBank().filter(p => p.name !== name);
  saveUserBank(bank);
  return bank;
}

export function exportPatchJson(patch: Patch): void {
  const blob = new Blob([JSON.stringify(patch, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${patch.name.trim().replace(/[^a-zA-Z0-9-_ ]/g, '') || 'patch'}.dx1.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importPatchJson(file: File): Promise<Patch> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const patch = JSON.parse(reader.result as string) as Patch;
        if (!patch.ops || patch.ops.length !== 6 || typeof patch.algorithm !== 'number') {
          throw new Error('Not a valid DX1 patch file');
        }
        resolve(patch);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
