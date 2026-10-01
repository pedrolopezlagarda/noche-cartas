import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Si no hay sesión, crear usuario demo automáticamente
  const autoLogin = trpc.devAuth.autoLogin.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  useEffect(() => {
    if (!isLoading && !user && !error && !autoLogin.isPending) {
      autoLogin.mutate();
    }
  }, [isLoading, user, error, autoLogin]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate(redirectPath);
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user && !autoLogin.isPending) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, autoLogin.isPending, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending || autoLogin.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, logoutMutation.isPending, autoLogin.isPending, error, logout, refetch],
  );
}
