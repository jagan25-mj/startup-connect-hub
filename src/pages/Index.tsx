import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Rocket, Users, Briefcase, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold text-foreground">
              Startup Platform
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight">
              Connect, Build, and{' '}
              <span className="text-primary">Launch Together</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              The platform where startup founders meet talented co-founders and skilled professionals. 
              Build your dream team and bring your vision to life.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gap-2 text-base">
                  Start as Founder
                  <Briefcase className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="gap-2 text-base">
                  Join as Talent
                  <Users className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Everything you need to build
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're a founder looking for talent or a professional seeking opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Rocket,
                title: 'Startup Profiles',
                description: 'Showcase your startup with detailed profiles including industry, stage, and team needs.',
              },
              {
                icon: Users,
                title: 'Talent Network',
                description: 'Connect with skilled professionals ready to join exciting startup ventures.',
              },
              {
                icon: Briefcase,
                title: 'Role-Based Access',
                description: 'Customized experience for founders and talent with relevant features for each.',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-background border border-border shadow-card hover:shadow-elevated transition-all animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Built for the startup ecosystem
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A professional platform designed specifically for founders and talent in the startup world.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Create and manage startup profiles',
                  'Build your professional talent profile',
                  'Dashboard with key metrics',
                  'Real-time platform health monitoring',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-block mt-8">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-accent to-muted rounded-2xl p-8 shadow-card">
              <div className="space-y-4">
                <div className="bg-card rounded-lg p-4 shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full gradient-primary" />
                    <div>
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded mt-2" />
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-soft">
                  <div className="h-4 w-32 bg-primary/20 rounded mb-2" />
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-3/4 bg-muted rounded mt-2" />
                </div>
                <div className="bg-card rounded-lg p-4 shadow-soft">
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-accent rounded-full" />
                    <div className="h-6 w-20 bg-accent rounded-full" />
                    <div className="h-6 w-14 bg-accent rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-hero">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Ready to join the ecosystem?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Start building your startup journey today. It's free to get started.
          </p>
          <Link to="/auth" className="inline-block mt-8">
            <Button size="lg" variant="hero" className="gap-2 text-base">
              Create Your Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded gradient-primary">
              <Rocket className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-medium text-foreground">
              Startup Platform
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Startup Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
