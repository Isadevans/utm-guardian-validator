
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Clock, DollarSign } from "lucide-react";
import {ValidationSummaryProps} from "@/types/AdsConfigItem.ts";
import {AdsConfigItem} from "@/types/AdsConfigItem.ts";

export const ValidationSummary = ({ data }: ValidationSummaryProps) => {
  const total_ads_checked =
      (data.facebook?.length || 0) +
      (data.google?.length || 0) +
      (data.tiktok?.length || 0) +
      (data.pinterest?.length || 0);

  // Helper to count errors in a platform's ad list
  const countErrors = (ads: AdsConfigItem[] = []) => {
    return ads.filter(ad => !ad.isTrackParamsValid || (ad.messages && ad.messages.length > 0)).length;
  };

  const facebook_errors = countErrors(data.facebook);
  const google_errors = countErrors(data.google);
  const tiktok_errors = countErrors(data.tiktok);
  const pinterest_errors = countErrors(data.pinterest);

  const totalErrors = facebook_errors + google_errors + tiktok_errors + pinterest_errors;
  const validAds = total_ads_checked - totalErrors;
  const is_valid = totalErrors === 0;

  const validation_timestamp = new Date().toISOString();
  const validationDate = new Date(validation_timestamp).toLocaleString();

  const sumSpend = (ads: AdsConfigItem[] = []) => {
    return ads.reduce((total, ad) => total + (ad.spend || 0), 0);
  };

  const totalSpend = sumSpend(data.facebook) + sumSpend(data.google) + sumSpend(data.tiktok) + sumSpend(data.pinterest);

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

        {/* Total Spend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all {total_ads_checked} ads
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
      </div>
  );
};