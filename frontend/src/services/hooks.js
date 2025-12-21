import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./apiClient";

const queryKeys = {
  dashboard: ["dashboard", "summary"],
  accounts: ["accounts"],
  policies: ["policies"],
  evaluations: ["evaluations"],
  notifications: ["notifications"],
};

// ===========================
// Dashboard
// ===========================
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiClient.get("dashboard/summary"),  
  });
}

// ===========================
// Accounts
// ===========================
export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => apiClient.get("accounts/"),  // Add trailing slash
  });
}

export function useCreateAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post("accounts/", payload),  // Add trailing slash
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.accounts });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useSyncAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (accountId) => apiClient.post(`accounts/${accountId}/sync`), 
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.accounts });
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteAccount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (accountId) => apiClient.delete(`accounts/${accountId}/`),  // Add trailing slash
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.accounts });
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ===========================
// Policies
// ===========================
export function usePolicies() {
  return useQuery({
    queryKey: queryKeys.policies,
    queryFn: () => apiClient.get("policies/"),  // Add trailing slash ⭐
  });
}

export function useCreatePolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post("policies/", payload),  // Add trailing slash
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.policies });
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdatePolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.put(`policies/${id}/`, payload),  // Add trailing slash
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.policies });
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeletePolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (policyId) => apiClient.delete(`policies/${policyId}/`),  // Add trailing slash
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.policies });
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ===========================
// Evaluations
// ===========================
export function useEvaluations() {
  return useQuery({
    queryKey: queryKeys.evaluations,
    queryFn: () => apiClient.get("policies/evaluations"),  // Add trailing slash
  });
}

export function useCreateEvaluation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post("policies/evaluations/", payload),  // Add trailing slash
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateEvaluation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.patch(`policies/evaluations/${id}/`, payload),  // Add trailing slash
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteEvaluation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (evaluationId) => apiClient.delete(`policies/evaluations/${evaluationId}/`),  // Add trailing slash
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.evaluations });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ===========================
// Auth
// ===========================
export function useLogin() {
  return useMutation({
    mutationFn: (payload) => apiClient.post("auth/login/", payload),  // Add trailing slash
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: (payload) => apiClient.post("auth/register/", payload),  // Add trailing slash
  });
}

// ===========================
// Notifications
// ===========================
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => apiClient.get("notifications/"),  // Add trailing slash
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useCreateNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post("notifications/", payload),  // Add trailing slash
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) => apiClient.patch(`notifications/${notificationId}/read/`),  // Add trailing slash
    onMutate: async (notificationId) => {
      await client.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = client.getQueryData(queryKeys.notifications);
      client.setQueryData(queryKeys.notifications, (data = []) =>
        data.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item
        )
      );
      return { previous };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previous) {
        client.setQueryData(queryKeys.notifications, context.previous);
      }
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch("notifications/mark-all-read/"),  // Add trailing slash
    onMutate: async () => {
      await client.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = client.getQueryData(queryKeys.notifications);
      client.setQueryData(queryKeys.notifications, (data = []) =>
        data.map((item) => ({ ...item, is_read: true }))
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        client.setQueryData(queryKeys.notifications, context.previous);
      }
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}