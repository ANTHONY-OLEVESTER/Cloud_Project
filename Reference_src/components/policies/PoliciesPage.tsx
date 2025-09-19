import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  Settings,
  Cloud
} from 'lucide-react';
import { api } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface Policy {
  id: string;
  name: string;
  category: string;
  provider: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Compliant' | 'Non-Compliant' | 'Not Applicable';
  resources: number;
  violations: number;
  lastChecked: string;
  description: string;
}

export function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (error: any) {
      console.error('Error fetching policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || policy.category === categoryFilter;
    const matchesProvider = providerFilter === 'all' || policy.provider === providerFilter;
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesProvider && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Compliant':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Non-Compliant':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Compliant':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Compliant</Badge>;
      case 'Non-Compliant':
        return <Badge className="bg-red-50 text-red-700 border-red-200">Non-Compliant</Badge>;
      default:
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Not Applicable</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'High':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      default:
        return <Badge className="bg-green-50 text-green-700 border-green-200">Low</Badge>;
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'AWS':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">AWS</Badge>;
      case 'Azure':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Azure</Badge>;
      case 'GCP':
        return <Badge className="bg-green-50 text-green-700 border-green-200">GCP</Badge>;
      default:
        return <Badge variant="secondary">{provider}</Badge>;
    }
  };

  const categories = ['all', 'Data Protection', 'Identity & Access', 'Network Security', 'Logging & Monitoring'];
  const providers = ['all', 'AWS', 'Azure', 'GCP'];
  const statuses = ['all', 'Compliant', 'Non-Compliant', 'Not Applicable'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Security Policies</h1>
          <p className="text-slate-600 mt-1">
            Monitor and manage security policies across your cloud infrastructure
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Create Policy
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
            <p className="text-xs text-slate-600 mt-1">
              Across all providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {policies.filter(p => p.status === 'Compliant').length}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {Math.round((policies.filter(p => p.status === 'Compliant').length / policies.length) * 100)}% compliance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {policies.filter(p => p.status === 'Non-Compliant').length}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {policies.reduce((sum, p) => sum + p.violations, 0)} total violations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources Monitored</CardTitle>
            <Cloud className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.reduce((sum, p) => sum + p.resources, 0)}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Across all policies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map(provider => (
                  <SelectItem key={provider} value={provider}>
                    {provider === 'all' ? 'All Providers' : provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Details</CardTitle>
          <CardDescription>
            Detailed view of all security policies and their compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Violations</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{policy.name}</div>
                      <div className="text-sm text-slate-600 mt-1">{policy.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{policy.category}</TableCell>
                  <TableCell>{getProviderBadge(policy.provider)}</TableCell>
                  <TableCell>{getSeverityBadge(policy.severity)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(policy.status)}
                      {getStatusBadge(policy.status)}
                    </div>
                  </TableCell>
                  <TableCell>{policy.resources}</TableCell>
                  <TableCell>
                    <span className={policy.violations > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {policy.violations}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{policy.lastChecked}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}