import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, XCircle, ExternalLink, Info, AlertTriangle } from "lucide-react";
import { AdsConfigItem, AdsConfigsResult } from "@/pages/Index"; // Import the types from Index.tsx

enum ValidationErrors {
  MISSING_UTM_FIELD = 'MISSING_UTM_FIELD',
  INCORRECT_UTM_FORMAT = 'INCORRECT_UTM_FORMAT',
  CAMPAIGN_WITH_TRACKING_PARAMS = 'CAMPAIGN_WITH_TRACKING_PARAMS',
  ADGROUP_WITH_TRACKING_PARAMS = 'ADGROUP_WITH_TRACKING_PARAMS',
  UTM_IN_LINK_URL = 'UTM_IN_LINK_URL'
}

interface AdValidationError {
  id: string;
  name: string;
  error_type: ValidationErrors;
  details: string;
  platform: string;
  campaign_name?: string;
  adset_name?: string;
  found_utms?: string;
  expected_utms?: string;
}

interface ValidationResultsProps {
  data: AdsConfigsResult;
  showErrorsOnly?: boolean;
  groupByPlatform?: boolean;
}

const getErrorTypeInfo = (errorType: ValidationErrors) => {
  switch (errorType) {
    case ValidationErrors.MISSING_UTM_FIELD:
      return {
        title: 'Missing UTM Field',
        description: 'The url_tags field is absent or empty',
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'bg-yellow-100 border-yellow-300 text-yellow-800'
      };
    case ValidationErrors.INCORRECT_UTM_FORMAT:
      return {
        title: 'Incorrect UTM Format',
        description: 'UTM parameters do not match required pattern',
        icon: <XCircle className="h-4 w-4" />,
        color: 'bg-red-100 border-red-300 text-red-800'
      };
    case ValidationErrors.UTM_IN_LINK_URL:
      return {
        title: 'UTM in Link URL',
        description: 'UTM parameters found in destination URL (should be in url_tags)',
        icon: <ExternalLink className="h-4 w-4" />,
        color: 'bg-orange-100 border-orange-300 text-orange-800'
      };
    case ValidationErrors.CAMPAIGN_WITH_TRACKING_PARAMS:
      return {
        title: 'Campaign Level UTMs',
        description: 'Tracking parameters found at campaign level (should be at ad level)',
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'bg-purple-100 border-purple-300 text-purple-800'
      };
    case ValidationErrors.ADGROUP_WITH_TRACKING_PARAMS:
      return {
        title: 'Ad Group Level UTMs',
        description: 'Tracking parameters found at ad group level (should be at ad level)',
        icon: <Info className="h-4 w-4" />,
        color: 'bg-blue-100 border-blue-300 text-blue-800'
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
              { error.details}
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

const extractErrorsFromItems = (items: AdsConfigItem[], platform: string): AdValidationError[] => {
  const errors: AdValidationError[] = [];

  items
      .filter(item => !item.isTrackParamsValid || item.messages?.length > 0)
      .forEach(item => {
        // If there are specific messages, create an error for each message
        if (item.messages && item.messages.length > 0) {
          item.messages.forEach(errorType => {
            errors.push({
              id: item.adId,
              name: item.adName,
              error_type: errorType,
              details: item.trackParams || "Invalid UTM parameters",
              platform: platform,
              campaign_name: item.campaignName,
              adset_name: item.mediumName,
              found_utms: item.trackParams,
              expected_utms: undefined // We don't have expected UTMs in this data structure
            });
          });
        }
        // If no specific messages but isTrackParamsValid is false, create a generic error
        else if (!item.isTrackParamsValid) {
          errors.push({
            id: item.adId,
            name: item.adName,
            error_type: ValidationErrors.INCORRECT_UTM_FORMAT,
            details: item.trackParams || "Invalid UTM parameters",
            platform: platform,
            campaign_name: item.campaignName,
            adset_name: item.mediumName,
            found_utms: item.trackParams,
            expected_utms: undefined
          });
        }
      });

  return errors;
};
export const ValidationResults = ({ data, showErrorsOnly, groupByPlatform }: ValidationResultsProps) => {
  // Extract errors from platform arrays
  const facebookErrors = Array.isArray(data.facebook) ? extractErrorsFromItems(data.facebook, 'facebook') : [];
  const googleErrors = Array.isArray(data.google) ? extractErrorsFromItems(data.google, 'google') : [];
  const tiktokErrors = Array.isArray(data.tiktok) ? extractErrorsFromItems(data.tiktok, 'tiktok') : [];
  const pinterestErrors = Array.isArray(data.pinterest) ? extractErrorsFromItems(data.pinterest, 'pinterest') : [];

  const allErrors = [...facebookErrors, ...googleErrors, ...tiktokErrors, ...pinterestErrors];
  const isValid = allErrors.length === 0;

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
    // Group errors by platform
    const platforms = [
      { name: 'Facebook', errors: facebookErrors, color: 'bg-blue-500' },
      { name: 'Google', errors: googleErrors, color: 'bg-red-500' },
      { name: 'TikTok', errors: tiktokErrors, color: 'bg-gray-900' },
      { name: 'Pinterest', errors: pinterestErrors, color: 'bg-red-600' }
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
        {isValid ? (
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