import {useEffect, useState} from "react";
import {AlertCircle, ArrowLeft, CheckCircle, Loader2, Search, LogOut} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {ValidationResults} from "@/components/ValidationResults";
import {UtmDebugger} from "@/components/UtmDebugger";
import {ValidationSummary} from "@/components/ValidationSummary";
import {Label} from "@/components/ui/label.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {Dashboard, DashboardSelector} from "@/components/DashboardSelector";
import {useToast} from "@/hooks/use-toast";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {Badge} from "@/components/ui/badge";
import {ExportButton} from "@/components/ExportButton";
import {AdsConfigItem, AdsConfigsResult, ValidationSummaryProps} from "@/types/AdsConfigItem.ts";
import {UtmTemplates} from "@/components/utmTemplates.tsx";
import {ModeToggle} from "@/components/mode-toggle.tsx";
import {Separator} from "@/components/ui/separator";


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
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [showNoUtmsOnly, setShowNoUtmsOnly] = useState(false);
  const [showNonSpend, setShowNonSpend] = useState(false);
  const [showValidsAds, setShowValidsAds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between px-6 py-3">
              <h1 className="text-xl font-bold text-foreground">UTM Checker</h1>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-foreground">Account {accountId}</span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <ModeToggle />
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (onLogout) onLogout();
                    }}
                    title="Logout"
                    className="h-9 w-9"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
          {/* Account Input Section */}
          {dashboards.length === 0 && !selectedDashboard && !isBulkValidation && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">Get Started</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your Account ID to load your dashboards and validate UTM configurations
                  </p>
                </div>
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                          placeholder="Account ID (e.g., 4557)"
                          value={accountId}
                          onChange={(e) => setAccountId(e.target.value)}
                          className="flex-1 h-11"
                          disabled={isLoadingDashboards}
                      />
                      <Button
                          onClick={fetchDashboards}
                          disabled={isLoadingDashboards || !accountId.trim()}
                          className="h-11 px-8 sm:w-auto w-full"
                          size="lg"
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
              </div>
          )}

          {/* Dashboard Selection */}
          {dashboards.length > 0 && !selectedDashboard && !isBulkValidation && (
                <DashboardSelector
                    dashboards={dashboards}
                    onSelectDashboard={handleSelectDashboard}
                    onSelectAll={handleSelectAllDashboards}
                    onBack={resetToAccountInput}
                />
          )}

          {/* Current Dashboard Info */}
          {selectedDashboard && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        {isLoadingValidation ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {selectedDashboard.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Dashboard ID: {selectedDashboard.id} • Account: {selectedDashboard.accountId}
                        {isLoadingValidation && " • Fetching UTM configurations..."}
                      </CardDescription>
                    </div>
                    <Button
                        onClick={resetToAccountInput}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 sm:shrink-0"
                        disabled={isLoadingValidation}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Change
                    </Button>
                  </div>
                </CardHeader>
              </Card>
          )}
          {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          {/* Single Dashboard Results Section */}
          {validationData && !isBulkValidation && (
              <div className="space-y-6">
                <ValidationSummary data={validationData.data} />

                <Tabs defaultValue="overview">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="utmparameters">Correct UTMs</TabsTrigger>
                      <TabsTrigger value="platforms">By Platform</TabsTrigger>
                    </TabsList>
                    <div className="flex flex-col sm:flex-row gap-3 lg:ml-auto w-full lg:w-auto">
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Search by name or ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                      />
                    </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mb-4 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Switch
                          id="disabled-toggle"
                          checked={showDisabled}
                          onCheckedChange={setShowDisabled}
                      />
                      <Label htmlFor="disabled-toggle" className="text-sm cursor-pointer">Show disabled</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                          id="non-spend-toggle"
                          checked={showNonSpend}
                          onCheckedChange={setShowNonSpend}
                      />
                      <Label htmlFor="non-spend-toggle" className="text-sm cursor-pointer">Show non-spend</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                          id="no-utms-toggle"
                          checked={showNoUtmsOnly}
                          onCheckedChange={setShowNoUtmsOnly}
                      />
                      <Label htmlFor="no-utms-toggle" className="text-sm cursor-pointer">Sem UTM</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                          id="valid-ads-toggle"
                          checked={showValidsAds}
                          onCheckedChange={setShowValidsAds}
                      />
                      <Label htmlFor="valid-ads-toggle" className="text-sm cursor-pointer">Mostrar válidos</Label>
                    </div>
                  </div>

                  <TabsContent value="overview" className="space-y-4">
                    <ValidationResults
                      data={validationData.data}
                      showDisabled={showDisabled}
                      showNonSpend={showNonSpend}
                      searchQuery={searchQuery}
                      showValidsAds={showValidsAds}
                    />
                  </TabsContent>

                  <TabsContent value="utmparameters" className="space-y-4">
                    <UtmTemplates/>
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
                    <ValidationResults
                      data={validationData.data}
                      groupByPlatform
                      showDisabled={showDisabled}
                      showNonSpend={showNonSpend}
                      searchQuery={searchQuery}
                      showNoUtmsOnly={showNoUtmsOnly}
                      showValidsAds={showValidsAds}
                    />
                  </TabsContent>
                </Tabs>
              </div>
          )}

          {/* Bulk Validation Results Section */}
          {isBulkValidation && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Bulk Validation Report</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Validation results for all {dashboards.length} dashboards
                    </p>
                  </div>
                  <Button
                      onClick={resetToAccountInput}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 sm:shrink-0"
                      disabled={isLoadingValidation}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Switch
                        id="bulk-disabled-toggle"
                        checked={showDisabled}
                        onCheckedChange={setShowDisabled}
                    />
                    <Label htmlFor="bulk-disabled-toggle" className="text-sm cursor-pointer">Show disabled</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                        id="bulk-non-spend-toggle"
                        checked={showNonSpend}
                        onCheckedChange={setShowNonSpend}
                    />
                    <Label htmlFor="bulk-non-spend-toggle" className="text-sm cursor-pointer">Show non-spend</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                        id="bulk-valid-ads-toggle"
                        checked={showValidsAds}
                        onCheckedChange={setShowValidsAds}
                    />
                    <Label htmlFor="bulk-valid-ads-toggle" className="text-sm cursor-pointer">Mostrar válidos</Label>
                  </div>
                </div>
                
                <Card>
                <CardContent>
                  {isLoadingValidation && (
                      <div className="flex items-center justify-center p-10">
                        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                        <p className="text-lg">Validating dashboards...</p>
                      </div>
                  )}
                  {allValidationData && (
                      <Accordion type="multiple" className="w-full">
                        {allValidationData.filter(result => !showErrorsOnly || getTotalErrorCount(result.data) > 0)
                            .map((result, index) => {
                              const errorCount = getTotalErrorCount(result.data);

                              // Helper to create filtered data for the export button
                              const getFilteredDataForBulkExport = (data: AdsConfigsResult): AdsConfigsResult => {
                                const allItems = Object.values(data).flatMap(platformItems => platformItems || []);
                                if (allItems.length === 0) {
                                  return { facebook: [], google: [], tiktok: [], pinterest: [] };
                                }

                                const campaignMap: Record<string, { items: AdsConfigItem[], totalSpend: number, isActive: boolean, hasErrors: boolean }> = {};

                                allItems.forEach(item => {
                                  if (!campaignMap[item.campaign.id]) {
                                    campaignMap[item.campaign.id] = { items: [], totalSpend: 0, isActive: false, hasErrors: false };
                                  }
                                  campaignMap[item.campaign.id].items.push(item);
                                });

                                for (const campaignId in campaignMap) {
                                  const campaign = campaignMap[campaignId];
                                  campaign.totalSpend = campaign.items.reduce((sum, ad) => sum + (ad.spend || 0), 0);
                                  campaign.isActive = campaign.items.some(ad => ad.isActive);
                                  campaign.hasErrors = campaign.items.some(ad => (!ad.isTrackParamsValid || (ad.messages && ad.messages.length > 0)) && ad.spend > 0);
                                }

                                let campaignIdsToKeep = Object.keys(campaignMap);

                                if (!showDisabled) {
                                  campaignIdsToKeep = campaignIdsToKeep.filter(id => campaignMap[id].isActive);
                                }
                                if (!showNonSpend) {
                                  campaignIdsToKeep = campaignIdsToKeep.filter(id => campaignMap[id].totalSpend > 0);
                                }

                                const campaignIdsSet = new Set(campaignIdsToKeep);

                                return {
                                  facebook: data.facebook?.filter(item => campaignIdsSet.has(item.campaign.id)) || [],
                                  google: data.google?.filter(item => campaignIdsSet.has(item.campaign.id)) || [],
                                  tiktok: data.tiktok?.filter(item => campaignIdsSet.has(item.campaign.id)) || [],
                                  pinterest: data.pinterest?.filter(item => campaignIdsSet.has(item.campaign.id)) || [],
                                };
                              };
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
                                            data={getFilteredDataForBulkExport(result.data)}
                                            dashboardName={result.dashboardName}
                                        />
                                      </div>
                                      <ValidationResults
                                        data={result.data}
                                        showDisabled={showDisabled}
                                        showNonSpend={showNonSpend}
                                        searchQuery={searchQuery}
                                        showNoUtmsOnly={showNoUtmsOnly}
                                        showValidsAds={showValidsAds}
                                      />
                                    </AccordionContent>
                                  </AccordionItem>
                              );
                            })}
                      </Accordion>
                  )}
                </CardContent>
              </Card>
              </div>
          )}
          </div>
        </div>
      </div>
  );
};

export default Index;

