import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWashoffPlatformService,
  type AdminFinanceData,
  type AdminFinancePageData,
  type ApproveProviderServicePricingCommand,
  type ListAdminOrdersPageCommand,
  type ListAdminOrdersPageResult,
  type PlatformServiceCatalogAdminData,
  type ProviderPricingAdminData,
  type ProviderProfile,
  type ProviderSettlementStatement,
  type RejectProviderServicePricingCommand,
  type MatchingTransparencyOrder,
  type HotelInvoice,
  type UpdatePlatformServiceMatrixCommand,
  type UpsertPlatformProductCommand,
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

export const useAdminOrdersPage = (command: ListAdminOrdersPageCommand) => {
  return useQuery<ListAdminOrdersPageResult>({
    queryKey: platformQueryKeys.adminOrdersPage(command),
    queryFn: () => getWashoffPlatformService().listAdminOrdersPage(command),
  });
};

export const useAdminProviders = () => {
  return useQuery<ProviderProfile[]>({
    queryKey: ["admin", "providers"],
    queryFn: () => getWashoffPlatformService().listProviders(),
  });
};

export const useAdminMatching = () => {
  return useQuery<MatchingTransparencyOrder[]>({
    queryKey: platformQueryKeys.adminMatching,
    queryFn: async () => (await getWashoffPlatformService().fetchMatchingTransparencyForAdmin()).orders,
  });
};

export const useAdminFinance = () => {
  return useQuery<AdminFinanceData>({
    queryKey: platformQueryKeys.adminFinance,
    queryFn: () => getWashoffPlatformService().getAdminFinanceData(),
  });
};

export const useAdminFinancePage = (command: {
  invoicePage: number;
  invoicePageSize: number;
  invoiceSearch?: string;
  invoiceStatus?: string;
  invoiceDate?: string;
  statementPage: number;
  statementPageSize: number;
  statementSearch?: string;
  statementStatus?: string;
  statementDate?: string;
}) => {
  return useQuery<AdminFinancePageData>({
    queryKey: platformQueryKeys.adminFinancePage(command),
    queryFn: () => getWashoffPlatformService().getAdminFinancePage(command),
  });
};

export const useAdminServiceCatalog = () => {
  return useQuery<PlatformServiceCatalogAdminData>({
    queryKey: platformQueryKeys.adminServices,
    queryFn: () => getWashoffPlatformService().getPlatformServiceCatalogAdminData(),
  });
};

export const useAdminProviderPricing = () => {
  return useQuery<ProviderPricingAdminData>({
    queryKey: platformQueryKeys.adminProviderPricing,
    queryFn: () => getWashoffPlatformService().getProviderPricingAdminData(),
  });
};

export const useUpsertPlatformProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: UpsertPlatformProductCommand) =>
      getWashoffPlatformService().upsertPlatformProduct(command),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminServices }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerServiceManagement }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminProviderPricing }),
      ]);
    },
  });
};

export const useUpdatePlatformServiceMatrixMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: UpdatePlatformServiceMatrixCommand) =>
      getWashoffPlatformService().updatePlatformServiceMatrix(command),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminServices }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerServiceManagement }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminProviderPricing }),
      ]);
    },
  });
};

export const useApproveProviderServicePricingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: ApproveProviderServicePricingCommand) =>
      getWashoffPlatformService().approveProviderServicePricing(command),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminProviderPricing }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerServiceManagement }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminServices }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerDashboard }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelDashboard }),
      ]);
    },
  });
};

export const useRejectProviderServicePricingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: RejectProviderServicePricingCommand) =>
      getWashoffPlatformService().rejectProviderServicePricing(command),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminProviderPricing }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerServiceManagement }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminServices }),
      ]);
    },
  });
};

export const useMarkHotelInvoiceCollectedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) =>
      getWashoffPlatformService().markHotelInvoiceCollected({ invoiceId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminFinance }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelBilling }),
      ]);
    },
  });
};

export const useMarkProviderStatementPaidMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (statementId: string) =>
      getWashoffPlatformService().markProviderStatementPaid({ statementId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminFinance }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerFinance }),
      ]);
    },
  });
};
