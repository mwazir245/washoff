import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWashoffPlatformService, type CreateHotelOrderCommand } from "@/features/orders/application";
import { platformQueryKeys } from "@/features/orders/data/queryKeys";

export const useHotelDashboard = () => {
  return useQuery({
    queryKey: platformQueryKeys.hotelDashboard,
    queryFn: () => getWashoffPlatformService().getHotelDashboardData(),
  });
};

export const useCreateHotelOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHotelOrderCommand) => getWashoffPlatformService().createHotelOrder(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminDashboard }),
      ]);
    },
  });
};

export const useConfirmHotelOrderCompletionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      getWashoffPlatformService().confirmHotelOrderCompletion({
        orderId,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminDashboard }),
      ]);
    },
  });
};
