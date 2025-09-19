import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ArrowRight, Clock } from 'lucide-react';

const recentAlerts = [
  {
    id: 1,
    title: 'Unencrypted S3 Bucket Detected',
    provider: 'AWS',
    severity: 'Critical',
    time: '2 hours ago',
    resource: 'backup-storage-bucket'
  },
  {
    id: 2,
    title: 'Open Security Group Rule',
    provider: 'AWS',
    severity: 'High',
    time: '4 hours ago',
    resource: 'sg-web-servers'
  },
  {
    id: 3,
    title: 'MFA Not Enabled for Admin User',
    provider: 'Azure',
    severity: 'High',
    time: '6 hours ago',
    resource: 'admin@company.com'
  },
  {
    id: 4,
    title: 'Unused IAM Role Detected',
    provider: 'AWS',
    severity: 'Medium',
    time: '8 hours ago',
    resource: 'legacy-service-role'
  },
  {
    id: 5,
    title: 'Public IP on Database Instance',
    provider: 'GCP',
    severity: 'High',
    time: '1 day ago',
    resource: 'prod-database-01'
  }
];

export function RecentAlertsTable() {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'AWS':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Azure':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'GCP':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Security Alerts</CardTitle>
            <CardDescription>Latest security findings across your infrastructure</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{alert.title}</h4>
                  <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline" className={getProviderColor(alert.provider)}>
                    {alert.provider}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span>Resource: {alert.resource}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{alert.time}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}