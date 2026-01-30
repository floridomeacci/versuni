import { StrategicDossier } from '../types';

const STORAGE_KEY = 'the_loop_dossiers_v1';

export const saveDossierToHistory = (dossier: StrategicDossier): void => {
  try {
    const existing = getDossierHistory();
    // Prevent duplicates by ID, though unlikely with timestamps
    const updated = [dossier, ...existing.filter(d => d.id !== dossier.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save dossier to history", e);
  }
};

export const getDossierHistory = (): StrategicDossier[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as StrategicDossier[];
  } catch (e) {
    console.error("Failed to retrieve history", e);
    return [];
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const deleteDossier = (id: string): void => {
    try {
        const existing = getDossierHistory();
        const updated = existing.filter(d => d.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to delete dossier", e);
    }
}
