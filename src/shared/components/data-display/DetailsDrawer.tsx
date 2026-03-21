import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";

interface DetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

const DetailsDrawer = ({ open, onOpenChange, title, description, children }: DetailsDrawerProps) => {
  const { language } = usePlatformLanguage();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={language === "en" ? "right" : "left"}
        className="w-full overflow-y-auto border-border/70 bg-background/95 sm:max-w-3xl"
      >
        <SheetHeader className="text-start">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>

        <div className="mt-6 space-y-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
};

export default DetailsDrawer;
