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
    queryFn: async () => {
      // Mock dashboard data
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        connectedProviders: 3,
        totalPolicies: 47,
        resourcesMonitored: 2840,
        complianceRate: 86,
        compliantPolicies: 41,
        nonCompliantPolicies: 6,
        pendingPolicies: 0
      };
    },
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      // Mock accounts data
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: "1",
          provider: "aws",
          name: "Production AWS",
          status: "connected",
          lastSync: "2024-01-15T10:30:00Z",
          accountId: "123456789012",
          region: "us-east-1",
          resourceCount: 1250,
          policies: 2,
          resources: 1250
        },
        {
          id: "2", 
          provider: "azure",
          name: "Azure Development",
          status: "connected",
          lastSync: "2024-01-15T09:45:00Z",
          accountId: "azure-sub-123",
          region: "eastus",
          resourceCount: 892,
          policies: 1,
          resources: 892
        },
        {
          id: "3",
          provider: "gcp", 
          name: "GCP Analytics",
          status: "pending",
          lastSync: "2024-01-14T16:20:00Z",
          accountId: "gcp-project-456",
          region: "us-central1",
          resourceCount: 698,
          policies: 0,
          resources: 0
        }
      ];
    },
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
    queryFn: async () => {
      // Mock policies data
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: "1",
          name: "S3 Bucket Public Access",
          description: "Ensure S3 buckets are not publicly accessible",
          category: "Storage",
          provider: "aws",
          severity: "high",
          status: "enabled",
          lastEvaluated: "2024-01-15T10:30:00Z",
          resourceCount: 45
        },
        {
          id: "2",
          name: "IAM Password Policy",
          description: "Enforce strong password policies for IAM users",
          category: "Identity",
          provider: "aws",
          severity: "medium",
          status: "enabled",
          lastEvaluated: "2024-01-15T09:45:00Z",
          resourceCount: 23
        },
        {
          id: "3",
          name: "Network Security Groups",
          description: "Review open network security group rules",
          category: "Network",
          provider: "azure",
          severity: "high",
          status: "enabled",
          lastEvaluated: "2024-01-15T08:20:00Z",
          resourceCount: 67
        }
      ];
    },
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
    queryFn: async () => {
      // Mock evaluations data
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: "1",
          policyId: "1",
          resourceId: "bucket-prod-data",
          status: "non-compliant",
          finding: "Bucket allows public read access",
          severity: "high",
          evaluatedAt: "2024-01-15T10:30:00Z"
        },
        {
          id: "2", 
          policyId: "2",
          resourceId: "user-john-doe",
          status: "compliant",
          finding: "Password policy requirements met",
          severity: "medium",
          evaluatedAt: "2024-01-15T09:45:00Z"
        },
        {
          id: "3",
          policyId: "3", 
          resourceId: "nsg-web-tier",
          status: "non-compliant",
          finding: "Port 22 open to 0.0.0.0/0",
          severity: "high",
          evaluatedAt: "2024-01-15T08:20:00Z"
        }
      ];
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload) => {
      // Mock successful login for demo purposes
      await new Promise(resolve => setTimeout(resolve, 500));
      return { token: "demo-token", user: { email: payload.email } };
    },
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
    queryFn: async () => {
      // Mock notifications data
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: "1",
          title: "New AWS account connected",
          message: "Production AWS account has been successfully connected and is being scanned.",
          type: "success",
          read: false,
          createdAt: "2024-01-15T10:30:00Z"
        },
        {
          id: "2",
          title: "Policy violation detected",
          message: "S3 bucket 'bucket-prod-data' has public read access enabled.",
          type: "warning",
          read: false,
          createdAt: "2024-01-15T09:45:00Z"
        },
        {
          id: "3",
          title: "Compliance scan completed", 
          message: "Weekly compliance scan finished. 6 new issues found.",
          type: "info",
          read: true,
          createdAt: "2024-01-14T16:20:00Z"
        }
      ];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
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
