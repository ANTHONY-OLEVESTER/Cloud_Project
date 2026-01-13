export function buildComplianceReport({ summary, evaluations = [] }) {
  const totalPolicies = summary?.summary?.total_policies ?? 0;
  const compliantPolicies = summary?.summary?.compliant ?? 0;
  const nonCompliantPolicies = summary?.summary?.non_compliant ?? 0;
  const pendingPolicies = summary?.summary?.unknown ?? 0;

  const recentEvaluations = [...evaluations]
    .sort((a, b) => new Date(b.last_checked_at) - new Date(a.last_checked_at))
    .slice(0, 8);

  return {
    reportType: "Security Compliance Report",
    generatedAt: new Date().toISOString(),
    summary: {
      totalPolicies,
      compliantPolicies,
      nonCompliantPolicies,
      pendingPolicies,
      complianceRate: totalPolicies
        ? Math.round((compliantPolicies / totalPolicies) * 100)
        : 0,
    },
    recentFindings: recentEvaluations.map((evaluation) => ({
      policyName: evaluation.policy?.name ?? "Unnamed policy",
      account: evaluation.account?.display_name ?? evaluation.account?.provider,
      status: evaluation.status,
      findings: evaluation.findings ?? "No findings provided",
      lastChecked: evaluation.last_checked_at,
    })),
    recommendations: [
      "Review and remediate non-compliant policies",
      "Schedule regular compliance checks",
      "Update security policies based on findings",
    ],
  };
}

export function generateCSVReport(data) {
  const headers = ["Policy Name", "Account", "Status", "Findings", "Last Checked"];
  const rows = data.recentFindings.map((f) => [
    f.policyName,
    f.account,
    f.status,
    `"${String(f.findings).replace(/"/g, '""')}"`,
    f.lastChecked,
  ]);

  const csvRows = [
    ["Security Compliance Report"],
    [`Generated: ${new Date(data.generatedAt).toLocaleString()}`],
    [""],
    ["Summary:"],
    [`Total Policies: ${data.summary.totalPolicies}`],
    [`Compliant: ${data.summary.compliantPolicies}`],
    [`Non-Compliant: ${data.summary.nonCompliantPolicies}`],
    [`Pending: ${data.summary.pendingPolicies}`],
    [`Compliance Rate: ${data.summary.complianceRate}%`],
    [""],
    ["Recent Findings:"],
    headers,
    ...rows,
  ];

  return csvRows
    .map((row) => (Array.isArray(row) ? row.join(",") : row))
    .join("\n");
}

export function downloadComplianceReport({ summary, evaluations }) {
  const reportData = buildComplianceReport({ summary, evaluations });
  const csvContent = generateCSVReport(reportData);
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `security-compliance-report-${new Date()
    .toISOString()
    .split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
