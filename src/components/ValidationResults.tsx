
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface AdValidationError {
  id: string;
  name: string;
  error_type: 'MISSING_UTM_FIELD' | 'INCORRECT_UTM_FORMAT' | 'UTM_IN_LINK_URL';
  details: string;
  platform: string;
  campaign_name?: string;
  adset_name?: string;
  found_utms?: string;
  expected_utms?: string;
}

interface ValidationResultsProps {
  data: {
    is_valid: boolean;
    results: {
      facebook_errors: AdValidationError[];
      google_errors: AdValidationError[];
      tiktok_errors: AdValidationError[];
      pinterest_errors: AdValidationError[];
    };
  };
  showErrorsOnly?: boolean;
  groupByPlatform?: boolean;
}

const getErrorTypeInfo = (errorType: string) => {
  switch (errorType) {
    case 'MISSING_UTM_FIELD':
      return {
        title: 'Missing UTM Field',
        description: 'The url_tags field is absent or empty',
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'bg-yellow-100 border-yellow-300 text-yellow-800'
      };
    case 'INCORRECT_UTM_FORMAT':
      return {
        title: 'Incorrect UTM Format',
        description: 'UTM parameters do not match required pattern',
        icon: <XCircle className="h-4 w-4" />,
        color: 'bg-red-100 border-red-300 text-red-800'
      };
    case 'UTM_IN_LINK_URL':
      return {
        title: 'UTM in Link URL',
        description: 'UTM parameters found in destination URL (should be in url_tags)',
        icon: <ExternalLink className="h-4 w-4" />,
        color: 'bg-orange-100 border-orange-300 text-orange-800'
      };
    default:
      return {
        title: 'Unknown Error',
        description: 'Unknown validation error',
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'bg-gray-100 border-gray-300 text-gray-800'
      };
  }
};

const ErrorCard = ({ error }: { error: AdValidationError }) => {
  const errorInfo = getErrorTypeInfo(error.error_type);
  
  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">{error.name}</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>ID: {error.id}</span>
              <span>•</span>
              <span>{error.platform}</span>
            </div>
          </div>
          <Badge className={errorInfo.color} variant="outline">
            {errorInfo.icon}
            <span className="ml-1">{errorInfo.title}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{errorInfo.description}</p>
        
        {error.campaign_name && (
          <div className="text-xs">
            <span className="font-medium">Campaign:</span> {error.campaign_name}
            {error.adset_name && (
              <>
                <span className="mx-2">•</span>
                <span className="font-medium">Ad Set:</span> {error.adset_name}
              </>
            )}
          </div>
        )}
        
        <Separator />
        
        <div className="space-y-2">
          <div className="text-xs">
            <span className="font-medium text-red-600">Found:</span>
            <pre className="mt-1 p-2 bg-red-50 rounded text-xs break-all whitespace-pre-wrap">
              {error.found_utms || error.details}
            </pre>
          </div>
          
          {error.expected_utms && (
            <div className="text-xs">
              <span className="font-medium text-green-600">Expected:</span>
              <pre className="mt-1 p-2 bg-green-50 rounded text-xs break-all whitespace-pre-wrap">
                {error.expected_utms}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ValidationResults = ({ data, showErrorsOnly, groupByPlatform }: ValidationResultsProps) => {
  const allErrors = [
    ...data.results.facebook_errors,
    ...data.results.google_errors,
    ...data.results.tiktok_errors,
    ...data.results.pinterest_errors
  ];

  if (showErrorsOnly && allErrors.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-medium">No Errors Found</h3>
            <p className="text-muted-foreground">All UTM configurations are valid!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groupByPlatform) {
    const platforms = [
      { name: 'Facebook', errors: data.results.facebook_errors, color: 'bg-blue-500' },
      { name: 'Google', errors: data.results.google_errors, color: 'bg-red-500' },
      { name: 'TikTok', errors: data.results.tiktok_errors, color: 'bg-gray-900' },
      { name: 'Pinterest', errors: data.results.pinterest_errors, color: 'bg-red-600' }
    ];

    return (
      <div className="space-y-6">
        {platforms.map((platform) => (
          <Card key={platform.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                {platform.name}
                <Badge variant="outline">
                  {platform.errors.length} {platform.errors.length === 1 ? 'error' : 'errors'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {platform.errors.length > 0 ? (
                <div className="space-y-4">
                  {platform.errors.map((error) => (
                    <ErrorCard key={error.id} error={error} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  No errors found for {platform.name}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.is_valid ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All UTM configurations are valid! No issues found across all platforms.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Found {allErrors.length} UTM configuration {allErrors.length === 1 ? 'issue' : 'issues'} that need attention.
          </AlertDescription>
        </Alert>
      )}

      {allErrors.length > 0 && (
        <div className="space-y-4">
          {allErrors.map((error) => (
            <ErrorCard key={`${error.platform}-${error.id}`} error={error} />
          ))}
        </div>
      )}
    </div>
  );
};
