import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
            <span className="text-2xl font-bold text-primary-foreground">🚀</span>
          </div>
        </div>
        <h1 className="mb-3 text-3xl font-display font-bold text-foreground">
          {title}
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          {description}
        </p>
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
