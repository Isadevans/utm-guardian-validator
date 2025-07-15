
import { useState } from "react";
import { Search, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ValidationResults } from "@/components/ValidationResults";
import { UtmDebugger } from "@/components/UtmDebugger";
import { ValidationSummary } from "@/components/ValidationSummary";
import { useToast } from "@/hooks/use-toast";

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

interface ValidationResult {
  facebook_errors: AdValidationError[];
  google_errors: AdValidationError[];
  tiktok_errors: AdValidationError[];
  pinterest_errors: AdValidationError[];
}

interface ValidationResponse {
  is_valid: boolean;
  results: ValidationResult;
  total_ads_checked: number;
  validation_timestamp: string;
}

const Index = () => {
  const [dashboardId, setDashboardId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationData, setValidationData] = useState<ValidationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const requiredUtmPattern = "utm_source=facebook&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium=cpc_{{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}} | nemu_213123213";

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
      // Mock API call - replace with actual gRPC call
      const response = await mockValidateUtms(dashboardId);
      setValidationData(response);
      
      if (response.is_valid) {
        toast({
          title: "Validation Complete",
          description: "All UTM configurations are valid!",
        });
      } else {
        const totalErrors = Object.values(response.results).reduce((sum, errors) => sum + errors.length, 0);
        toast({
          title: "Validation Issues Found",
          description: `Found ${totalErrors} UTM configuration issues`,
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Failed to validate UTM configurations. Please try again.");
      toast({
        title: "Validation Failed",
        description: "Unable to connect to validation service",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock function - replace with actual gRPC call
  const mockValidateUtms = async (dashboardId: string): Promise<ValidationResponse> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    
    return {
      is_valid: false,
      total_ads_checked: 127,
      validation_timestamp: new Date().toISOString(),
      results: {
        facebook_errors: [
          {
            id: "23847738474",
            name: "Summer Sale Campaign - Mobile",
            error_type: "INCORRECT_UTM_FORMAT",
            details: "utm_source=facebook&utm_campaign=summer_sale&utm_medium=cpc",
            platform: "Facebook",
            campaign_name: "Summer Sale 2024",
            adset_name: "Mobile Users 18-35",
            found_utms: "utm_source=facebook&utm_campaign=summer_sale&utm_medium=cpc",
            expected_utms: requiredUtmPattern
          },
          {
            id: "23847738475",
            name: "Brand Awareness Video",
            error_type: "MISSING_UTM_FIELD",
            details: "No UTM parameters found in url_tags field",
            platform: "Facebook",
            campaign_name: "Brand Awareness Q4",
            adset_name: "Video Viewers",
            found_utms: "",
            expected_utms: requiredUtmPattern
          },
          {
            id: "23847738476",
            name: "Product Launch Ad",
            error_type: "UTM_IN_LINK_URL",
            details: "UTM parameters found in destination URL instead of url_tags field",
            platform: "Facebook",
            campaign_name: "Product Launch",
            adset_name: "Interested Shoppers",
            found_utms: "https://example.com?utm_source=facebook&utm_campaign=launch",
            expected_utms: requiredUtmPattern
          }
        ],
        google_errors: [
          {
            id: "google_123",
            name: "Search Campaign Ad",
            error_type: "INCORRECT_UTM_FORMAT",
            details: "Missing campaign ID in UTM format",
            platform: "Google",
            campaign_name: "Search Campaign",
            found_utms: "utm_source=google&utm_campaign={{campaign.name}}&utm_medium=cpc",
            expected_utms: requiredUtmPattern.replace('facebook', 'google')
          }
        ],
        tiktok_errors: [],
        pinterest_errors: []
      }
    };
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
                placeholder="Enter Dashboard ID (e.g., dashboard_123456)"
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
