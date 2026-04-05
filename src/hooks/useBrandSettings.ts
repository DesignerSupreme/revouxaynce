import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BrandSettings } from "@/types";

const DEFAULT: BrandSettings = {
  id: "",
  accent_color: "#000000",
  footer_text: "Thank you for your business.",
  terms_and_conditions: "Payment is due upon receipt unless otherwise specified.",
};

export function useBrandSettings() {
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const fetchBrand = useCallback(async () => {
    const { data } = await supabase
      .from("brand_settings")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      setBrand({
        id: data.id,
        accent_color: data.accent_color || DEFAULT.accent_color,
        footer_text: data.footer_text || DEFAULT.footer_text,
        terms_and_conditions: data.terms_and_conditions || DEFAULT.terms_and_conditions,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  const updateBrand = async (updates: Partial<Omit<BrandSettings, "id">>) => {
    if (!brand.id) return;
    await supabase.from("brand_settings").update(updates).eq("id", brand.id);
    await fetchBrand();
  };

  return { brand, loading, updateBrand };
}
