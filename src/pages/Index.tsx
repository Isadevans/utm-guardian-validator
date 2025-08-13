import {useEffect, useState} from "react";
import {AlertCircle, ArrowLeft, CheckCircle, Loader2, Search} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {ValidationResults} from "@/components/ValidationResults";
import {UtmDebugger} from "@/components/UtmDebugger";
import {ValidationSummary} from "@/components/ValidationSummary";
import {Dashboard, DashboardSelector} from "@/components/DashboardSelector";
import {useToast} from "@/hooks/use-toast";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {Badge} from "@/components/ui/badge";
import {ExportButton} from "@/components/ExportButton";
import {AdsConfigsResult, ValidationSummaryProps} from "@/types/AdsConfigItem.ts"; // Add this at the top with other imports


enum ValidationErrors {
  MISSING_UTM_FIELD = 'MISSING_UTM_FIELD',
  INCORRECT_UTM_FORMAT = 'INCORRECT_UTM_FORMAT',
  CAMPAIGN_WITH_TRACKING_PARAMS = 'CAMPAIGN_WITH_TRACKING_PARAMS',
  ADGROUP_WITH_TRACKING_PARAMS = 'ADGROUP_WITH_TRACKING_PARAMS',
  UTM_IN_LINK_URL = 'UTM_IN_LINK_URL'
}
export interface AdValidationError {
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


interface BulkValidationResult extends ValidationSummaryProps{
  dashboardId: number;
  dashboardName: string;
}
interface IndexProps {
  onLogout?: () => void;
  token: string;
  accountId: string;
}

const Index = ({ onLogout ,token,accountId:accountid}: IndexProps) => {
  const [accountId, setAccountId] = useState(accountid);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(false);
  const [isLoadingValidation, setIsLoadingValidation] = useState(false);
  const [validationData, setValidationData] = useState<ValidationSummaryProps | null>(null);
  const [allValidationData, setAllValidationData] = useState<BulkValidationResult[] | null>(null);
  const [isBulkValidation, setIsBulkValidation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  useEffect(() => {
    // If we have a token and account ID, fetch dashboards automatically on component mount
    if (token && accountId) {
      fetchDashboards();
    }
  }, []);
  const fetchDashboards = async () => {
    setIsLoadingDashboards(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/dashboards`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
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
      setError("Failed to fetch dashboards. Please try again.");
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
    setIsLoadingValidation(true);
    setIsBulkValidation(true);
    setError(null);
    setAllValidationData(null);

    toast({
      title: "Bulk Validation Started",
      description: `Validating all ${dashboards.length} dashboards...`,
    });

    try {
      const validationPromises = dashboards.map(async (dashboard) => {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v2/dashboards/${dashboard.id}/ads-configs`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }
          });
          if (!response.ok) {
            throw new Error(`HTTP error for ${dashboard.name}: ${response.status}`);
          }

          // Transform the API response to match our BulkValidationResult type
          const apiResponse = await response.json() as ValidationSummaryProps;
          const validationResult: BulkValidationResult = {
            ...apiResponse,
            dashboardId: dashboard.id,
            dashboardName: dashboard.name
          };

          return validationResult;
        } catch (error) {
          console.error(`Failed to validate dashboard ${dashboard.name}:`, error);
          throw error
        }
      });

      const results = await Promise.all(validationPromises);
      setAllValidationData(results);

      toast({
        title: "Bulk Validation Complete",
        description: `Finished validating all ${dashboards.length} dashboards.`,
      });

    } catch (err) {
      setError("An unexpected error occurred during bulk validation.");
      toast({
        title: "Bulk Validation Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      console.error('Bulk validation error:', err);
    } finally {
      setIsLoadingValidation(false);
    }
  };

  const resetToAccountInput = () => {
    // Clear relevant localStorage items
    localStorage.removeItem("utmValidationToken");
    localStorage.removeItem("utmValidationAccountId");

    // Reset state
    setDashboards([]);
    setSelectedDashboard(null);
    setValidationData(null);
    setAllValidationData(null);
    setIsBulkValidation(false);
    setError(null);

    // Call onLogout if available to fully reset authentication
    if (onLogout) {
      onLogout()
    };
  };
  const isValidationDataValid = (data: AdsConfigsResult | null): boolean => {
    if (!data) return false;
    const platforms: (keyof AdsConfigsResult)[] = ['facebook', 'google', 'pinterest', 'tiktok'];

    return !platforms.some(platform => {
      const platformItems = data[platform];
      if (Array.isArray(platformItems)) {
        return platformItems.some(item => !item.isTrackParamsValid || item.messages?.length > 0);
      }
      return false;
    });
  };
  const validateDashboard = async (dashboardId: number) => {
    setIsLoadingValidation(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v2/dashboards/${dashboardId}/ads-configs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Transform the API response to match our ValidationSummaryProps type
      const validationResult: AdsConfigsResult = await response.json();

      setValidationData({data:validationResult});

      if (isValidationDataValid(validationResult)) {
        toast({
          title: "Validation Complete",
          description: `All UTM configurations are valid for dashboard ${selectedDashboard?.name}!`,
        });
      } else {
        const totalErrors = getTotalErrorCount(validationResult);
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

  const getTotalErrorCount = (data: AdsConfigsResult): number => {
    if (!data) return 0;
    let errorCount = 0;
    const platforms: (keyof AdsConfigsResult)[] = ['facebook', 'google', 'pinterest', 'tiktok'];

    platforms.forEach(platform => {
      const platformItems = data[platform];
      if (Array.isArray(platformItems)) {
        errorCount += platformItems.filter(item =>
            !item.isTrackParamsValid || (item.messages && item.messages.length > 0)
        ).length;
      }
    });
    return errorCount;
  };
  const extractValidationErrors = (data: AdsConfigsResult | null): AdValidationError[] => {
    if (!data) return [];
    let allErrors: AdValidationError[] = [];
    const platforms: (keyof AdsConfigsResult)[] = ['facebook', 'google', 'pinterest', 'tiktok'];

    platforms.forEach(platform => {
      const platformItems = data[platform];
      if (Array.isArray(platformItems)) {
        const platformErrors = platformItems
            .filter(item => !item.isTrackParamsValid || item.messages?.length > 0)
            .map((item): AdValidationError => ({
              id: item.ad.id,
              name: item.ad.name,
              error_type: item.messages?.length > 0 ? item.messages[0] as ValidationErrors : ValidationErrors.INCORRECT_UTM_FORMAT,
              details: `Invalid UTM parameters found at the Ad level.`,
              platform: platform,
              campaign_name: item.campaign.name,
              adset_name: item.medium.name,
              found_utms: item.ad.trackParams,
              expected_utms: "Expected format not available in this context."
            }));
        allErrors = [...allErrors, ...platformErrors];
      }
    });
    return allErrors;
  };
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full shadow-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Logged in as Account {accountId}</span>
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onLogout) onLogout();
                  }}
              >
                Logout
              </Button>            </div>
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">UTM Validation Center</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Validate UTM configurations across all advertising platforms to ensure proper tracking and attribution
            </p>
          </div>

          {/* Account Input Section */}
          {dashboards.length === 0 && !selectedDashboard && !isBulkValidation && (
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
          {dashboards.length > 0 && !selectedDashboard && !isBulkValidation && (
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
          {error && (
              <Alert variant="destructive" className="max-w-4xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          {/* Single Dashboard Results Section */}
          {validationData && !isBulkValidation && (
              <div className="space-y-6">
                <ValidationSummary data={validationData.data} />

                <Tabs defaultValue="overview" className="max-w-7xl mx-auto">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="debugger">UTM Debugger</TabsTrigger>
                    <TabsTrigger value="platforms">By Platform</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <ValidationResults data={validationData.data} />
                  </TabsContent>

                  <TabsContent value="errors" className="space-y-4">
                    <ValidationResults data={validationData.data} showErrorsOnly />
                  </TabsContent>

                  {/* UTM Debugger disabled for now */}
                  <TabsContent value="debugger" className="space-y-4">
                    {validationData&& (
                        <UtmDebugger
                            errors={
                              extractValidationErrors(validationData.data)
                            }
                        />
                    )}
                  </TabsContent>

                  <TabsContent value="platforms" className="space-y-4">
                    <ValidationResults data={validationData.data} groupByPlatform />
                  </TabsContent>
                </Tabs>
              </div>
          )}

          {/* Bulk Validation Results Section */}
          {isBulkValidation && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Bulk Validation Report</CardTitle>
                    <Button
                        onClick={resetToAccountInput}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={isLoadingValidation}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </div>
                  <CardDescription>
                    Showing validation results for all {dashboards.length} dashboards.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingValidation && (
                      <div className="flex items-center justify-center p-10">
                        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                        <p className="text-lg">Validating dashboards...</p>
                      </div>
                  )}
                  {allValidationData && (
                      <Accordion type="multiple" className="w-full space-y-4">
                        {allValidationData.map((result, index) => {
                          const errorCount = getTotalErrorCount(result.data);
                          return (
                              <AccordionItem value={`item-${index}`} key={result.dashboardId} className="border rounded-lg">
                                <AccordionTrigger className="px-4 hover:no-underline">
                                  <div className="flex items-center gap-4">
                                    {errorCount === 0 ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    <span className="font-semibold">{result.dashboardName}</span>
                                    <Badge variant={errorCount === 0 ? "default" : "destructive"}>
                                      {errorCount} {errorCount === 1 ? 'error' : 'errors'}
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 border-t">
                                  <div className="flex justify-end mb-4">
                                    <ExportButton
                                        data={result.data}
                                        dashboardName={result.dashboardName}
                                    />
                                  </div>
                                  <ValidationResults data={result.data} showErrorsOnly />
                                </AccordionContent>
                              </AccordionItem>
                          );
                        })}
                      </Accordion>
                  )}
                </CardContent>
              </Card>
          )}
        </div>
      </div>
  );
};

export default Index;