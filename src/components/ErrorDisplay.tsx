import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ApiError } from "@/lib/apiClient";

interface ErrorDisplayProps {
  error: ApiError | Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
}

export function ErrorDisplay({ error, onRetry, showDetails = false }: ErrorDisplayProps) {
  const apiError = error as ApiError;
  
  const isNetworkError = apiError.isNetworkError || false;
  const isRenderColdStart = apiError.isRenderColdStart || false;

  return (
    <Alert variant={isNetworkError ? "default" : "destructive"}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p>{typeof error === "string" ? error : error.message}</p>
          {isRenderColdStart && (
            <p className="text-xs mt-2 opacity-75">
              The backend service is waking up. This is normal for Render free tier.
            </p>
          )}
          {showDetails && apiError.details && (
            <pre className="text-xs mt-2 opacity-75">
              {JSON.stringify(apiError.details, null, 2)}
            </pre>
          )}
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}