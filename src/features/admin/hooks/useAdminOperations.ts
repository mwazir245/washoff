import { useQuery } from "@tanstack/react-query";
import {
  getWashoffPlatformService,
  type MatchingTransparencyOrder,
} from "@/features/orders/application";
import type { LaundryOrder } from "@/features/orders/model/order";
import { platformQueryKeys } from "@/features/orders/data/queryKeys";

export type { MatchingTransparencyOrder, LaundryOrder };

export const useAdminOrders = () => {
  return useQuery<LaundryOrder[]>({
    queryKey: platformQueryKeys.adminOrders,
    queryFn: () => getWashoffPlatformService().listAdminOrders(),
  });
};

export const useAdminMatching = () => {
  return useQuery<MatchingTransparencyOrder[]>({
    queryKey: platformQueryKeys.adminMatching,
    queryFn: async () => (await getWashoffPlatformService().fetchMatchingTransparencyForAdmin()).orders,
  });
};
