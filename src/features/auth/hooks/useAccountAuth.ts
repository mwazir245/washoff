import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountRole } from "@/features/auth/model";
import { getWashoffPlatformService } from "@/features/orders/application";
import { platformQueryKeys } from "@/features/orders/data/queryKeys";
import { appRoutes } from "@/shared/config/navigation";

const invalidateOperationalQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.authSession }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.hotelDashboard }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.providerDashboard }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminDashboard }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminOnboarding }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.adminAccounts }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.identityAudit }),
  ]);
};

export const resolveAccountHomeRoute = (role: AccountRole) => {
  switch (role) {
    case AccountRole.Admin:
      return appRoutes.adminDashboard;
    case AccountRole.Provider:
      return appRoutes.providerDashboard;
    case AccountRole.Hotel:
    default:
      return appRoutes.hotelDashboard;
  }
};

export const useCurrentAccountSession = () => {
  return useQuery({
    queryKey: platformQueryKeys.authSession,
    queryFn: () => getWashoffPlatformService().getCurrentAccountSession(),
    staleTime: 60_000,
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; password: string }) => getWashoffPlatformService().login(input),
    onSuccess: async () => invalidateOperationalQueries(queryClient),
  });
};

export const useActivateAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { token: string; password: string; fullName?: string; phone?: string }) =>
      getWashoffPlatformService().activateAccount(input),
    onSuccess: async () => invalidateOperationalQueries(queryClient),
  });
};

export const useActivationTokenStatus = (token: string) => {
  return useQuery({
    queryKey: platformQueryKeys.activationTokenStatus(token),
    queryFn: () => getWashoffPlatformService().validateActivationToken({ token }),
    enabled: Boolean(token.trim()),
    retry: false,
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: (input: { email: string }) => getWashoffPlatformService().requestPasswordReset(input),
  });
};

export const useResetPasswordTokenStatus = (token: string) => {
  return useQuery({
    queryKey: platformQueryKeys.resetPasswordTokenStatus(token),
    queryFn: () => getWashoffPlatformService().validateResetPasswordToken({ token }),
    enabled: Boolean(token.trim()),
    retry: false,
  });
};

export const useResetPasswordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      getWashoffPlatformService().resetPassword(input),
    onSuccess: async () => invalidateOperationalQueries(queryClient),
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => getWashoffPlatformService().logout(),
    onSuccess: async () => {
      queryClient.setQueryData(platformQueryKeys.authSession, null);
      await invalidateOperationalQueries(queryClient);
    },
  });
};
