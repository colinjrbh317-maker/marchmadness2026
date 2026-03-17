import { useState, useEffect, useCallback } from "react";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export function usePredictions() {
  const [predictions, setPredictions] = useState([]);
  const [valueBets, setValueBets] = useState([]);
  const [bonusPicks, setBonusPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [preds, values, bonus] = await Promise.all([
        fetchJSON("/data/predictions.json"),
        fetchJSON("/data/value_bets.json"),
        fetchJSON("/data/bonus_picks.json"),
      ]);
      setPredictions(preds);
      setValueBets(values);
      setBonusPicks(bonus);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { predictions, valueBets, bonusPicks, loading, error, lastUpdated, refresh };
}
