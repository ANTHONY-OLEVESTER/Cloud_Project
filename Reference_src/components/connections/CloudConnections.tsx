import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Cloud, 
  Plus, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  RefreshCw,
  Key,
  Database,
  Shield,
  Eye
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api } from '../../utils/supabase/client';

interface CloudProvider {
  id: string;
  name: string;
  type: 'aws' | 'azure' | 'gcp';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync: string;
  accountId: string;
  region: string;
  policies: number;
  resources: number;
}

interface CloudConnectionsProps {
  onViewServices?: (providerId: string) => void;
}

export function CloudConnections({ onViewServices }: CloudConnectionsProps = {}) {
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('aws');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    accessKey: '',
    secretKey: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    projectId: '',
    credentials: ''
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const data = await api.getProviders();
      setProviders(data);
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to load cloud providers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <XCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  const handleSync = async (providerId: string) => {
    try {
      await api.syncProvider(providerId);
      toast.success('Sync initiated successfully');
      
      // Update last sync time in UI
      setProviders(prev => prev.map(p => 
        p.id === providerId 
          ? { ...p, lastSync: 'Just now' }
          : p
      ));
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Failed to sync provider');
    }
  };

  const handleDelete = async (providerId: string) => {
    try {
      await api.removeProvider(providerId);
      setProviders(prev => prev.filter(p => p.id !== providerId));
      toast.success('Cloud provider removed successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to remove provider');
    }
  };

  const handleAddProvider = async () => {
    try {
      const providerData = {
        name: formData.name,
        type: selectedProvider,
        region: formData.region,
        accountId: selectedProvider === 'aws' ? formData.accessKey.split('').slice(0, 12).join('') + '...' : 
                  selectedProvider === 'azure' ? formData.tenantId : 
                  formData.projectId
      };

      const result = await api.addProvider(providerData);
      setProviders(prev => [...prev, result.provider]);
      toast.success('Cloud provider connection initiated');
      setShowAddForm(false);
      
      // Reset form
      setFormData({
        name: '',
        region: '',
        accessKey: '',
        secretKey: '',
        tenantId: '',
        clientId: '',
        clientSecret: '',
        projectId: '',
        credentials: ''
      });
    } catch (error: any) {
      console.error('Add provider error:', error);
      toast.error('Failed to add provider');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cloud Connections</h1>
          <p className="text-slate-600 mt-1">
            Manage your cloud provider integrations and monitor connection status
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Providers</CardTitle>
            <Cloud className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-slate-600 mt-1">
              1 provider has connection issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">77</div>
            <p className="text-xs text-slate-600 mt-1">
              Across all connected providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources Monitored</CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,139</div>
            <p className="text-xs text-slate-600 mt-1">
              Last updated 5 minutes ago
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Providers List */}
      <div className="space-y-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Cloud className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{provider.name}</h3>
                      {getStatusBadge(provider.status)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                      <span>Account: {provider.accountId}</span>
                      <span>Region: {provider.region}</span>
                      <span>Last sync: {provider.lastSync}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{provider.policies}</div>
                    <div className="text-xs text-slate-600">Policies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{provider.resources}</div>
                    <div className="text-xs text-slate-600">Resources</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onViewServices && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewServices(provider.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Services
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSync(provider.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(provider.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Provider Modal/Card */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Cloud Provider</CardTitle>
            <CardDescription>
              Connect a new cloud provider to monitor security policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedProvider} onValueChange={setSelectedProvider}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="aws">AWS</TabsTrigger>
                <TabsTrigger value="azure">Azure</TabsTrigger>
                <TabsTrigger value="gcp">Google Cloud</TabsTrigger>
              </TabsList>
              
              <TabsContent value="aws" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aws-name">Connection Name</Label>
                    <Input 
                      id="aws-name" 
                      placeholder="Production AWS" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aws-region">Default Region</Label>
                    <Input 
                      id="aws-region" 
                      placeholder="us-east-1" 
                      value={formData.region}
                      onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aws-access-key">Access Key ID</Label>
                  <Input 
                    id="aws-access-key" 
                    placeholder="AKIA..." 
                    value={formData.accessKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, accessKey: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aws-secret-key">Secret Access Key</Label>
                  <Input 
                    id="aws-secret-key" 
                    type="password" 
                    placeholder="Enter secret key" 
                    value={formData.secretKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, secretKey: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  <Key className="h-4 w-4" />
                  <span>We recommend using IAM roles with minimal required permissions for security scanning.</span>
                </div>
              </TabsContent>

              <TabsContent value="azure" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="azure-name">Connection Name</Label>
                    <Input id="azure-name" placeholder="Production Azure" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="azure-region">Default Region</Label>
                    <Input id="azure-region" placeholder="East US" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="azure-tenant">Tenant ID</Label>
                  <Input id="azure-tenant" placeholder="tenant-id-here" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="azure-client">Client ID</Label>
                  <Input id="azure-client" placeholder="client-id-here" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="azure-secret">Client Secret</Label>
                  <Input id="azure-secret" type="password" placeholder="Enter client secret" />
                </div>
              </TabsContent>

              <TabsContent value="gcp" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gcp-name">Connection Name</Label>
                    <Input id="gcp-name" placeholder="Production GCP" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gcp-region">Default Region</Label>
                    <Input id="gcp-region" placeholder="us-central1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gcp-project">Project ID</Label>
                  <Input id="gcp-project" placeholder="my-project-12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gcp-credentials">Service Account Key (JSON)</Label>
                  <textarea 
                    id="gcp-credentials"
                    className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste your service account JSON key here..."
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-3 mt-6">
              <Button onClick={handleAddProvider}>
                Connect Provider
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}