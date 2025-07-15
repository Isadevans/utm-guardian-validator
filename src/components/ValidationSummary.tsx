
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

interface ValidationSummaryProps {
  data: {
    is_valid: boolean;
    total_ads_checked: number;
    validation_timestamp: string;
    results: {
      facebook_errors: any[];
      google_errors: any[];
      tiktok_errors: any[];
      pinterest_errors: any[];
    };
  };
}

export const ValidationSummary = ({ data }: ValidationSummaryProps) => {
  const totalErrors = Object.values(data.results).reduce((sum, errors) => sum + errors.length, 0);
  const validAds = data.total_ads_checked - totalErrors;
  const validationDate = new Date(data.validation_timestamp).toLocaleString();

  const platformStats = [
    { name: "Facebook", errors: data.results.facebook_errors.length, color: "bg-blue-500" },
    { name: "Google", errors: data.results.google_errors.length, color: "bg-red-500" },
    { name: "TikTok", errors: data.results.tiktok_errors.length, color: "bg-gray-900" },
    { name: "Pinterest", errors: data.results.pinterest_errors.length, color: "bg-red-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
      {/* Overall Status */}
      <Card className={`${data.is_valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
          {data.is_valid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.is_valid ? (
              <span className="text-green-600">Valid</span>
            ) : (
              <span className="text-red-600">Issues Found</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.is_valid ? "All UTMs configured correctly" : `${totalErrors} configuration issues`}
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
          <div className="text-2xl font-bold">{data.total_ads_checked}</div>
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
            {data.total_ads_checked > 0 ? ((totalErrors / data.total_ads_checked) * 100).toFixed(1) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            {totalErrors} of {data.total_ads_checked} ads
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
