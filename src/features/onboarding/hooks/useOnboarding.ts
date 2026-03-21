import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWashoffPlatformService,
  type ApproveHotelRegistrationCommand,
  type ApproveProviderRegistrationCommand,
  type ReactivateAccountCommand,
  type RegisterHotelCommand,
  type RegisterProviderCommand,
  type RejectHotelRegistrationCommand,
  type RejectProviderRegistrationCommand,
  type ResendActivationCommand,
  type SuspendAccountCommand,
} from "@/features/orders/application";
import { platformQueryKeys } from "@/features/orders/data/queryKeys";

export const useRegistrationServiceCatalog = () => {
  return useQuery({
    queryKey: platformQueryKeys.registrationServiceCatalog,
    queryFn: () => getWashoffPlatformService().getServiceCatalog(),
  });
};

export const useHotelRegistrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterHotelCommand) => getWashoffPlatformService().registerHotel(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminOnboarding }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminDashboard }),
      ]);
    },
  });
};

export const useProviderRegistrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterProviderCommand) => getWashoffPlatformService().registerProvider(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminOnboarding }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminDashboard }),
      ]);
    },
  });
};

export const useAdminOnboarding = () => {
  return useQuery({
    queryKey: platformQueryKeys.adminOnboarding,
    queryFn: () => getWashoffPlatformService().getAdminOnboardingData(),
  });
};

export const useAdminIdentityData = () => {
  return useQuery({
    queryKey: platformQueryKeys.adminAccounts,
    queryFn: () => getWashoffPlatformService().getIdentityAdminData(),
  });
};

const invalidateOnboardingQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminOnboarding }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminDashboard }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminAccounts }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.identityAudit }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelDashboard }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerDashboard }),
  ]);
};

export const useApproveHotelRegistrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: ApproveHotelRegistrationCommand) =>
      getWashoffPlatformService().approveHotelRegistration(command),
    onSuccess: async () => invalidateOnboardingQueries(queryClient),
  });
};

export const useRejectHotelRegistrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: RejectHotelRegistrationCommand) =>
      getWashoffPlatformService().rejectHotelRegistration(command),
    onSuccess: async () => invalidateOnboardingQueries(queryClient),
  });
};

export const useApproveProviderRegistrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: ApproveProviderRegistrationCommand) =>
      getWashoffPlatformService().approveProviderRegistration(command),
    onSuccess: async () => invalidateOnboardingQueries(queryClient),
  });
};

export const useRejectProviderRegistrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: RejectProviderRegistrationCommand) =>
      getWashoffPlatformService().rejectProviderRegistration(command),
    onSuccess: async () => invalidateOnboardingQueries(queryClient),
  });
};

export const useSuspendAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: SuspendAccountCommand) => getWashoffPlatformService().suspendAccount(command),
    onSuccess: async () => invalidateOnboardingQueries(queryClient),
  });
};

export const useReactivateAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: ReactivateAccountCommand) =>
      getWashoffPlatformService().reactivateAccount(command),
    onSuccess: async () => invalidateOnboardingQueries(queryClient),
  });
};

export const useResendActivationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: ResendActivationCommand) =>
      getWashoffPlatformService().resendActivationEmail(command),
    onSuccess: async () => invalidateOnboardingQueries(queryClient),
  });
};
