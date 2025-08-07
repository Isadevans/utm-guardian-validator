import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

export interface AdsConfigItem {
  campaignName: string;
  campaignId: string;
  mediumName: string;
  mediumId: string;
  adName: string;
  adId: string;
  link: string;
  trackParams: string;
  isLinkWithoutUtms: boolean;
  isTrackParamsValid: boolean;
  messages: string[];
  preview_link: string;
  hasTrackingOnCampaignOrAdGroup?: boolean;
}

interface ValidationSummaryProps {
  data: {
    facebook: AdsConfigItem[];
    google: AdsConfigItem[];
    tiktok: AdsConfigItem[];
    pinterest: AdsConfigItem[];
  };
}

export const ValidationSummary = ({ data }: ValidationSummaryProps) => {
  // Calculate total_ads_checked by summing all platform ad arrays
  const total_ads_checked =
      data.facebook.length +
      data.google.length +
      data.tiktok.length +
      data.pinterest.length

  // Calculate errors per platform based on isTrackParamsValid being false
// Calculate errors per platform based on messages array only
  const facebook_errors = data.facebook.filter(ad => ad.messages && ad.messages.length > 0);
  const google_errors = data.google.filter(ad => ad.messages && ad.messages.length > 0);
  const tiktok_errors = data.tiktok.filter(ad => ad.messages && ad.messages.length > 0);
  const pinterest_errors = data.pinterest.filter(ad => ad.messages && ad.messages.length > 0);
  // Calculate total errors
  const totalErrors = facebook_errors.length + google_errors.length + tiktok_errors.length + pinterest_errors.length;

  // Determine if validation is valid (no errors)
  const is_valid = totalErrors === 0;

  // Use current time for validation timestamp
  const validation_timestamp = new Date().toISOString();
  const validationDate = new Date(validation_timestamp).toLocaleString();

  const validAds = total_ads_checked - totalErrors;

  const platformStats = [
    { name: "Facebook", errors: facebook_errors.length, color: "bg-blue-500" },
    { name: "Google", errors: google_errors.length, color: "bg-red-500" },
    { name: "TikTok", errors: tiktok_errors.length, color: "bg-gray-900" },
    { name: "Pinterest", errors: pinterest_errors.length, color: "bg-red-600" },
  ];

  return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {/* Overall Status */}
        <Card className={`${is_valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
            {is_valid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
                <XCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {is_valid ? (
                  <span className="text-green-600">Valid</span>
              ) : (
                  <span className="text-red-600">Issues Found</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {is_valid ? "All UTMs configured correctly" : `${totalErrors} configuration issues`}
            </p>
          </CardContent>
        </Card>

        {/* Total Ads Checked */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ads Checked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total_ads_checked}</div>
            <p className="text-xs text-muted-foreground">
              {validAds} valid, {totalErrors} with issues
            </p>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {total_ads_checked > 0 ? ((totalErrors / total_ads_checked) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {totalErrors} of {total_ads_checked} ads
            </p>
          </CardContent>
        </Card>

        {/* Last Validation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Validation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{validationDate.split(',')[1]?.trim() || validationDate}</div>
            <p className="text-xs text-muted-foreground">
              {validationDate.split(',')[0]}
            </p>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {platformStats.map((platform) => (
                  <Badge
                      key={platform.name}
                      variant={platform.errors > 0 ? "destructive" : "secondary"}
                      className="flex items-center gap-1"
                  >
                    <div className={`w-2 h-2 rounded-full ${platform.color}`} />
                    {platform.name}: {platform.errors} errors
                  </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  );
};