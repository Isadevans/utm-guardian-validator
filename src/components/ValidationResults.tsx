import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, XCircle, ExternalLink, Info, AlertTriangle, ChevronRight, ChevronDown, Link as LinkIcon, Eye, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlatformBadge } from "@/components/ui/platform-badge";

import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface ValidationResultsProps {
  campaignGroups: CampaignGroup[];
  groupByPlatform?: boolean;
}

const getErrorTypeInfo = (errorType: ValidationErrors) => {
  switch (errorType) {
    case ValidationErrors.MISSING_UTM_FIELD:
      return { title: 'Missing UTM', description: 'The url_tags field is absent or empty', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-400' };
    case ValidationErrors.INCORRECT_UTM_FORMAT:
      return { title: 'Invalid Format', description: 'UTM parameters do not match required pattern', icon: <XCircle className="h-4 w-4" />, color: 'bg-destructive/10 border-destructive text-destructive' };
    case ValidationErrors.UTM_IN_LINK_URL:
      return { title: 'UTM in URL', description: 'UTM parameters found in destination URL (should be in url_tags)', icon: <ExternalLink className="h-4 w-4" />, color: 'bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400' };
    case ValidationErrors.CAMPAIGN_WITH_TRACKING_PARAMS:
      return { title: 'Campaign UTMs', description: 'Tracking parameters found at campaign level (should be at ad level)', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-400' };
    case ValidationErrors.ADGROUP_WITH_TRACKING_PARAMS:
      return { title: 'Ad Group UTMs', description: 'Tracking parameters found at ad group level (should be at ad level)', icon: <Info className="h-4 w-4" />, color: 'bg-accent border-accent-foreground/20 text-accent-foreground' };
    default:
      return { title: 'Unknown Error', description: 'Unknown validation error', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-muted border-border text-muted-foreground' };
  }
};

const getEffectiveParamsInfo = (ad: AdItem) => {
  let effectiveLevel = 'None';
  let effectiveParams = '';

  if (ad.trackParams.ad) {
    effectiveLevel = 'Ad Level';
    effectiveParams = ad.trackParams.ad;
  } else if (ad.trackParams.medium) {
    effectiveLevel = 'Ad Set Level';
    effectiveParams = ad.trackParams.medium;
  } else if (ad.trackParams.campaign) {
    effectiveLevel = 'Campaign Level';
    effectiveParams = ad.trackParams.campaign;
  } else if (ad.trackParams.account) {
    effectiveLevel = 'Account Level';
    effectiveParams = ad.trackParams.account;
  }

  const levelsWithParams = [
    ad.trackParams.ad && 'Ad',
    ad.trackParams.medium && 'Ad Set',
    ad.trackParams.campaign && 'Campaign',
    ad.trackParams.account && 'Account'
  ].filter(Boolean);

  return { effectiveLevel, effectiveParams, hasMultipleLevels: levelsWithParams.length > 1, allLevels: levelsWithParams };
};

const AdCard = ({ ad }: { ad: AdItem }) => {
  const getRecommendationInfo = () => ({
    title: 'Recommendation',
    description: 'For better consistency and management, it is recommended to set UTM parameters at the account level using a tracking template instead of at the ad, ad set, or campaign level.',
    icon: <Info className="h-4 w-4" />,
    color: 'bg-accent/10 border-accent text-accent-foreground'
  });

  const effectiveInfo = getEffectiveParamsInfo(ad);
  const recommendationInfo = getRecommendationInfo();
  const isError = !ad.isValid && ad.spend > 0;
  const isWarning = !ad.isValid && (ad.spend === 0 || ad.spend == null);
  const borderColor = ad.isValid ? "border-l-green-500" : isError ? "border-l-destructive" : "border-l-yellow-500";
  const cardOpacity = !ad.isActive ? "opacity-60" : "";

  return (
      <TooltipProvider>
        <Card className={`border-l-4 ${borderColor} mb-3 ${cardOpacity}`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{ad.adName}
                  {!ad.isActive && <Badge variant="outline" className="ml-2 bg-muted text-muted-foreground">Disabled</Badge>}
                  {(ad.spend === 0 || ad.spend == null) && ad.isActive && <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">No Spend</Badge>}
                </h4>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <span>Ad ID:</span><Badge variant="outline" className="text-xs font-mono bg-muted/50">{ad.adId}</Badge>
                  {ad.adsetId && <><span>•</span><span>Ad Set ID:</span><Badge variant="outline" className="text-xs font-mono bg-muted/50">{ad.adsetId}</Badge></>}
                  <span>•</span><span className="font-medium">Spend:</span><span className="font-mono text-foreground">{ad.spend != null  ? `R$${ad.spend?.toFixed(2)}`: "No known spend"}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {ad.preview_link && <a href={ad.preview_link} target="_blank" rel="noopener noreferrer" title="Preview Ad" className="text-muted-foreground hover:text-primary"><Eye className="h-4 w-4" /></a>}
                {ad.link && <a href={ad.link} target="_blank" rel="noopener noreferrer" title="Destination URL" className="text-muted-foreground hover:text-primary"><LinkIcon className="h-4 w-4" /></a>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Separator />
            <div className="space-y-2">
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1"><ExternalLink className="h-3 w-3" /><span className="font-medium">Ad Preview:</span></div>
                {ad.preview_link ? (<div className="mt-1 p-2 bg-muted/50 rounded overflow-hidden"><a href={ad.preview_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">{ad.preview_link}</a></div>) : (<div className="mt-1 p-2 bg-muted/50 rounded text-muted-foreground italic text-xs">No ad preview available for this ad</div>)}
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-1"><LinkIcon className="h-3 w-3" /><span className="font-medium">Destination URL:</span></div>
                  <pre className="mt-1 p-2 bg-muted/50 rounded text-xs break-all whitespace-pre-wrap">{ad.link || "No URL provided"}</pre>
                </div>
              </div>
              <div className="text-xs space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">UTM Parameters:</span>
                  {effectiveInfo.hasMultipleLevels && (
                      <Tooltip delayDuration={100}><TooltipTrigger><Badge variant="outline" className="text-xs bg-accent/50 border-accent text-accent-foreground cursor-help">Multiple Levels</Badge></TooltipTrigger>
                        <TooltipContent className="max-w-sm"><div className="space-y-2"><p className="font-medium">UTM Parameters found at:</p>
                          <ul className="text-xs space-y-1">{effectiveInfo.allLevels.map((level) => (<li key={level} className={effectiveInfo.effectiveLevel.includes(level) ? 'font-medium text-primary' : 'text-muted-foreground'}>• {level} {effectiveInfo.effectiveLevel.includes(level) && '(Effective)'}</li>))}</ul>
                          <p className="text-xs text-muted-foreground mt-2">Ad level parameters take priority over Ad Set, Campaign, and Account level parameters.</p></div></TooltipContent>
                      </Tooltip>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tooltip><TooltipTrigger>
                      <div className={`flex items-center gap-2 p-2 rounded-t-md cursor-help ${!ad.isValid ? 'bg-destructive/10 border-x border-t border-destructive' : 'bg-green-500/10 border-x border-t border-green-500'}`}>
                        <span className="font-semibold text-sm">{effectiveInfo.effectiveParams ? `Effective Parameters (${effectiveInfo.effectiveLevel})` : 'No UTM Parameters'}</span>
                        {ad.isValid ? <CheckCircle className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-destructive"/>}
                        {effectiveInfo.hasMultipleLevels && <Info className="h-3 w-3 text-accent-foreground" />}
                      </div>
                    </TooltipTrigger>
                      <TooltipContent className="max-w-md"><div className="space-y-2"><p className="font-medium">Parameter Hierarchy Details:</p>
                        {[{ level: 'Ad Level', params: ad.trackParams.ad, priority: 1 },{ level: 'Ad Set Level', params: ad.trackParams.medium, priority: 2 },{ level: 'Campaign Level', params: ad.trackParams.campaign, priority: 3 },{ level: 'Account Level', params: ad.trackParams.account, priority: 4 }].map(({ level, params, priority }) => (
                            <div key={level} className="text-xs"><div className={`flex items-center gap-2 ${params === effectiveInfo.effectiveParams ? 'font-medium text-primary' : 'text-muted-foreground'}`}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: params === effectiveInfo.effectiveParams ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }} /><span>{level} (Priority {priority})</span></div>
                              <div className="ml-4 mt-1">{params ? (<pre className="text-xs bg-muted/50 p-1 rounded break-all whitespace-pre-wrap max-w-xs">{params.length > 100 ? `${params.substring(0, 100)}...` : params}</pre>) : (<span className="text-muted-foreground italic">No parameters</span>)}</div>
                            </div>
                        ))}
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">The parameter with the highest priority (lowest number) is used as the effective parameter.</p></div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <pre className={`p-3 rounded-b-md text-xs break-all whitespace-pre-wrap ${!ad.isValid ? 'bg-destructive/10 border border-destructive' : 'bg-green-500/10 border border-green-500'}`}>{effectiveInfo.effectiveParams || "No UTM parameters found"}</pre>
                </div>
              </div>
              {ad.isValid && effectiveInfo.effectiveLevel !== 'Account Level' && effectiveInfo.effectiveParams && (
                  <Alert className={recommendationInfo.color}><div className="flex items-start"><div className="flex-shrink-0">{recommendationInfo.icon}</div><div className="ml-3"><h3 className="text-sm font-medium">{recommendationInfo.title}</h3><div className="mt-2 text-xs text-accent-foreground"><p>{recommendationInfo.description}</p></div></div></div></Alert>
              )}
              {!ad.isValid && (
                  <div className="text-xs space-y-1"><span className={`font-medium ${isError ? 'text-destructive' : 'text-yellow-700 dark:text-yellow-400'}`}>Issues Found:</span>
                    <ul className="list-disc pl-5 space-y-1">{ad.errorTypes.map((errorType, index) => { const info = getErrorTypeInfo(errorType); return (<li key={index} className="text-muted-foreground">{info.description}</li>); })}</ul>
                  </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
  );
};

interface CampaignGroupCardProps {
  campaignGroup: CampaignGroup;
}

const CampaignGroupCard = ({ campaignGroup }: CampaignGroupCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const validAdsInGroup = campaignGroup.ads.filter(ad => ad.isValid).length;
  const allAdsInOriginalGroupDisabled = campaignGroup.ads.every(ad => !ad.isActive);

  const sortedAds = [...campaignGroup.ads].sort((a, b) => {
    const aIsError = !a.isValid && a.spend > 0;
    const bIsError = !b.isValid && b.spend > 0;
    const aIsWarning = !a.isValid && (a.spend === 0 || a.spend == null);
    const bIsWarning = !b.isValid && (b.spend === 0 || b.spend == null);
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    if (aIsError !== bIsError) return aIsError ? -1 : 1;
    if (aIsWarning !== bIsWarning) return aIsWarning ? -1 : 1;
    if ((aIsError && bIsError) || (aIsWarning && bIsWarning)) {
      if (a.errorTypes.length !== b.errorTypes.length) return b.errorTypes.length - a.errorTypes.length;
    }
    return 0;
  });

  return (
      <Card className="mb-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {isOpen ? <ChevronDown className="h-5 w-5 mr-2" /> : <ChevronRight className="h-5 w-5 mr-2" />}
                  <div>
                    <CardTitle className="text-md font-medium flex items-center">{campaignGroup.campaignName}
                      <PlatformBadge platform={campaignGroup.platform} className="ml-2 px-2 py-0.5" iconClassName="w-4 h-4" />
                      {allAdsInOriginalGroupDisabled && (<Badge variant="outline" className="ml-2 bg-muted text-muted-foreground">Disabled</Badge>)}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>{campaignGroup.platform}</span><span>•</span><span className="font-medium">Campaign ID:</span>
                      <Badge variant="outline" className="text-xs font-mono bg-muted/50">{campaignGroup.campaignId}</Badge><span>•</span>
                      <span>{campaignGroup.adCount} ads</span><span>•</span><span className="font-medium">Spend:</span>
                      <span className="font-mono text-foreground">${campaignGroup.totalSpend?.toFixed(2) || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaignGroup.errorCount > 0 ? (<Badge variant="destructive">{campaignGroup.errorCount} {campaignGroup.errorCount === 1 ? 'error' : 'errors'}</Badge>) : (<Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500"><CheckCircle className="h-3 w-3 mr-1" />All Valid</Badge>)}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {isOpen && (<div className="mb-4 flex justify-between items-center"><div className="text-sm">{validAdsInGroup} of {campaignGroup.adCount} ads valid ({Math.round((validAdsInGroup/campaignGroup.adCount)*100)}%)</div></div>)}
              <div className="space-y-3">
                {sortedAds.map((ad) => (<AdCard key={ad.adId} ad={ad} />))}
                {sortedAds.length === 0 && (<div className="text-center py-6 text-muted-foreground">No ads match the current filters.</div>)}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
  );
};

export const ValidationResults = ({ campaignGroups, groupByPlatform }: ValidationResultsProps) => {

  const totalAds = campaignGroups.reduce((sum, group) => sum + group.ads.length, 0);

  if (totalAds === 0) {
    return (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">No Results Found</h3>
              <p className="text-muted-foreground">No ads match the current filters or search query.</p>
            </div>
          </CardContent>
        </Card>
    );
  }

  if (groupByPlatform) {
    const platformData = [
      { name: 'Facebook', campaigns: campaignGroups.filter(c => c.platform === 'Facebook') },
      { name: 'Google', campaigns: campaignGroups.filter(c => c.platform === 'Google') },
      { name: 'TikTok', campaigns: campaignGroups.filter(c => c.platform === 'TikTok') },
      { name: 'Pinterest', campaigns: campaignGroups.filter(c => c.platform === 'Pinterest') }
    ].map(p => ({
      ...p,
      totalAds: p.campaigns.reduce((sum, c) => sum + c.ads.length, 0),
      totalSpend: p.campaigns.reduce((sum, c) => sum + c.totalSpend, 0),
      totalErrors: p.campaigns.reduce((sum, c) => sum + c.errorCount, 0),
    }));

    return (
        <Tabs defaultValue="summary">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            {platformData.filter(p => p.totalAds > 0).map(platform => (
                <TabsTrigger key={platform.name} value={platform.name.toLowerCase()}>{platform.name}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="summary">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {platformData.map((platform) => (
                  <Card key={platform.name}>
                    <CardHeader><CardTitle className="flex items-center gap-2"><PlatformBadge platform={platform.name} />{platform.name}</CardTitle></CardHeader>
                    <CardContent>
                      {platform.totalAds === 0 ? (<div className="text-center py-4"><Badge variant="outline" className="bg-muted">No Data Available</Badge></div>) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center"><span className="text-sm">Ads:</span><span className="font-medium">{platform.totalAds}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm">Campaigns:</span><span className="font-medium">{platform.campaigns.length}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm">Total Spend:</span><span className="font-medium">${platform.totalSpend.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm">Errors:</span><Badge variant={platform.totalErrors > 0 ? "destructive" : "outline"}>{platform.totalErrors}</Badge></div>
                          </div>
                      )}
                    </CardContent>
                  </Card>
              ))}
            </div>
          </TabsContent>
          {platformData.filter(p => p.totalAds > 0).map(platform => (
              <TabsContent key={platform.name} value={platform.name.toLowerCase()}>
                <div className="space-y-4">
                  {platform.campaigns.map((campaign) => (<CampaignGroupCard key={`${platform.name}-${campaign.campaignId}`} campaignGroup={campaign} />))}
                </div>
              </TabsContent>
          ))}
        </Tabs>
    );
  }

  return (
      <div className="space-y-4">
        {campaignGroups.map((campaign) => (<CampaignGroupCard key={`${campaign.platform}-${campaign.campaignId}`} campaignGroup={campaign} />))}
      </div>
  );
};