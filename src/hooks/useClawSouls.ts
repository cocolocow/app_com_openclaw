import { useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useNodStore } from "../store/nodStore";

const CLAWSOULS_API = "https://clawsouls.ai/api/v1";
const PROXY_PREFIX = "/clawsouls-api";

async function apiGet<T>(path: string): Promise<T> {
  // In Capacitor native, fetch goes direct (no CORS in WebView).
  // In browser dev, use Vite proxy.
  const base = Capacitor.isNativePlatform() ? CLAWSOULS_API : PROXY_PREFIX;
  const r = await fetch(`${base}${path}`);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json() as Promise<T>;
}

async function httpPost(
  baseUrl: string,
  path: string,
  body: Record<string, unknown>,
) {
  const url = `${baseUrl}${path}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, data: (await r.json()) as Record<string, unknown> };
}

export interface SoulListItem {
  owner: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: string;
  downloads: number;
  tags: string[];
  scanScore: number | null;
  scanStatus: string | null;
  avgRating: number | null;
  reviewCount: number;
}

export interface SoulBundle {
  manifest: {
    name: string;
    displayName: string;
    version: string;
    description: string;
    category: string;
    tags: string[];
  };
  files: Record<string, string>;
  owner: string;
  name: string;
  version: string;
}

export interface SoulCategory {
  name: string;
  count: number;
}

interface SoulsResponse {
  souls: SoulListItem[];
}

interface CategoriesResponse {
  categories: SoulCategory[];
}

export function useClawSouls() {
  const { config, setActiveSoul } = useNodStore();
  const [loading, setLoading] = useState(false);

  const fetchSouls = useCallback(
    async (opts?: { q?: string; category?: string; page?: number }) => {
      const params = new URLSearchParams();
      if (opts?.q) params.set("q", opts.q);
      if (opts?.category) params.set("category", opts.category);
      params.set("page", String(opts?.page ?? 1));
      params.set("limit", "20");
      const qs = params.toString();
      const res = await apiGet<SoulsResponse>(`/souls?${qs}`);
      return res.souls;
    },
    [],
  );

  const fetchBundle = useCallback(
    async (owner: string, name: string) => {
      return apiGet<SoulBundle>(`/bundle/${owner}/${name}`);
    },
    [],
  );

  const fetchCategories = useCallback(async () => {
    const res = await apiGet<CategoriesResponse>("/categories");
    return res.categories;
  }, []);

  const installSoul = useCallback(
    async (owner: string, name: string) => {
      if (!config) return { success: false, error: "Not connected" };
      setLoading(true);
      try {
        const bundle = await fetchBundle(owner, name);
        const result = await httpPost(config.baseUrl, "/soul", {
          token: config.token,
          soul: {
            owner: bundle.owner,
            name: bundle.name,
            displayName: bundle.manifest.displayName,
            description: bundle.manifest.description,
            version: bundle.version,
            files: bundle.files,
          },
        });
        if (result.ok && result.data.success) {
          setActiveSoul({
            owner: bundle.owner,
            name: bundle.name,
            displayName: bundle.manifest.displayName,
            description: bundle.manifest.description,
            version: bundle.version,
          });
          return { success: true };
        }
        return { success: false, error: "Install failed" };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      } finally {
        setLoading(false);
      }
    },
    [config, fetchBundle, setActiveSoul],
  );

  const removeSoul = useCallback(async () => {
    if (!config) return;
    await httpPost(config.baseUrl, "/soul/remove", { token: config.token });
    setActiveSoul(null);
  }, [config, setActiveSoul]);

  return { fetchSouls, fetchBundle, fetchCategories, installSoul, removeSoul, loading };
}
