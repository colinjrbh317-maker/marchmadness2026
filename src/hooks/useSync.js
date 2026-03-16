import { useEffect, useRef, useCallback, useState } from "react";

const SYNC_INTERVAL = 5000; // 5 seconds
const ROLE_KEY = "marchMadnessRole";

export function useSync(gameState, setGameState) {
  const [role, setRole] = useState(() => {
    try {
      return localStorage.getItem(ROLE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | pushing | pulling | error
  const pushTimerRef = useRef(null);
  const pullTimerRef = useRef(null);
  const lastPushRef = useRef(null);

  const setRoleAndSave = useCallback((newRole) => {
    setRole(newRole);
    try {
      localStorage.setItem(ROLE_KEY, newRole);
    } catch {}
  }, []);

  // Auctioneer: push state to KV (debounced)
  useEffect(() => {
    if (role !== "auctioneer") return;

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        const stateStr = JSON.stringify(gameState);
        // Skip if unchanged
        if (stateStr === lastPushRef.current) return;
        lastPushRef.current = stateStr;

        setSyncStatus("pushing");
        await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: stateStr,
        });
        setSyncStatus("idle");
      } catch {
        setSyncStatus("error");
      }
    }, 1000);

    return () => clearTimeout(pushTimerRef.current);
  }, [gameState, role]);

  // Viewer: poll KV for state updates
  useEffect(() => {
    if (role !== "viewer") return;

    async function poll() {
      try {
        setSyncStatus("pulling");
        const res = await fetch("/api/state");
        if (res.ok) {
          const data = await res.json();
          if (data && data.players) {
            setGameState(data);
          }
        }
        setSyncStatus("idle");
      } catch {
        setSyncStatus("error");
      }
    }

    poll();
    pullTimerRef.current = setInterval(poll, SYNC_INTERVAL);
    return () => clearInterval(pullTimerRef.current);
  }, [role, setGameState]);

  return {
    role,
    setRole: setRoleAndSave,
    syncStatus,
    isViewer: role === "viewer",
    isAuctioneer: role === "auctioneer",
  };
}
