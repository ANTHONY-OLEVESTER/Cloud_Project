import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
}

export function LoginPage({ onSwitchToSignup, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onLogin({ email, password });
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-10 w-10 text-blue-600" />
              <h1 className="text-2xl font-semibold text-slate-900">SecureCloud</h1>
            </div>
            <p className="text-slate-600">
              Cloud Security Posture Management Platform
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your security dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    Remember me
                  </label>
                  <Button variant="link" className="p-0 h-auto">
                    Forgot password?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>

                <div className="text-center">
                  <span className="text-sm text-slate-600">
                    Don't have an account?{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto" 
                      onClick={onSwitchToSignup}
                    >
                      Sign up
                    </Button>
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-xs text-slate-500">
            <p>Enterprise-grade security for your cloud infrastructure</p>
            <p className="mt-1">SOC 2 Type II Certified • GDPR Compliant</p>
          </div>
        </div>
      </div>

      {/* Right side - Hero Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center p-8">
        <div className="text-center text-white">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1667372283496-893f0b1e7c16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbnwxfHx8fDE3NTczNTIxOTR8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Cloud Security"
            className="w-96 h-64 object-cover rounded-lg mb-8 opacity-90"
          />
          <h2 className="text-3xl font-semibold mb-4">
            Unified Cloud Security
          </h2>
          <p className="text-lg opacity-90 max-w-md">
            Monitor and manage security policies across AWS, Azure, and GCP from a single dashboard
          </p>
        </div>
      </div>
    </div>
  );
}