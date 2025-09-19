import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./apiClient";

const queryKeys = {
  dashboard: ["dashboard", "summary"],
  accounts: ["accounts"],
  policies: ["policies"],
  evaluations: ["evaluations"],
  notifications: ["notifications"],
};

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiClient.get("dashboard/summary"),
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => apiClient.get("accounts"),
  });
}

export function useCreateAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post("accounts", payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}

export function useSyncAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (accountId) => apiClient.post(`accounts/${accountId}/sync`),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}

export function useDeleteAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (accountId) => apiClient.delete(`accounts/${accountId}`),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}

export function usePolicies() {
  return useQuery({
    queryKey: queryKeys.policies,
    queryFn: () => apiClient.get("policies"),
  });
}

export function useCreatePolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post("policies", payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.policies });
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
    },
  });
}

export function useUpdatePolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.put(`policies/${id}`, payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.policies });
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
    },
  });
}

export function useDeletePolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (policyId) => apiClient.delete(`policies/${policyId}`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.policies });
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
    },
  });
}

export function useEvaluations() {
  return useQuery({
    queryKey: queryKeys.evaluations,
    queryFn: () => apiClient.get("policies/evaluations"),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload) => apiClient.post("auth/login", payload),
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: (payload) => apiClient.post("auth/register", payload),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => apiClient.get("notifications"),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useCreateNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post("notifications", payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
    onError: (error) => {
      console.error('Failed to create notification', error);
    },
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) => apiClient.patch(`notifications/${notificationId}/read`),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch("notifications/mark-all-read"),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
