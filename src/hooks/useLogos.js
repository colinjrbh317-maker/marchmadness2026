import { useState, useEffect, useRef } from "react";
import { TEAMS } from "../data/teams";

const CACHE_KEY = "marchMadnessLogos";

export function useLogos() {
  const [logos, setLogos] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const teamsToFetch = TEAMS.filter(
      (t) => !t.firstFour && !logos[t.id]
    );
    if (teamsToFetch.length === 0) return;

    async function fetchBatch(batch) {
      const results = await Promise.allSettled(
        batch.map(async (team) => {
          try {
            const res = await fetch(
              `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team.sportsDbName)}`
            );
            const data = await res.json();
            const badge = data?.teams?.[0]?.strBadge;
            return { id: team.id, url: badge || null };
          } catch {
            return { id: team.id, url: null };
          }
        })
      );
      return results
        .filter((r) => r.status === "fulfilled" && r.value.url)
        .map((r) => r.value);
    }

    async function fetchAll() {
      const batchSize = 5;
      const newLogos = { ...logos };
      for (let i = 0; i < teamsToFetch.length; i += batchSize) {
        const batch = teamsToFetch.slice(i, i + batchSize);
        const results = await fetchBatch(batch);
        for (const r of results) {
          newLogos[r.id] = r.url + "/tiny";
        }
        setLogos({ ...newLogos });
        // Save progress
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(newLogos));
        } catch {}
        // Rate limit
        if (i + batchSize < teamsToFetch.length) {
          await new Promise((r) => setTimeout(r, 10000));
        }
      }
    }

    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return logos;
}
