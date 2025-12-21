import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Rocket, Mail, Lock, User, Briefcase, Code } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(100);
const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(100);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'founder' | 'talent'>('founder');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!isLogin) {
        nameSchema.parse(fullName);
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.includes('Invalid') || error.includes('credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error);
          }
        } else {
          toast.success('Welcome back!');
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, fullName, role);
        if (error) {
          if (error.includes('already registered') || error.includes('already exists')) {
            toast.error('This email is already registered. Please sign in.');
          } else {
            toast.error(error);
          }
        } else {
          toast.success('Account created successfully!');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-soft">
            <Rocket className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">
            Startup Platform
          </span>
        </div>

        <Card className="shadow-elevated border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Sign in to access your dashboard'
                : 'Join the startup ecosystem today'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-3">
                  <Label>I am a...</Label>

                  <RadioGroup
                    value={role}
                    onValueChange={(value) => setRole(value as 'founder' | 'talent')}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="founder"
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        role === 'founder'
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="founder" id="founder" className="sr-only" />
                      <Briefcase
                        className={`h-6 w-6 ${
                          role === 'founder'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          role === 'founder'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Founder
                      </span>
                      <span className="text-xs text-muted-foreground text-center">
                        Start and grow your startup
                      </span>
                    </Label>

                    <Label
                      htmlFor="talent"
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        role === 'talent'
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="talent" id="talent" className="sr-only" />
                      <Code
                        className={`h-6 w-6 ${
                          role === 'talent'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          role === 'talent'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Talent
                      </span>
                      <span className="text-xs text-muted-foreground text-center">
                        Find exciting opportunities
                      </span>
                    </Label>
                  </RadioGroup>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
