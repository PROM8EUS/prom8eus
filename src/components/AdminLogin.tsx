import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
  lang: 'de' | 'en';
}

export default function AdminLogin({ onLogin, lang }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check password (in production, this would be a secure server-side check)
      const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
      
      if (password === correctPassword) {
        // Store login state in sessionStorage
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_login_time', Date.now().toString());
        onLogin(true);
      } else {
        setError(lang === 'de' ? 'Falsches Passwort' : 'Incorrect password');
        onLogin(false);
      }
    } catch (error) {
      setError(lang === 'de' ? 'Ein Fehler ist aufgetreten' : 'An error occurred');
      onLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary/10 rounded-full">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {lang === 'de' ? 'Admin Login' : 'Admin Login'}
          </CardTitle>
          <CardDescription className="text-center">
            {lang === 'de' 
              ? 'Geben Sie das Admin-Passwort ein, um fortzufahren'
              : 'Enter the admin password to continue'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {lang === 'de' ? 'Passwort' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={lang === 'de' ? 'Admin-Passwort eingeben' : 'Enter admin password'}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {lang === 'de' ? 'Anmelden...' : 'Signing in...'}
                </div>
              ) : (
                lang === 'de' ? 'Anmelden' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {lang === 'de' 
              ? 'Zugriff nur für autorisierte Administratoren'
              : 'Access restricted to authorized administrators only'
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
