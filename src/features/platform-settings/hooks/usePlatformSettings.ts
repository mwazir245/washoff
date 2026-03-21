import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWashoffPlatformService, type UpdatePlatformSettingsCommand } from "@/features/orders/application";
import { platformQueryKeys } from "@/features/orders/data/queryKeys";

const invalidatePlatformSettingsQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminPlatformSettings }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminPlatformSettingsAudit }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminPlatformRuntime }),
  ]);
};

export const usePlatformSettings = () => {
  return useQuery({
    queryKey: platformQueryKeys.adminPlatformSettings,
    queryFn: () => getWashoffPlatformService().getPlatformSettings(),
  });
};

export const usePlatformSettingsAudit = () => {
  return useQuery({
    queryKey: platformQueryKeys.adminPlatformSettingsAudit,
    queryFn: () => getWashoffPlatformService().listPlatformSettingsAudit(),
  });
};

export const usePlatformRuntimeStatus = () => {
  return useQuery({
    queryKey: platformQueryKeys.adminPlatformRuntime,
    queryFn: () => getWashoffPlatformService().getPlatformRuntimeStatus(),
  });
};

export const useUpdatePlatformSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: UpdatePlatformSettingsCommand) =>
      getWashoffPlatformService().updatePlatformSettings(command),
    onSuccess: async () => invalidatePlatformSettingsQueries(queryClient),
  });
};
