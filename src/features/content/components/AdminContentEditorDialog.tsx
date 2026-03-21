import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { PlatformContentEntry } from "@/features/content/model/platform-content";

interface AdminContentEditorDialogProps {
  entry: PlatformContentEntry | null;
  language: "ar" | "en";
  isSaving: boolean;
  onSave: (payload: {
    id: string;
    valueAr: string;
    valueEn: string;
    active: boolean;
    notesAr?: string;
  }) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export const AdminContentEditorDialog = ({
  entry,
  language,
  isSaving,
  onSave,
  onOpenChange,
}: AdminContentEditorDialogProps) => {
  const [valueAr, setValueAr] = useState("");
  const [valueEn, setValueEn] = useState("");
  const [notesAr, setNotesAr] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!entry) {
      return;
    }

    setValueAr(entry.valueAr);
    setValueEn(entry.valueEn);
    setNotesAr("");
    setActive(entry.active);
  }, [entry]);

  return (
    <Dialog open={Boolean(entry)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{language === "en" ? "Edit managed content" : "تعديل النص المُدار"}</DialogTitle>
          <DialogDescription>{entry?.compositeKey}</DialogDescription>
        </DialogHeader>

        {entry ? (
          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === "en" ? "Arabic value" : "القيمة العربية"}</Label>
                <Textarea value={valueAr} onChange={(event) => setValueAr(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "en" ? "English value" : "القيمة الإنجليزية"}</Label>
                <Textarea value={valueEn} onChange={(event) => setValueEn(event.target.value)} />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === "en" ? "Content type" : "نوع النص"}</Label>
                <Input value={entry.contentType} disabled />
              </div>
              <div className="flex items-center justify-between rounded-[1.1rem] border border-border/70 px-4 py-4">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    {language === "en" ? "Entry status" : "حالة العنصر"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {active
                      ? language === "en"
                        ? "Visible to runtime"
                        : "مفعّل للاستخدام"
                      : language === "en"
                        ? "Disabled, fallback remains active"
                        : "متوقف ويعود النظام إلى النص الافتراضي"}
                  </p>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === "en" ? "Audit note (Arabic)" : "ملاحظة للسجل"}</Label>
              <Textarea
                value={notesAr}
                onChange={(event) => setNotesAr(event.target.value)}
                placeholder={
                  language === "en"
                    ? "Optional note for the audit trail."
                    : "ملاحظة اختيارية لسجل التعديلات."
                }
              />
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {language === "en" ? "Cancel" : "إلغاء"}
          </Button>
          <Button
            type="button"
            disabled={!entry || isSaving}
            onClick={() =>
              entry
                ? void onSave({
                    id: entry.id,
                    valueAr,
                    valueEn,
                    active,
                    notesAr: notesAr.trim() || undefined,
                  })
                : undefined
            }
          >
            {isSaving
              ? language === "en"
                ? "Saving..."
                : "جارٍ الحفظ..."
              : language === "en"
                ? "Save changes"
                : "حفظ التعديل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
