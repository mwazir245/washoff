import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWashoffPlatformService } from "@/features/orders/application";
import type {
  ProviderExecutionStatus,
  SubmitProviderServicePricingCommand,
} from "@/features/orders/application/contracts/platform-contracts";
import { platformQueryKeys } from "@/features/orders/data/queryKeys";

export const useProviderDashboard = () => {
  return useQuery({
    queryKey: platformQueryKeys.providerDashboard,
    queryFn: () => getWashoffPlatformService().getProviderDashboardData(),
  });
};

export const useProviderFinance = () => {
  return useQuery({
    queryKey: platformQueryKeys.providerFinance,
    queryFn: () => getWashoffPlatformService().getProviderFinanceData(),
  });
};

export const useProviderServiceManagement = () => {
  return useQuery({
    queryKey: platformQueryKeys.providerServiceManagement,
    queryFn: () => getWashoffPlatformService().getProviderServiceManagement(),
  });
};

export const useAcceptIncomingOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => getWashoffPlatformService().acceptIncomingOrder(orderId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerFinance }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelBilling }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminFinance }),
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

export const useSubmitProviderServicePricingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: SubmitProviderServicePricingCommand) =>
      getWashoffPlatformService().submitProviderServicePricing(command),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerServiceManagement }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminProviderPricing }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminServices }),
      ]);
    },
  });
};
