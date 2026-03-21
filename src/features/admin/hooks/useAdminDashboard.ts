import { useQuery } from "@tanstack/react-query";
import {
  getWashoffPlatformService,
  type AdminDashboardData,
  type MatchingTransparencyEntry,
  type MatchingTransparencyOrder,
  type ReassignmentActivityItem,
} from "@/features/orders/application";
import { platformQueryKeys } from "@/features/orders/data/queryKeys";

export type {
  AdminDashboardData,
  MatchingTransparencyEntry,
  MatchingTransparencyOrder,
  ReassignmentActivityItem,
};

export const useAdminDashboard = () => {
  return useQuery<AdminDashboardData>({
    queryKey: platformQueryKeys.adminDashboard,
    queryFn: () => getWashoffPlatformService().getAdminDashboardData(),
  });
};
