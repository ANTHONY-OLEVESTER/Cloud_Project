import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { 
  ArrowLeft,
  Cloud,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  Server,
  Lock,
  Users,
  Network,
  Settings,
  RefreshCw,
  Eye,
  Activity
} from 'lucide-react';
import { api } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface ServiceDetailsPageProps {
  providerId: string | null;
  onBack: () => void;
}

interface CloudService {
  id: string;
  name: string;
  type: string;
  status: 'healthy' | 'warning' | 'critical';
  region: string;
  policies: number;
  violations: number;
  resources: number;
  lastScanned: string;
  complianceScore: number;
  criticalIssues: number;
  description: string;
}

interface ServiceViolation {
  id: string;
  policyName: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  resourceType: string;
  resourceName: string;
  description: string;
  remediation: string;
  detectedAt: string;
}

export function ServiceDetailsPage({ providerId, onBack }: ServiceDetailsPageProps) {
  const [provider, setProvider] = useState<any>(null);
  const [services, setServices] = useState<CloudService[]>([]);
  const [violations, setViolations] = useState<ServiceViolation[]>([]);
  const [selectedService, setSelectedService] = useState<CloudService | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (providerId) {
      fetchServiceDetails();
    }
  }, [providerId]);

  const fetchServiceDetails = async () => {
    try {
      const [providerData, servicesData, violationsData] = await Promise.all([
        api.getProvider(providerId!),
        api.getProviderServices(providerId!),
        api.getServiceViolations(providerId!)
      ]);
      
      setProvider(providerData);
      setServices(servicesData);
      setViolations(violationsData);
      if (servicesData.length > 0) {
        setSelectedService(servicesData[0]);
      }
    } catch (error: any) {
      console.error('Error fetching service details:', error);
      toast.error('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const handleScanServices = async () => {
    setScanning(true);
    try {
      await api.scanProviderServices(providerId!);
      toast.success('Service scan initiated successfully');
      setTimeout(() => {
        fetchServiceDetails();
        setScanning(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error scanning services:', error);
      toast.error('Failed to scan services');
      setScanning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-6">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Connections
        </Button>
        <div className="text-center py-12">
          <p className="text-slate-600">Provider not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Cloud className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{provider.name}</h1>
              <p className="text-slate-600">{provider.type.toUpperCase()} • {provider.region}</p>
            </div>
          </div>
        </div>
        <Button onClick={handleScanServices} disabled={scanning}>
          <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan Services'}
        </Button>
      </div>

      {/* Service Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Services</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{services.length}</div>
            <p className="text-xs text-slate-600 mt-1">Across all regions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Average Compliance</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">
              {Math.round(services.reduce((acc, s) => acc + s.complianceScore, 0) / services.length || 0)}%
            </div>
            <Progress 
              value={services.reduce((acc, s) => acc + s.complianceScore, 0) / services.length || 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">
              {violations.length}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {violations.filter(v => v.severity === 'Critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Resources Monitored</CardTitle>
            <Server className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {services.reduce((acc, s) => acc + s.resources, 0)}
            </div>
            <p className="text-xs text-slate-600 mt-1">Total resources</p>
          </CardContent>
        </Card>
      </div>

      {/* Services List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Services
            </CardTitle>
            <CardDescription>
              Click on a service to view details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.map((service) => (
              <div
                key={service.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedService?.id === service.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedService(service)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-xs text-slate-600">{service.type}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-600">
                  <span>{service.resources} resources</span>
                  <span>{service.complianceScore}% compliant</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Service Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedService ? (
            <>
              {/* Service Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(selectedService.status)}
                      <div>
                        <CardTitle>{selectedService.name}</CardTitle>
                        <CardDescription>{selectedService.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(selectedService.status)}>
                      {selectedService.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Region</p>
                      <p className="font-medium">{selectedService.region}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Resources</p>
                      <p className="font-medium">{selectedService.resources}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Policies</p>
                      <p className="font-medium">{selectedService.policies}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Last Scanned</p>
                      <p className="font-medium">{selectedService.lastScanned}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-slate-600">Compliance Score</p>
                      <p className="font-medium">{selectedService.complianceScore}%</p>
                    </div>
                    <Progress value={selectedService.complianceScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Service Violations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Active Violations
                  </CardTitle>
                  <CardDescription>
                    Security issues requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {violations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Policy</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Resource</TableHead>
                          <TableHead>Detected</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {violations.slice(0, 5).map((violation) => (
                          <TableRow key={violation.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{violation.policyName}</p>
                                <p className="text-xs text-slate-600">{violation.resourceType}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getSeverityColor(violation.severity)}>
                                {violation.severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{violation.resourceName}</TableCell>
                            <TableCell className="text-sm">{violation.detectedAt}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <p className="font-medium">No active violations</p>
                      <p className="text-sm text-slate-600">This service is fully compliant</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Database className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="font-medium">Select a service</p>
                <p className="text-sm text-slate-600">Choose a service from the list to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}