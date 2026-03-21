import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWashoffPlatformService,
  type UpdatePlatformContentEntryCommand,
} from "@/features/orders/application";
import { platformQueryKeys } from "@/features/orders/data/queryKeys";
import {
  getDefaultPlatformPageContentValues,
  type PlatformLanguage,
} from "@/features/content/model/platform-content";
import { usePlatformLanguage } from "@/features/content/hooks/usePlatformLanguage";
import { localizeWashoffBrandText } from "@/shared/lib/brand";

const invalidatePlatformContentQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminPlatformContent }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminPlatformContentAudit }),
  ]);
};

export const useAdminPlatformContentEntries = () => {
  return useQuery({
    queryKey: platformQueryKeys.adminPlatformContent,
    queryFn: () => getWashoffPlatformService().listPlatformContentEntries(),
  });
};

export const useAdminPlatformContentAudit = () => {
  return useQuery({
    queryKey: platformQueryKeys.adminPlatformContentAudit,
    queryFn: () => getWashoffPlatformService().listPlatformContentAudit(),
  });
};

export const useUpdatePlatformContentEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: UpdatePlatformContentEntryCommand) =>
      getWashoffPlatformService().updatePlatformContentEntry(command),
    onSuccess: async (_result, command) => {
      await Promise.all([
        invalidatePlatformContentQueries(queryClient),
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.platformPageContent(command.id.split(".")[0], "ar"),
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.platformPageContent(command.id.split(".")[0], "en"),
          exact: false,
        }),
      ]);
    },
  });
};

export const usePlatformPageContent = (pageKey: string) => {
  const { language } = usePlatformLanguage();
  const fallbackValues = getDefaultPlatformPageContentValues(pageKey, language);

  const query = useQuery({
    queryKey: platformQueryKeys.platformPageContent(pageKey, language),
    queryFn: () => getWashoffPlatformService().getPlatformPageContent({ pageKey, language }),
    staleTime: 60_000,
  });

  const localizedValues = Object.fromEntries(
    Object.entries(query.data?.values ?? fallbackValues).map(([compositeKey, value]) => [
      compositeKey,
      localizeWashoffBrandText(value, language),
    ]),
  );

  return {
    ...query,
    language,
    values: localizedValues,
    getText: (sectionKey: string, contentKey: string, explicitFallback?: string) => {
      const compositeKey = `${pageKey}.${sectionKey}.${contentKey}`;
      return localizeWashoffBrandText(
        query.data?.values[compositeKey] ?? fallbackValues[compositeKey] ?? explicitFallback ?? "",
        language,
      );
    },
  };
};

export const resolveLanguageDirection = (language: PlatformLanguage) =>
  language === "en" ? "ltr" : "rtl";
