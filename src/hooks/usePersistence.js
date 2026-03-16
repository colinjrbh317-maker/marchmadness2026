import { useEffect, useRef, useCallback } from "react";
import { createInitialState, STATE_VERSION } from "../data/constants";

const STORAGE_KEY = "marchMadness2026";
const DEBOUNCE_MS = 300;

export function usePersistence(gameState, setGameState) {
  const timerRef = useRef(null);

  // Auto-save to localStorage (debounced)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const payload = { version: STATE_VERSION, state: gameState };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("Failed to save state:", e);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [gameState]);

  // Export state as JSON file
  const exportState = useCallback(() => {
    const payload = { version: STATE_VERSION, state: gameState };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `march-madness-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [gameState]);

  // Import state from JSON file
  const importState = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.state || !data.state.players || !data.state.budgets) {
            reject(new Error("Invalid backup file format"));
            return;
          }
          setGameState(data.state);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }, [setGameState]);

  // Reset to initial state
  const resetState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(createInitialState());
  }, [setGameState]);

  return { exportState, importState, resetState };
}

// Load saved state on initial mount
export function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version === STATE_VERSION && data.state) {
      return data.state;
    }
    return null;
  } catch {
    return null;
  }
}
