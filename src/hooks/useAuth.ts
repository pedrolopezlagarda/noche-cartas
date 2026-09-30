import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";
import { DEMO_USER } from "@/lib/demoData";

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === "true";

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
    enabled: !IS_DEMO,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate(redirectPath);
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const effectiveUser = IS_DEMO ? DEMO_USER : user;
  const effectiveLoading = IS_DEMO ? false : isLoading;

  useEffect(() => {
    if (redirectOnUnauthenticated && !effectiveLoading && !effectiveUser) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, effectiveLoading, effectiveUser, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: effectiveUser ?? null,
      isAuthenticated: !!effectiveUser,
      isLoading: effectiveLoading || logoutMutation.isPending,
      error: IS_DEMO ? null : error,
      logout,
      refresh: refetch,
    }),
    [effectiveUser, effectiveLoading, logoutMutation.isPending, error, logout, refetch],
  );
}
