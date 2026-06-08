import { supabase } from "../lib/supabaseClient";

export type FontSize = "pequeño" | "mediano" | "grande";

const DEFAULT_FONT_SIZE: FontSize = "mediano";
const DEFAULT_HIGH_CONTRAST = false;

const isValidFontSize = (value: unknown): value is FontSize => {
  return value === "pequeño" || value === "mediano" || value === "grande";
};

export const applyPreferences = (
  fontSize: FontSize = DEFAULT_FONT_SIZE,
  highContrast: boolean = DEFAULT_HIGH_CONTRAST
) => {
  document.documentElement.dataset.fontSize = fontSize;
  document.documentElement.dataset.highContrast = String(highContrast);
};

export const applyDefaultPreferences = () => {
  applyPreferences(DEFAULT_FONT_SIZE, DEFAULT_HIGH_CONTRAST);
};

export const loadAndApplyUserPreferences = async (userId: number) => {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("font_size, high_contrast")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("No se pudieron cargar las preferencias:", error);
    applyDefaultPreferences();
    return;
  }

  const fontSize = isValidFontSize(data?.font_size)
    ? data.font_size
    : DEFAULT_FONT_SIZE;

  const highContrast = data?.high_contrast ?? DEFAULT_HIGH_CONTRAST;

  applyPreferences(fontSize, highContrast);
};