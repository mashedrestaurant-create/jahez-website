"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products as defaultProducts, type Product } from "./data";
import { defaultSettings, type SiteSettings } from "./settings";

export type CategoryMedia = Record<string, { slug: string; image?: string; videoUrl?: string }>;

type CatalogContextValue = {
  products: Product[];
  settings: SiteSettings;
  categoryMedia: CategoryMedia;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(defaultProducts);
  const [settings, setSettings] = useState(defaultSettings);
  const [categoryMedia, setCategoryMedia] = useState<CategoryMedia>({});

  useEffect(() => {
    let active = true;
    fetch("/api/catalog")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!active || !payload) return;
        if (payload.settings) {
          setSettings((current) => ({ ...current, ...payload.settings }));
        }
        if (Array.isArray(payload.products)) {
          setProducts(payload.products);
        }
        if (payload.categoryMedia) {
          setCategoryMedia(payload.categoryMedia);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--teal", settings.primaryColor);
    document.documentElement.style.setProperty("--orange", settings.accentColor);
    document.documentElement.style.setProperty("--cream", settings.creamColor);
  }, [settings]);

  const value = useMemo(
    () => ({ products, settings, categoryMedia }),
    [products, settings, categoryMedia],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) {
    throw new Error("useCatalog must be used inside CatalogProvider");
  }
  return value;
}
