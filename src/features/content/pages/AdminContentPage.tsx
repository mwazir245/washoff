import { useMemo, useState } from "react";
import { FilePenLine, Filter, Languages, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminWorkspaceLayout from "@/features/admin/components/AdminWorkspaceLayout";
import { AdminContentEditorDialog } from "@/features/content/components/AdminContentEditorDialog";
import {
  useAdminPlatformContentAudit,
  useAdminPlatformContentEntries,
  usePlatformPageContent,
  useUpdatePlatformContentEntryMutation,
} from "@/features/content/hooks/usePlatformContent";
import {
  listManagedPlatformContentPages,
  platformManagedPageLabels,
  type PlatformContentEntry,
} from "@/features/content/model/platform-content";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import PreviewModeNotice from "@/shared/components/feedback/PreviewModeNotice";
import EmptyState from "@/shared/components/feedback/EmptyState";
import SectionHeader from "@/shared/components/layout/SectionHeader";
import { toast } from "@/hooks/use-toast";

const formatDateTime = (value?: string, language: "ar" | "en" = "ar") => {
  if (!value) {
    return language === "en" ? "Not available" : "غير متاح";
  }

  return new Date(value).toLocaleString(language === "en" ? "en-US" : "ar-SA");
};

const AdminContentPage = () => {
  const { language } = usePlatformLanguage();
  const pageContent = usePlatformPageContent("admin_content");
  const entriesQuery = useAdminPlatformContentEntries();
  const auditQuery = useAdminPlatformContentAudit();
  const updateContentMutation = useUpdatePlatformContentEntryMutation();
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEntry, setEditingEntry] = useState<PlatformContentEntry | null>(null);

  const title = pageContent.getText("page", "title", "إدارة النصوص");
  const subtitle = pageContent.getText(
    "page",
    "subtitle",
    "حدّث النصوص العربية والإنجليزية للصفحات المدعومة، مع بقاء النصوص الافتراضية كمسار احتياطي آمن.",
  );

  const availablePages = useMemo(() => listManagedPlatformContentPages(), []);

  const filteredEntries = useMemo(() => {
    const entries = entriesQuery.data ?? [];
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesPage = pageFilter === "all" ? true : entry.pageKey === pageFilter;
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [entry.compositeKey, entry.labelAr, entry.labelEn, entry.valueAr, entry.valueEn]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);

      return matchesPage && matchesSearch;
    });
  }, [entriesQuery.data, pageFilter, searchQuery]);

  const filteredAudit = useMemo(() => {
    const entries = auditQuery.data ?? [];
    return pageFilter === "all" ? entries : entries.filter((entry) => entry.pageKey === pageFilter);
  }, [auditQuery.data, pageFilter]);

  const handleSave = async (payload: {
    id: string;
    valueAr: string;
    valueEn: string;
    active: boolean;
    notesAr?: string;
  }) => {
    try {
      await updateContentMutation.mutateAsync(payload);
      setEditingEntry(null);
      toast({
        title: language === "en" ? "Content updated" : "تم تحديث النص",
        description:
          language === "en"
            ? "The managed content entry was saved successfully."
            : "تم حفظ النص المُدار بنجاح، وسيظهر مباشرة مع fallback آمن عند الحاجة.",
      });
    } catch (error) {
      toast({
        title: language === "en" ? "Unable to save content" : "تعذر حفظ النص",
        description:
          error instanceof Error
            ? error.message
            : language === "en"
              ? "An unexpected error occurred."
              : "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    }
  };

  if (entriesQuery.isError) {
    return (
      <AdminWorkspaceLayout title={title} subtitle={subtitle} eyebrow={language === "en" ? "Content management" : "إدارة النصوص"}>
        <EmptyState
          title={language === "en" ? "Unable to load managed content" : "تعذر تحميل النصوص المُدارة"}
          description={
            entriesQuery.error instanceof Error
              ? entriesQuery.error.message
              : language === "en"
                ? "The content catalog could not be loaded."
                : "تعذر تحميل كتالوج النصوص الحالي."
          }
          action={<Button onClick={() => void entriesQuery.refetch()}>{language === "en" ? "Retry" : "إعادة المحاولة"}</Button>}
        />
      </AdminWorkspaceLayout>
    );
  }

  if (entriesQuery.isLoading || !entriesQuery.data) {
    return (
      <AdminWorkspaceLayout title={title} subtitle={subtitle} eyebrow={language === "en" ? "Content management" : "إدارة النصوص"}>
        <div className="surface-card px-6 py-6 text-sm text-muted-foreground">
          {language === "en"
            ? "Preparing the managed content catalog and audit history."
            : "جارٍ تجهيز كتالوج النصوص المُدارة وسجل التعديلات."}
        </div>
      </AdminWorkspaceLayout>
    );
  }

  return (
    <AdminWorkspaceLayout
      title={title}
      subtitle={subtitle}
      eyebrow={language === "en" ? "Content management" : "إدارة النصوص"}
    >
      <PreviewModeNotice
        description={
          language === "en"
            ? "Only supported managed texts appear here. Unsupported text continues to use code defaults until it is added to the catalog."
            : "تظهر هنا النصوص المدعومة فقط. أي نص غير مُدار بعد سيستمر باستخدام القيمة الافتراضية من الكود حتى تتم إضافته لاحقًا."
        }
      />

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {language === "en" ? "Managed entries" : "العناصر المُدارة"}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{entriesQuery.data.length}</p>
        </div>
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {language === "en" ? "Supported pages" : "الصفحات المدعومة"}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{availablePages.length}</p>
        </div>
        <div className="surface-card px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {language === "en" ? "Audit entries" : "سجل التعديلات"}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{auditQuery.data?.length ?? 0}</p>
        </div>
      </section>

      <Tabs defaultValue="entries" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-2xl bg-muted/50 p-2">
          <TabsTrigger value="entries">{language === "en" ? "Content entries" : "النصوص"}</TabsTrigger>
          <TabsTrigger value="audit">{language === "en" ? "Audit trail" : "السجل"}</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-6">
          <section className="surface-card px-6 py-6 sm:px-8">
            <SectionHeader
              eyebrow={language === "en" ? "Filters" : "الفلاتر"}
              title={language === "en" ? "Find the text you want to edit" : "ابحث عن النص الذي تريد تعديله"}
              description={
                language === "en"
                  ? "Filter by page and search by key, label, or value."
                  : "يمكنك تصفية العناصر حسب الصفحة والبحث بالمفتاح أو الوصف أو القيمة."
              }
              className="mb-6"
            />

            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {language === "en" ? "Page" : "الصفحة"}
                </label>
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={pageFilter}
                    onChange={(event) => setPageFilter(event.target.value)}
                    className="field-input h-11 w-full ps-10"
                  >
                    <option value="all">{language === "en" ? "All supported pages" : "كل الصفحات المدعومة"}</option>
                    {availablePages.map((pageKey) => (
                      <option key={pageKey} value={pageKey}>
                        {language === "en"
                          ? platformManagedPageLabels[pageKey]?.en ?? pageKey
                          : platformManagedPageLabels[pageKey]?.ar ?? pageKey}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {language === "en" ? "Search" : "البحث"}
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="ps-10"
                    placeholder={
                      language === "en"
                        ? "Search by key, label, or text value"
                        : "ابحث بالمفتاح أو الوصف أو النص"
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-border/70 px-6 py-5 sm:px-8">
              <SectionHeader
                eyebrow={language === "en" ? "Managed copy" : "النصوص المدعومة"}
                title={language === "en" ? "Editable bilingual entries" : "عناصر قابلة للتعديل بالعربية والإنجليزية"}
                description={
                  language === "en"
                    ? "Each entry keeps code fallback safe. Disabling an entry returns the runtime to the default text."
                    : "كل عنصر يحتفظ بمسار fallback آمن إلى النص الافتراضي من الكود. وعند تعطيله يعود العرض إلى النص الأصلي."
                }
              />
            </div>

            {filteredEntries.length === 0 ? (
              <div className="px-6 py-8 sm:px-8">
                <EmptyState
                  title={language === "en" ? "No content entries match the current filter" : "لا توجد عناصر مطابقة للفلاتر الحالية"}
                  description={
                    language === "en"
                      ? "Try a different page filter or a broader search term."
                      : "جرّب اختيار صفحة مختلفة أو استخدام كلمة بحث أوسع."
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/35 text-right text-muted-foreground">
                      <th className="px-6 py-4 font-medium">{language === "en" ? "Page" : "الصفحة"}</th>
                      <th className="px-4 py-4 font-medium">{language === "en" ? "Key" : "المفتاح"}</th>
                      <th className="px-4 py-4 font-medium">{language === "en" ? "Arabic text" : "النص العربي"}</th>
                      <th className="px-4 py-4 font-medium">{language === "en" ? "English text" : "النص الإنجليزي"}</th>
                      <th className="px-4 py-4 font-medium">{language === "en" ? "Status" : "الحالة"}</th>
                      <th className="px-6 py-4 font-medium">{language === "en" ? "Action" : "الإجراء"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/60 last:border-b-0">
                        <td className="px-6 py-4 align-top">
                          <div className="font-semibold text-foreground">
                            {language === "en"
                              ? platformManagedPageLabels[entry.pageKey]?.en ?? entry.pageKey
                              : platformManagedPageLabels[entry.pageKey]?.ar ?? entry.pageKey}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{entry.sectionKey}</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-foreground">{entry.contentKey}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{entry.compositeKey}</div>
                        </td>
                        <td className="px-4 py-4 align-top text-muted-foreground">{entry.valueAr}</td>
                        <td className="px-4 py-4 align-top text-muted-foreground">{entry.valueEn}</td>
                        <td className="px-4 py-4 align-top">
                          <span className="inline-flex rounded-full border border-border/80 bg-white px-3 py-1 text-xs font-semibold text-foreground">
                            {entry.active
                              ? language === "en"
                                ? "Active"
                                : "مفعّل"
                              : language === "en"
                                ? "Disabled"
                                : "متوقف"}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <Button variant="outline" size="sm" onClick={() => setEditingEntry(entry)}>
                            <FilePenLine className="h-4 w-4" />
                            {language === "en" ? "Edit" : "تعديل"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="audit" className="surface-card px-6 py-6 sm:px-8">
          <SectionHeader
            eyebrow={language === "en" ? "Audit trail" : "سجل التعديلات"}
            title={language === "en" ? "Recent content updates" : "آخر تحديثات النصوص"}
            description={
              language === "en"
                ? "Track who changed what and when for supported page copy."
                : "تابع من قام بتعديل النصوص ومتى تم ذلك داخل الصفحات المدعومة."
            }
            className="mb-6"
          />

          {auditQuery.isLoading || !auditQuery.data ? (
            <div className="text-sm text-muted-foreground">
              {language === "en" ? "Loading audit records..." : "جارٍ تحميل السجل..."}
            </div>
          ) : filteredAudit.length === 0 ? (
            <EmptyState
              title={language === "en" ? "No content audit events yet" : "لا توجد أحداث في سجل النصوص بعد"}
              description={
                language === "en"
                  ? "Audit entries will appear here after the first saved content change."
                  : "سيظهر سجل النصوص هنا بعد أول تعديل محفوظ على أي عنصر."
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredAudit.slice(0, 20).map((entry) => (
                <div key={entry.id} className="rounded-[1.1rem] border border-border/70 bg-muted/20 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        {entry.pageKey}.{entry.sectionKey}.{entry.contentKey}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(entry.changedAt, language)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Languages className="h-4 w-4" />
                      <span>{entry.changedByRole ?? "admin"}</span>
                    </div>
                  </div>
                  {entry.notesAr ? (
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{entry.notesAr}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AdminContentEditorDialog
        entry={editingEntry}
        language={language}
        isSaving={updateContentMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEntry(null);
          }
        }}
        onSave={handleSave}
      />
    </AdminWorkspaceLayout>
  );
};

export default AdminContentPage;
