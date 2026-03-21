export type WashoffUiLanguage = "ar" | "en";

export const resolveWashoffBrandName = (language: WashoffUiLanguage) =>
  language === "ar" ? "واش أوف" : "WashOff";

export const localizeWashoffBrandText = (value: string, language: WashoffUiLanguage) => {
  if (!value) {
    return "";
  }

  if (language === "ar") {
    return value.replace(/\bWashOff\b/gi, "واش أوف");
  }

  return value.replace(/واش أوف/g, "WashOff");
};
