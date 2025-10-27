import {useEffect, useMemo, useState} from "react";
import {AlertCircle, ArrowLeft, CheckCircle, Loader2, Search, LogOut, Copy} from "lucide-react";
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
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Dashboard, DashboardSelector} from "@/components/DashboardSelector";
import {useToast} from "@/hooks/use-toast";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {Badge} from "@/components/ui/badge";
import {ExportButton} from "@/components/ExportButton";
import {AdsConfigItem, AdsConfigsResult, ValidationSummaryProps} from "@/types/AdsConfigItem.ts";
import {UtmTemplates} from "@/components/utmTemplates.tsx";
import {ModeToggle} from "@/components/mode-toggle.tsx";
import {Separator} from "@/components/ui/separator";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";


// --- Data processing logic moved from ValidationResults ---

enum ValidationErrors {
  MISSING_UTM_FIELD = 'MISSING_UTM_FIELD',
  INCORRECT_UTM_FORMAT = 'INCORRECT_UTM_FORMAT',
  CAMPAIGN_WITH_TRACKING_PARAMS = 'CAMPAIGN_WITH_TRACKING_PARAMS',
  ADGROUP_WITH_TRACKING_PARAMS = 'ADGROUP_WITH_TRACKING_PARAMS',
  UTM_IN_LINK_URL = 'UTM_IN_LINK_URL'
}

interface AdItem {
  adId: string;
  adName: string;
  platform: string;
  campaignName: string;
  campaignId: string;
  adsetName?: string;
  adsetId?: string;
  spend: number;
  trackParams: {
    final?: string | null;
    ad?: string | null;
    medium?: string | null;
    campaign?: string | null;
    account?: string | null;
  };
  isActive: boolean;
  link?: string;
  preview_link?: string;
  errorTypes: ValidationErrors[];
  isValid: boolean;
}

interface CampaignGroup {
  totalSpend: number;
  campaignName: string;
  campaignId: string;
  platform: string;
  ads: AdItem[];
  errorCount: number;
  adCount: number;
  isCampaignActive: boolean;
}

const processAdsData = (items: AdsConfigItem[], platform: string): CampaignGroup[] => {
  const campaignMap: Record<string, {
    campaignName: string,
    campaignId: string,
    ads: Record<string, AdItem>
  }> = {};

  items.forEach((item) => {
    if (!campaignMap[item.campaign.id]) {
      campaignMap[item.campaign.id] = {
        campaignName: item.campaign.name,
        campaignId: item.campaign.id,
        ads: {}
      };
    }

    if (!campaignMap[item.campaign.id].ads[item.ad.id]) {
      const isValid = !item.messages || item.messages.length === 0;
      const effectiveTrackParams = item.ad?.trackParams || item.medium?.trackParams || item.campaign?.trackParams || item.account?.trackParams;

      campaignMap[item.campaign.id].ads[item.ad.id] = {
        adId: item.ad.id,
        adName: item.ad.name,
        platform: platform,
        campaignName: item.campaign.name,
        campaignId: item.campaign.id,
        adsetName: item.medium.name,
        adsetId: item.medium.id,
        spend: item.spend,
        isActive: item.isActive,
        trackParams: {
          final: effectiveTrackParams || item.trackParams,
          ad: item.ad?.trackParams,
          medium: item.medium?.trackParams,
          campaign: item.campaign?.trackParams,
          account: item.account?.trackParams,
        },
        preview_link: item.preview_link,
        link: item.link,
        errorTypes: item.messages as ValidationErrors[] || [],
        isValid: isValid
      };
    }
  });

  return Object.values(campaignMap).map(campaign => {
    const ads = Object.values(campaign.ads);
    const totalSpend = ads.reduce((sum, ad) => sum + ad.spend, 0);
    const errorCount = ads.filter(ad => !ad.isValid && ad.spend > 0).length;
    const isCampaignActive = ads.some(ad => ad.isActive);

    return {
      campaignName: campaign.campaignName,
      campaignId: campaign.campaignId,
      platform: platform,
      ads: ads,
      errorCount: errorCount,
      adCount: ads.length,
      totalSpend,
      isCampaignActive,
    };
  });
};

const getFilteredDataForExport = (originalData: AdsConfigsResult, filteredCampaigns: CampaignGroup[]): AdsConfigsResult => {
  const adIdsToKeep = new Set(filteredCampaigns.flatMap(group => group.ads.map(ad => ad.adId)));
  return {
    facebook: { recommendedUtms: originalData.facebook?.recommendedUtms || '', configs: originalData.facebook?.configs?.filter(item => adIdsToKeep.has(item.ad.id)) || [] },
    google: { recommendedUtms: originalData.google?.recommendedUtms || '', configs: originalData.google?.configs?.filter(item => adIdsToKeep.has(item.ad.id)) || [] },
    tiktok: { recommendedUtms: originalData.tiktok?.recommendedUtms || '', configs: originalData.tiktok?.configs?.filter(item => adIdsToKeep.has(item.ad.id)) || [] },
    pinterest: { recommendedUtms: originalData.pinterest?.recommendedUtms || '', configs: originalData.pinterest?.configs?.filter(item => adIdsToKeep.has(item.ad.id)) || [] },
  };
};

// --- End of moved logic ---


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

interface BulkValidationResult {
  data: AdsConfigsResult;
  dashboardId: number;
  dashboardName: string;
}
interface IndexProps {
  onLogout?: () => void;
  token: string;
  accountId: string;
}

// A custom hook to encapsulate the complex filtering logic
const useFilteredCampaigns = (
    data: AdsConfigsResult | null,
    showDisabled: boolean,
    showNonSpend: boolean,
    showNoUtmsOnly: boolean,
    showValidsAds: boolean,
    searchQuery: string
) => {
  return useMemo(() => {
    if (!data) return [];

    const facebookCampaigns = data.facebook?.configs ? processAdsData(data.facebook.configs, 'Facebook') : [];
    const googleCampaigns = data.google?.configs ? processAdsData(data.google.configs, 'Google') : [];
    const tiktokCampaigns = data.tiktok?.configs ? processAdsData(data.tiktok.configs, 'TikTok') : [];
    const pinterestCampaigns = data.pinterest?.configs ? processAdsData(data.pinterest.configs, 'Pinterest') : [];

    const allCampaignGroups = [...facebookCampaigns, ...googleCampaigns, ...tiktokCampaigns, ...pinterestCampaigns].sort((a,b) => {
      if (a.isCampaignActive !== b.isCampaignActive) return a.isCampaignActive ? -1 : 1;
      if (a.errorCount !== b.errorCount) return b.errorCount - a.errorCount;
      if (a.totalSpend !== b.totalSpend) return b.totalSpend - a.totalSpend;
      return a.campaignName.localeCompare(b.campaignName);
    });

    const filteredCampaignGroups = allCampaignGroups.map(group => {
      const filteredAds = group.ads.filter(ad => {
        if (!showDisabled && !ad.isActive) return false;
        if (!showNonSpend && (ad.spend === 0 || ad.spend == null)) return false;
        if (showNoUtmsOnly) {
          const hasAnyUtms = ad.trackParams.ad || ad.trackParams.medium || ad.trackParams.campaign || ad.trackParams.account;
          if (hasAnyUtms) return false;
        }
        if (!showValidsAds && ad.isValid) return false;
        return true;
      });
      return { ...group, ads: filteredAds };
    }).filter(group => group.ads.length > 0);

    if (!searchQuery.trim()) {
      return filteredCampaignGroups;
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    return filteredCampaignGroups.map(group => {
      const searchedAds = group.ads.filter(ad =>
          ad.campaignName.toLowerCase().includes(lowercasedQuery) ||
          ad.campaignId.toLowerCase().includes(lowercasedQuery) ||
          ad.adName.toLowerCase().includes(lowercasedQuery) ||
          ad.adId.toLowerCase().includes(lowercasedQuery) ||
          (ad.adsetName?.toLowerCase().includes(lowercasedQuery) || false) ||
          (ad.adsetId?.toLowerCase().includes(lowercasedQuery) || false)
      );
      if (searchedAds.length > 0) {
        return { ...group, ads: searchedAds };
      }
      return null;
    }).filter((group): group is CampaignGroup => group !== null);

  }, [data, showDisabled, showNonSpend, showNoUtmsOnly, showValidsAds, searchQuery]);
};


const Index = ({ onLogout ,token,accountId:accountid}: IndexProps) => {
  const [accountId, setAccountId] = useState(accountid);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(false);
  const [isLoadingValidation, setIsLoadingValidation] = useState(false);
  const [validationData, setValidationData] = useState<ValidationSummaryProps | null>(null);
  const [allValidationData, setAllValidationData] = useState<BulkValidationResult[] | null>(null);
  const [isBulkValidation, setIsBulkValidation] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [showNoUtmsOnly, setShowNoUtmsOnly] = useState(false);
  const [showNonSpend, setShowNonSpend] = useState(false);
  const [showValidsAds, setShowValidsAds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const displayedCampaigns = useFilteredCampaigns(validationData?.data || null, showDisabled, showNonSpend, showNoUtmsOnly, showValidsAds, searchQuery);

  useEffect(() => {
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const dashboardsData: Dashboard[] = await response.json();
      setDashboards(dashboardsData);
      toast({ title: "Dashboards Loaded", description: `Found ${dashboardsData.length} dashboard(s)` });
    } catch (err) {
      setError("Failed to fetch dashboards. Please try again.");
      toast({ title: "Failed to Load Dashboards", description: "Unable to connect to the dashboard service", variant: "destructive" });
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
    toast({ title: "Bulk Validation Started", description: `Validating all ${dashboards.length} dashboards...` });

    try {
      const validationPromises = dashboards.map(async (dashboard) => {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v2/dashboards/${dashboard.id}/ads-configs`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
          });
          if (!response.ok) throw new Error(`HTTP error for ${dashboard.name}: ${response.status}`);
          const apiResponse = await response.json() as AdsConfigsResult;
          return { data: apiResponse, dashboardId: dashboard.id, dashboardName: dashboard.name };
        } catch (error) {
          console.error(`Failed to validate dashboard ${dashboard.name}:`, error);
          throw error;
        }
      });
      const results = await Promise.all(validationPromises);
      setAllValidationData(results);
      toast({ title: "Bulk Validation Complete", description: `Finished validating all ${dashboards.length} dashboards.` });
    } catch (err) {
      setError("An unexpected error occurred during bulk validation.");
      toast({ title: "Bulk Validation Failed", description: "An unexpected error occurred.", variant: "destructive" });
      console.error('Bulk validation error:', err);
    } finally {
      setIsLoadingValidation(false);
    }
  };

  const resetToAccountInput = () => {
    localStorage.removeItem("utmValidationToken");
    localStorage.removeItem("utmValidationAccountId");
    setDashboards([]);
    setSelectedDashboard(null);
    setValidationData(null);
    setAllValidationData(null);
    setIsBulkValidation(false);
    setError(null);
    if (onLogout) onLogout();
  };

  const isValidationDataValid = (data: AdsConfigsResult | null): boolean => {
    if (!data) return false;
    const platforms: (keyof AdsConfigsResult)[] = ['facebook', 'google', 'pinterest', 'tiktok'];
    return !platforms.some(p => data[p]?.configs?.some(item => item.messages?.length > 0));
  };

  const validateDashboard = async (dashboardId: number) => {
    setIsLoadingValidation(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/v2/dashboards/${dashboardId}/ads-configs`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const validationResult: AdsConfigsResult = await response.json();
      setValidationData({ data: validationResult });
      if (isValidationDataValid(validationResult)) {
        toast({ title: "Validation Complete", description: `All UTM configurations are valid for dashboard ${selectedDashboard?.name}!` });
      } else {
        const totalErrors = getTotalErrorCount(validationResult);
        toast({ title: "Validation Issues Found", description: `Found ${totalErrors} UTM configuration issues in ${selectedDashboard?.name}`, variant: "destructive" });
      }
    } catch (err) {
      setError(`Failed to validate UTM configurations for dashboard ${selectedDashboard?.name}. Please try again.`);
      toast({ title: "Validation Failed", description: "Unable to connect to validation service", variant: "destructive" });
      console.error('Validation error:', err);
    } finally {
      setIsLoadingValidation(false);
    }
  };

  const getTotalErrorCount = (data: AdsConfigsResult): number => {
    if (!data) return 0;
    const platforms: (keyof AdsConfigsResult)[] = ['facebook', 'google', 'pinterest', 'tiktok'];
    return platforms.reduce((acc, p) => acc + (data[p]?.configs?.filter(item => item.messages?.length > 0).length || 0), 0);
  };

  const extractValidationErrors = (data: AdsConfigsResult | null): AdValidationError[] => {
    if (!data) return [];
    const platforms: (keyof AdsConfigsResult)[] = ['facebook', 'google', 'pinterest', 'tiktok'];
    return platforms.flatMap(platform =>
        data[platform]?.configs?.filter(item => item.messages?.length > 0).map(({ ad, medium, campaign, messages }): AdValidationError => ({
          id: ad.id,
          name: ad.name,
          error_type: messages?.[0] as ValidationErrors || ValidationErrors.INCORRECT_UTM_FORMAT,
          details: 'Invalid UTM parameters found at the Ad level.',
          platform: platform,
          campaign_name: campaign.name,
          adset_name: medium.name,
          found_utms: ad.trackParams,
          expected_utms: "Expected format not available in this context."
        })) || []
    );
  };

  const BulkResultItem = ({ result }: { result: BulkValidationResult }) => {
    const filteredCampaigns = useFilteredCampaigns(result.data, showDisabled, showNonSpend, showNoUtmsOnly, showValidsAds, searchQuery);
    const errorCount = getTotalErrorCount(result.data);

    const handleCopyDashboardName = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent accordion toggle
      try {
        await navigator.clipboard.writeText(result.dashboardName);
        toast({
          title: "Copiado!",
          description: "Nome do dashboard copiado para a área de transferência",
        });
      } catch (err) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o nome do dashboard",
          variant: "destructive",
        });
      }
    };

    return (
        <AccordionItem value={result.dashboardId.toString()} className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-4">
              {errorCount === 0 ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
              <span className="font-semibold">{result.dashboardName}</span>
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                      onClick={handleCopyDashboardName}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copiar nome do dashboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Badge variant={errorCount === 0 ? "default" : "destructive"}>{errorCount} {errorCount === 1 ? 'error' : 'errors'}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 border-t">
            <div className="flex justify-end mb-4">
              <ExportButton data={getFilteredDataForExport(result.data, filteredCampaigns)} dashboardName={result.dashboardName} />
            </div>
            <ValidationResults campaignGroups={filteredCampaigns} />
          </AccordionContent>
        </AccordionItem>
    );
  };


  return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto">
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
                <Button variant="outline" size="icon" onClick={() => onLogout && onLogout()} title="Logout" className="h-9 w-9">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-8">
            {dashboards.length === 0 && !selectedDashboard && !isBulkValidation && (
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold text-foreground">Get Started</h2>
                    <p className="text-sm text-muted-foreground">Enter your Account ID to load your dashboards and validate UTM configurations</p>

                  </div>
                  <Card className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input placeholder="Account ID (e.g., 4557)" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="flex-1 h-11" disabled={isLoadingDashboards} />
                        <Button onClick={fetchDashboards} disabled={isLoadingDashboards || !accountId.trim()} className="h-11 px-8 sm:w-auto w-full" size="lg">
                          {isLoadingDashboards ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</> : <><Search className="mr-2 h-4 w-4" />Fetch Dashboards</>}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
            )}
            {dashboards.length > 0 && !selectedDashboard && !isBulkValidation && (
                <DashboardSelector dashboards={dashboards} onSelectDashboard={handleSelectDashboard} onSelectAll={handleSelectAllDashboards} onBack={resetToAccountInput} />
            )}
            {selectedDashboard && (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          {isLoadingValidation ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                          {selectedDashboard.name}
                        </CardTitle>
                        <CardDescription className="text-sm">Dashboard ID: {selectedDashboard.id} • Account: {selectedDashboard.accountId}{isLoadingValidation && " • Fetching UTM configurations..."}</CardDescription>
                      </div>
                      <Button onClick={resetToAccountInput} variant="outline" size="sm" className="flex items-center gap-2 sm:shrink-0" disabled={isLoadingValidation}>
                        <ArrowLeft className="h-4 w-4" />Change
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
            )}
            {error && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>)}
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
                          <Input placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                        </div>
                        {validationData.data && <ExportButton data={getFilteredDataForExport(validationData.data, displayedCampaigns)} />}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-6 mb-4 p-4 bg-muted/30 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="disabled-toggle" 
                          checked={showDisabled} 
                          onCheckedChange={(checked) => setShowDisabled(checked === true)} 
                        />
                        <Label 
                          htmlFor="disabled-toggle" 
                          className="text-sm cursor-pointer font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Show disabled
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="non-spend-toggle" 
                          checked={showNonSpend} 
                          onCheckedChange={(checked) => setShowNonSpend(checked === true)} 
                        />
                        <Label 
                          htmlFor="non-spend-toggle" 
                          className="text-sm cursor-pointer font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Show non-spend
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="no-utms-toggle" 
                          checked={showNoUtmsOnly} 
                          onCheckedChange={(checked) => setShowNoUtmsOnly(checked === true)} 
                        />
                        <Label 
                          htmlFor="no-utms-toggle" 
                          className="text-sm cursor-pointer font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Sem UTM
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="valid-ads-toggle" 
                          checked={showValidsAds} 
                          onCheckedChange={(checked) => setShowValidsAds(checked === true)} 
                        />
                        <Label 
                          htmlFor="valid-ads-toggle" 
                          className="text-sm cursor-pointer font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Mostrar válidos
                        </Label>
                      </div>
                    </div>
                    <TabsContent value="overview" className="space-y-4">
                      <ValidationResults campaignGroups={displayedCampaigns} />
                    </TabsContent>
                    <TabsContent value="utmparameters" className="space-y-4"><UtmTemplates/></TabsContent>
                    <TabsContent value="debugger" className="space-y-4">{validationData&& (<UtmDebugger errors={extractValidationErrors(validationData.data)} />)}</TabsContent>
                    <TabsContent value="platforms" className="space-y-4">
                      <ValidationResults campaignGroups={displayedCampaigns} groupByPlatform />
                    </TabsContent>
                  </Tabs>
                </div>
            )}
            {isBulkValidation && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Bulk Validation Report</h2>
                      <p className="text-sm text-muted-foreground mt-1">Validation results for all {dashboards.length} dashboards</p>
                    </div>
                    <Button onClick={resetToAccountInput} variant="outline" size="sm" className="flex items-center gap-2 sm:shrink-0" disabled={isLoadingValidation}><ArrowLeft className="h-4 w-4" />Back</Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 sm:max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="bulk-disabled-toggle" 
                        checked={showDisabled} 
                        onCheckedChange={(checked) => setShowDisabled(checked === true)} 
                      />
                      <Label 
                        htmlFor="bulk-disabled-toggle" 
                        className="text-sm cursor-pointer font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show disabled
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="bulk-non-spend-toggle" 
                        checked={showNonSpend} 
                        onCheckedChange={(checked) => setShowNonSpend(checked === true)} 
                      />
                      <Label 
                        htmlFor="bulk-non-spend-toggle" 
                        className="text-sm cursor-pointer font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show non-spend
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="bulk-valid-ads-toggle" 
                        checked={showValidsAds} 
                        onCheckedChange={(checked) => setShowValidsAds(checked === true)} 
                      />
                      <Label 
                        htmlFor="bulk-valid-ads-toggle" 
                        className="text-sm cursor-pointer font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Mostrar válidos
                      </Label>
                    </div>
                  </div>
                  <Card><CardContent>
                    {isLoadingValidation && (<div className="flex items-center justify-center p-10"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><p className="text-lg">Validating dashboards...</p></div>)}
                    {allValidationData && (<Accordion type="multiple" className="w-full">{allValidationData.map((result) => <BulkResultItem key={result.dashboardId} result={result} />)}</Accordion>)}
                  </CardContent></Card>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default Index;