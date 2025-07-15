
import { useState } from "react";
import { Search, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ValidationResults } from "@/components/ValidationResults";
import { UtmDebugger } from "@/components/UtmDebugger";
import { ValidationSummary } from "@/components/ValidationSummary";
import { useToast } from "@/hooks/use-toast";

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
}

export interface AdsConfigsResult {
  facebook: AdsConfigItem[];
  google: AdsConfigItem[];
  pinterest: AdsConfigItem[];
  tiktok: AdsConfigItem[];
}

interface ProcessedValidationData {
  is_valid: boolean;
  total_ads_checked: number;
  validation_timestamp: string;
  results: {
    facebook_errors: any[];
    google_errors: any[];
    tiktok_errors: any[];
    pinterest_errors: any[];
  };
  all_ads: AdsConfigItem[];
}

const Index = () => {
  const [dashboardId, setDashboardId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationData, setValidationData] = useState<ProcessedValidationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const requiredUtmPattern = "utm_source=facebook&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium=cpc_{{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}} ";

  const processAdsConfigData = (data: AdsConfigsResult): ProcessedValidationData => {
    const allAds = [...data.facebook, ...data.google, ...data.pinterest, ...data.tiktok];
    
    const createErrorFromAd = (ad: AdsConfigItem, platform: string) => {
      let errorType = 'INCORRECT_UTM_FORMAT';
      let details = `Invalid track params: ${ad.trackParams}`;
      
      if (!ad.trackParams || ad.trackParams.trim() === '') {
        if (ad.isLinkWithoutUtms) {
          errorType = 'MISSING_UTM_FIELD';
          details = 'No UTM parameters found in track params field';
        } else {
          errorType = 'UTM_IN_LINK_URL';
          details = `UTM parameters found in destination URL: ${ad.link}`;
        }
      }
      
      return {
        id: ad.adId,
        name: ad.adName,
        error_type: errorType,
        details,
        platform,
        campaign_name: ad.campaignName,
        adset_name: ad.mediumName,
        found_utms: ad.trackParams,
        expected_utms: requiredUtmPattern.replace('facebook', platform.toLowerCase())
      };
    };

    const facebookErrors = data.facebook
      .filter(ad => !ad.isTrackParamsValid)
      .map(ad => createErrorFromAd(ad, 'Facebook'));
      
    const googleErrors = data.google
      .filter(ad => !ad.isTrackParamsValid)
      .map(ad => createErrorFromAd(ad, 'Google'));
      
    const tiktokErrors = data.tiktok
      .filter(ad => !ad.isTrackParamsValid)
      .map(ad => createErrorFromAd(ad, 'TikTok'));
      
    const pinterestErrors = data.pinterest
      .filter(ad => !ad.isTrackParamsValid)
      .map(ad => createErrorFromAd(ad, 'Pinterest'));

    const totalErrors = facebookErrors.length + googleErrors.length + tiktokErrors.length + pinterestErrors.length;

    return {
      is_valid: totalErrors === 0,
      total_ads_checked: allAds.length,
      validation_timestamp: new Date().toISOString(),
      results: {
        facebook_errors: facebookErrors,
        google_errors: googleErrors,
        tiktok_errors: tiktokErrors,
        pinterest_errors: pinterestErrors
      },
      all_ads: allAds
    };
  };

  const handleValidation = async () => {
    if (!dashboardId.trim()) {
      toast({
        title: "Dashboard ID Required",
        description: "Please enter a valid Dashboard ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3338/v2/dashboards/${dashboardId}/ads-configs`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDU1NywiZ3Vlc3QiOmZhbHNlLCJpYXQiOjE3NTEzNzgzNjUsImV4cCI6MTc1Mzk3MDM2NX0.Of1-vXRILrve-srN6yuszUwg5Etwitvxhy_XUsnA6DI',
          'User-Agent': 'utm-validation-frontend',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const adsConfigData: AdsConfigsResult = await response.json();
      const processedData = processAdsConfigData(adsConfigData);
      setValidationData(processedData);
      
      if (processedData.is_valid) {
        toast({
          title: "Validation Complete",
          description: "All UTM configurations are valid!",
        });
      } else {
        const totalErrors = Object.values(processedData.results).reduce((sum, errors) => sum + errors.length, 0);
        toast({
          title: "Validation Issues Found",
          description: `Found ${totalErrors} UTM configuration issues`,
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Failed to validate UTM configurations. Please check your Dashboard ID and try again.");
      toast({
        title: "Validation Failed",
        description: "Unable to connect to validation service",
        variant: "destructive",
      });
      console.error('Validation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">UTM Validation Center</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Validate UTM configurations across all advertising platforms to ensure proper tracking and attribution
          </p>
        </div>

        {/* Input Section */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Dashboard Validation
            </CardTitle>
            <CardDescription>
              Enter your Dashboard ID to validate UTM configurations across all connected advertising platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter Dashboard ID (e.g., 4895)"
                value={dashboardId}
                onChange={(e) => setDashboardId(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleValidation} 
                disabled={isLoading || !dashboardId.trim()}
                className="px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Validate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Required UTM Pattern */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Required UTM Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm break-all">
              {requiredUtmPattern}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {validationData && (
          <div className="space-y-6">
            <ValidationSummary data={validationData} />
            
            <Tabs defaultValue="overview" className="max-w-7xl mx-auto">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="errors">Error Details</TabsTrigger>
                <TabsTrigger value="debugger">UTM Debugger</TabsTrigger>
                <TabsTrigger value="platforms">By Platform</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <ValidationResults data={validationData} />
              </TabsContent>
              
              <TabsContent value="errors" className="space-y-4">
                <ValidationResults data={validationData} showErrorsOnly />
              </TabsContent>
              
              <TabsContent value="debugger" className="space-y-4">
                <UtmDebugger 
                  errors={[
                    ...validationData.results.facebook_errors,
                    ...validationData.results.google_errors,
                    ...validationData.results.tiktok_errors,
                    ...validationData.results.pinterest_errors
                  ]}
                  requiredPattern={requiredUtmPattern}
                />
              </TabsContent>
              
              <TabsContent value="platforms" className="space-y-4">
                <ValidationResults data={validationData} groupByPlatform />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
