import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Clock, DollarSign } from "lucide-react";
import {ValidationSummaryProps} from "@/types/AdsConfigItem.ts";
import {AdsConfigItem} from "@/types/AdsConfigItem.ts";

export const ValidationSummary = ({ data }: ValidationSummaryProps) => {
  // Use all ads for summary calculations, not just active ones.
  const allFacebookAds = data.facebook?.configs || [];
  const allGoogleAds = data.google?.configs || [];
  const allTiktokAds = data.tiktok?.configs || [];
  const allPinterestAds = data.pinterest?.configs || [];

  const total_ads_checked =
      allFacebookAds.length +
      allGoogleAds.length +
      allTiktokAds.length +
      allPinterestAds.length;

  // Helper to count errors in a platform's ad list
  // An error is only counted if the ad has validation issues AND is spending money.
  const countErrors = (ads: AdsConfigItem[] = []) => {
    return ads.filter(ad => {
      const hasMessages = ad.messages && ad.messages.length > 0;
      return hasMessages && ad.spend > 0 && ad.isActive;
    }).length;
  };

  const facebook_errors = countErrors(allFacebookAds);
  const google_errors = countErrors(allGoogleAds);
  const tiktok_errors = countErrors(allTiktokAds);
  const pinterest_errors = countErrors(allPinterestAds);

  const totalErrors = facebook_errors + google_errors + tiktok_errors + pinterest_errors;
  const validAds = total_ads_checked - totalErrors;
  const is_valid = totalErrors === 0;

  const validation_timestamp = new Date().toISOString();
  const validationDate = new Date(validation_timestamp).toLocaleString();

  const sumSpend = (ads: AdsConfigItem[] = []) => {
    return ads.reduce((total, ad) => total + (ad.spend || 0), 0);
  };

  const totalSpend = sumSpend(allFacebookAds) + sumSpend(allGoogleAds) + sumSpend(allTiktokAds) + sumSpend(allPinterestAds);

  return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {/* Overall Status */}
        <Card className={`${is_valid ? 'border-green-500 bg-green-500/10' : 'border-destructive bg-destructive/10'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
            {is_valid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
                <XCircle className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {is_valid ? (
                  <span className="text-green-500">Valid</span>
              ) : (
                  <span className="text-destructive">Issues Found</span>
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