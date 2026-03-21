import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";

export const PlatformLanguageToggle = () => {
  const { language, setLanguage } = usePlatformLanguage();

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-primary/10 bg-background/85 p-1 shadow-sm">
      <Button
        type="button"
        variant={language === "ar" ? "default" : "ghost"}
        size="sm"
        className="h-9 rounded-xl px-3"
        onClick={() => setLanguage("ar")}
      >
        <Languages className="h-4 w-4" />
        عربي
      </Button>
      <Button
        type="button"
        variant={language === "en" ? "default" : "ghost"}
        size="sm"
        className="h-9 rounded-xl px-3"
        onClick={() => setLanguage("en")}
      >
        EN
      </Button>
    </div>
  );
};
