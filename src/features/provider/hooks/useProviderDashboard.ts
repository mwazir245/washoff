import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWashoffPlatformService } from "@/features/orders/application";
import type { ProviderExecutionStatus } from "@/features/orders/application/contracts/platform-contracts";
import { platformQueryKeys } from "@/features/orders/data/queryKeys";

export const useProviderDashboard = () => {
  return useQuery({
    queryKey: platformQueryKeys.providerDashboard,
    queryFn: () => getWashoffPlatformService().getProviderDashboardData(),
  });
};

export const useAcceptIncomingOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => getWashoffPlatformService().acceptIncomingOrder(orderId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminDashboard }),
      ]);
    },
  });
};

export const useRejectIncomingOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      getWashoffPlatformService().rejectAssignment({
        orderId,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminDashboard }),
      ]);
    },
  });
};

export const useAdvanceProviderOrderExecutionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, nextStatus }: { orderId: string; nextStatus: ProviderExecutionStatus }) =>
      getWashoffPlatformService().advanceProviderOrderExecution({
        orderId,
        nextStatus,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminDashboard }),
      ]);
    },
  });
};
