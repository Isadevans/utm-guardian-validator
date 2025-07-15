
import { useState } from "react";
import { Search, AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ValidationResults } from "@/components/ValidationResults";
import { UtmDebugger } from "@/components/UtmDebugger";
import { ValidationSummary } from "@/components/ValidationSummary";
import { DashboardSelector, Dashboard } from "@/components/DashboardSelector";
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
  const [accountId, setAccountId] = useState("");
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(false);
  const [isLoadingValidation, setIsLoadingValidation] = useState(false);
  const [validationData, setValidationData] = useState<ProcessedValidationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const JWT_SECRET = "vV~U!nIBCJ,-t>()7CRMhde;nVNKSHcZanuh,F:-W4GXIYL$$JuvkN/&'o.S$+w";

  const requiredUtmPattern = "utm_source=facebook&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium=cpc_{{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}";

  const generateJWT = async (accountId: string): Promise<string> => {
    const header = {
      alg: "HS256",
      typ: "JWT"
    };

    const payload = {
      id: parseInt(accountId),
      guest: false,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 1 day from now
    };

    // Base64URL encode function
    const base64UrlEncode = (str: string): string => {
      return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;

    // Create HMAC-SHA256 signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const signatureArray = new Uint8Array(signature);
    const signatureBase64 = base64UrlEncode(String.fromCharCode(...signatureArray));

    return `${data}.${signatureBase64}`;
  };

  const fetchDashboards = async () => {
    if (!accountId.trim()) {
      toast({
        title: "Account ID Required",
        description: "Please enter a valid Account ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingDashboards(true);
    setError(null);

    try {
      const token = await generateJWT(accountId);
      const response = await fetch('https://backend.nemu.com.br/dashboards', {
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-US,en;q=0.9',
          'authorization': `Bearer ${token}`,
          'cache-control': 'no-cache',
          'origin': 'https://app.nemu.com.br',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'referer': 'https://app.nemu.com.br/',
          'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const dashboardsData: Dashboard[] = await response.json();
      setDashboards(dashboardsData);

      toast({
        title: "Dashboards Loaded",
        description: `Found ${dashboardsData.length} dashboard(s)`,
      });
    } catch (err) {
      setError("Failed to fetch dashboards. Please check your Account ID and try again.");
      toast({
        title: "Failed to Load Dashboards",
        description: "Unable to connect to the dashboard service",
        variant: "destructive",
      });
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoadingDashboards(false);
    }
  };

  const handleSelectDashboard = async (dashboardId: number) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return;

    setSelectedDashboard(dashboard);
    await validateDashboard(dashboardId);
  };

  const handleSelectAllDashboards = async () => {
    // For now, we'll validate the first dashboard or show a message
    if (dashboards.length > 0) {
      toast({
        title: "Validate All Dashboards",
        description: "This feature will be implemented to validate all dashboards at once",
      });
    }
  };

  const resetToAccountInput = () => {
    setDashboards([]);
    setSelectedDashboard(null);
    setValidationData(null);
    setError(null);
  };

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

  const validateDashboard = async (dashboardId: number) => {
    setIsLoadingValidation(true);
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
          description: `All UTM configurations are valid for dashboard ${selectedDashboard?.name}!`,
        });
      } else {
        const totalErrors = Object.values(processedData.results).reduce((sum, errors) => sum + errors.length, 0);
        toast({
          title: "Validation Issues Found",
          description: `Found ${totalErrors} UTM configuration issues in ${selectedDashboard?.name}`,
          variant: "destructive",
        });
      }
    } catch (err) {
      setError(`Failed to validate UTM configurations for dashboard ${selectedDashboard?.name}. Please try again.`);
      toast({
        title: "Validation Failed",
        description: "Unable to connect to validation service",
        variant: "destructive",
      });
      console.error('Validation error:', err);
    } finally {
      setIsLoadingValidation(false);
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

        {/* Account Input Section */}
        {dashboards.length === 0 && !selectedDashboard && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Account Login
              </CardTitle>
              <CardDescription>
                Enter your Account ID to fetch your dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Enter Account ID (e.g., 4557)"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="flex-1"
                  disabled={isLoadingDashboards}
                />
                <Button
                  onClick={fetchDashboards}
                  disabled={isLoadingDashboards || !accountId.trim()}
                  className="px-8"
                >
                  {isLoadingDashboards ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Fetch Dashboards
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Selection */}
        {dashboards.length > 0 && !selectedDashboard && (
          <div className="space-y-4">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
              <Button
                onClick={resetToAccountInput}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Account Input
              </Button>
            </div>
            <DashboardSelector
              dashboards={dashboards}
              onSelectDashboard={handleSelectDashboard}
              onSelectAll={handleSelectAllDashboards}
            />
          </div>
        )}

        {/* Current Dashboard Info */}
        {selectedDashboard && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isLoadingValidation ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {isLoadingValidation ? 'Validating' : 'Dashboard'}: {selectedDashboard.name}
                  </CardTitle>
                  <CardDescription>
                    Dashboard ID: {selectedDashboard.id} | Account: {selectedDashboard.accountId}
                    {isLoadingValidation && " • Fetching UTM configurations..."}
                  </CardDescription>
                </div>
                <Button
                  onClick={resetToAccountInput}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={isLoadingValidation}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change Dashboard
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

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
