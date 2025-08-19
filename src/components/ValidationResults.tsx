import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, XCircle, ExternalLink, Info, AlertTriangle, ChevronRight, ChevronDown, Link as LinkIcon, Eye } from "lucide-react";
import { ExportButton } from "./ExportButton";

import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {AdsConfigItem, AdsConfigsResult} from "@/types/AdsConfigItem.ts";

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
  trackParams: {
    final?: string;
    ad?: string;
    medium?: string;
    campaign?: string;
    account?: string;
  };
  link?: string;
  preview_link?: string;
  errorTypes: ValidationErrors[];
  isValid: boolean;
}

interface CampaignGroup {
  campaignName: string;
  campaignId: string;
  platform: string;
  ads: AdItem[];
  errorCount: number;
  adCount: number;
}

interface ValidationResultsProps {
  data: AdsConfigsResult;
  showErrorsOnly?: boolean;
  groupByPlatform?: boolean;
}

const getErrorTypeInfo = (errorType: ValidationErrors) => {
  switch (errorType) {
    case ValidationErrors.MISSING_UTM_FIELD:
      return {
        title: 'Missing UTM',
        description: 'The url_tags field is absent or empty',
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'bg-yellow-100 border-yellow-300 text-yellow-800'
      };
    case ValidationErrors.INCORRECT_UTM_FORMAT:
      return {
        title: 'Invalid Format',
        description: 'UTM parameters do not match required pattern',
        icon: <XCircle className="h-4 w-4" />,
        color: 'bg-red-100 border-red-300 text-red-800'
      };
    case ValidationErrors.UTM_IN_LINK_URL:
      return {
        title: 'UTM in URL',
        description: 'UTM parameters found in destination URL (should be in url_tags)',
        icon: <ExternalLink className="h-4 w-4" />,
        color: 'bg-orange-100 border-orange-300 text-orange-800'
      };
    case ValidationErrors.CAMPAIGN_WITH_TRACKING_PARAMS:
      return {
        title: 'Campaign UTMs',
        description: 'Tracking parameters found at campaign level (should be at ad level)',
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'bg-purple-100 border-purple-300 text-purple-800'
      };
    case ValidationErrors.ADGROUP_WITH_TRACKING_PARAMS:
      return {
        title: 'Ad Group UTMs',
        description: 'Tracking parameters found at ad group level (should be at ad level)',
        icon: <Info className="h-4 w-4" />,
        color: 'bg-blue-100 border-blue-300 text-blue-800'
      };
    default:
      return {
        title: 'Unknown Error',
        description: 'Unknown validation error',
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'bg-gray-100 border-gray-300 text-gray-800'
      };
  }
};

const AdCard = ({ ad }: { ad: AdItem }) => {

  const borderColor = ad.isValid
      ? "border-l-green-500"
      : "border-l-red-500";

  return (
      <Card className={`border-l-4 ${borderColor} mb-3`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                {ad.adName}
                <Badge variant="outline" className="text-xs ml-1 font-mono bg-gray-100">
                  {ad.adId}
                </Badge>
                {ad.isValid && (
                    <Badge className="bg-green-100 text-green-800 ml-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                )}
              </CardTitle>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">

                {ad.adsetName && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Ad Set:</span>
                      <span>{ad.adsetName}</span>
                      {ad.adsetId && (
                          <Badge variant="outline" className="text-xs ml-1 font-mono bg-gray-50">
                            {ad.adsetId}
                          </Badge>
                      )}
                    </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 justify-end">
              {!ad.isValid && ad.errorTypes.map((errorType, index) => {
                const info = getErrorTypeInfo(errorType);
                return (
                    <Badge key={index} className={info.color} variant="outline">
                      {info.icon}
                      <span className="ml-1">{info.title}</span>
                    </Badge>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Separator />

          <div className="space-y-2">

            {/* Ad Preview Section */}
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                <span className="font-medium">Ad Preview:</span>
              </div>
              {ad.preview_link ? (
                  <div className="mt-1 p-2 bg-gray-50 rounded overflow-hidden">
                    <a
                        href={ad.preview_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      {ad.preview_link}
                    </a>
                  </div>
              ) : (
                  <div className="mt-1 p-2 bg-gray-50 rounded text-gray-500 italic text-xs">
                    No ad preview available for this ad
                  </div>
              )}
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  <span className="font-medium">Destination URL:</span>
                </div>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs break-all whitespace-pre-wrap">
                {ad.link || "No URL provided"}
              </pre>
              </div>

            </div>

            <div className="text-xs space-y-3">
              <span className="font-medium">UTM Parameters Breakdown:</span>

              <div>
                <div className={`flex items-center gap-2 p-2 rounded-t-md ${!ad.isValid ? 'bg-red-100 border-x border-t border-red-200' : 'bg-green-100 border-x border-t border-green-200'}`}>
                  <span className="font-semibold">
                    Final Effective Parameters
                  </span>
                  {ad.isValid ? <CheckCircle className="h-4 w-4 text-green-700"/> : <XCircle className="h-4 w-4 text-red-700"/>}
                </div>
                <pre className={`p-2 rounded-b-md text-xs break-all whitespace-pre-wrap ${!ad.isValid ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  {ad.trackParams.final || "No UTM parameters found"}
                </pre>
              </div>

              <div className="space-y-2 pt-2">
                {[
                  { level: 'Ad', params: ad.trackParams.ad },
                  { level: 'Ad Set', params: ad.trackParams.medium },
                  { level: 'Campaign', params: ad.trackParams.campaign },
                  { level: 'Account', params: ad.trackParams.account },
                ]
                    .filter(item => item.params) // Only show levels that have params
                    .map(({ level, params }) => (
                        <div key={level}>
                          <span className="font-semibold text-gray-600">{level} Level Parameters:</span>
                          <pre className="mt-1 p-2 bg-gray-50 rounded text-xs break-all whitespace-pre-wrap border border-gray-200">
                      {params}
                    </pre>
                        </div>
                    ))}
              </div>
            </div>

            {!ad.isValid && (
                <div className="text-xs space-y-1">
                  <span className="font-medium text-red-600">Issues:</span>
                  <ul className="list-disc pl-5 space-y-1">
                    {ad.errorTypes.map((errorType, index) => {
                      const info = getErrorTypeInfo(errorType);
                      return (
                          <li key={index} className="text-muted-foreground">
                            {info.description}
                          </li>
                      );
                    })}
                  </ul>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
  );
};

const CampaignGroupCard = ({ campaignGroup }: { campaignGroup: CampaignGroup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const validAds = campaignGroup.ads.filter(ad => ad.isValid).length;

  const sortedAds = [...campaignGroup.ads].sort((a, b) => {
    // Invalid ads before valid ones
    if (a.isValid !== b.isValid) {
      return a.isValid ? 1 : -1;
    }

    // For invalid ads, sort by number of errors (descending)
    if (!a.isValid && !b.isValid) {
      return b.errorTypes.length - a.errorTypes.length;
    }

    return 0; // Maintain original order for ads with same status and error count
  });

  const displayAds = showOnlyErrors
      ? sortedAds.filter(ad => !ad.isValid)
      : sortedAds;
  return (
      <Card className="mb-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 cursor-pointer hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {isOpen ? <ChevronDown className="h-5 w-5 mr-2" /> : <ChevronRight className="h-5 w-5 mr-2" />}
                  <div>
                    <CardTitle className="text-md font-medium flex items-center">
                      {campaignGroup.campaignName}
                      <div className={`w-3 h-3 rounded-full ml-2 ${getPlatformColor(campaignGroup.platform)}`} />
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>{campaignGroup.platform}</span>
                      <span>•</span>
                      <span className="font-medium">Campaign ID:</span>
                      <Badge variant="outline" className="text-xs font-mono bg-gray-50">
                        {campaignGroup.campaignId}
                      </Badge>
                      <span>•</span>
                      <span>{campaignGroup.adCount} ads</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaignGroup.errorCount > 0 ? (
                      <Badge variant="destructive">
                        {campaignGroup.errorCount} {campaignGroup.errorCount === 1 ? 'error' : 'errors'}
                      </Badge>
                  ) : (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        All Valid
                      </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {isOpen && (
                  <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm">
                      {validAds} of {campaignGroup.adCount} ads valid ({Math.round((validAds/campaignGroup.adCount)*100)}%)
                    </div>
                    <div className="flex items-center">
                      <label className="text-sm flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showOnlyErrors}
                            onChange={() => setShowOnlyErrors(!showOnlyErrors)}
                            className="mr-2"
                        />
                        Show only errors
                      </label>
                    </div>
                  </div>
              )}
              <div className="space-y-3">
                {displayAds.map((ad) => (
                    <AdCard key={ad.adId} ad={ad} />
                ))}
                {displayAds.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      No ads with errors found in this campaign
                    </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
  );
};

const getPlatformColor = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case 'facebook': return 'bg-blue-500';
    case 'google': return 'bg-red-500';
    case 'tiktok': return 'bg-gray-900';
    case 'pinterest': return 'bg-red-600';
    default: return 'bg-gray-500';
  }
};

const processAdsData = (items: AdsConfigItem[], platform: string): CampaignGroup[] => {
  // First group items by campaign
  const campaignMap: Record<string, {
    campaignName: string,
    campaignId: string,
    ads: Record<string, AdItem>
  }> = {};

  // Process each ad to group by campaign
  items.forEach(item => {
    // Create campaign group if it doesn't exist
    if (!campaignMap[item.campaign.id]) {
      campaignMap[item.campaign.id] = {
        campaignName: item.campaign.name,
        campaignId: item.campaign.id,
        ads: {}
      };
    }

    // Create ad entry within the campaign group
    if (!campaignMap[item.campaign.id].ads[item.ad.id]) {
      const isValid = item.isTrackParamsValid && (!item.messages || item.messages.length === 0);

      campaignMap[item.campaign.id].ads[item.ad.id] = {
        adId: item.ad.id,
        adName: item.ad.name,
        platform: platform,
        campaignName: item.campaign.name,
        campaignId: item.campaign.id,
        adsetName: item.medium.name,
        adsetId: item.medium.id,
        trackParams: {
          final: item.trackParams,
          ad: item.ad?.trackParams,
          medium: item.medium?.trackParams,
          campaign: item.campaign?.trackParams,
          account: item.account?.trackParams,
        },
        preview_link: item.preview_link,
        link: item.link ,
        errorTypes: item.messages as ValidationErrors[] || [],
        isValid: isValid
      };
    }
  });

  // Convert to array format and calculate counts
  return Object.values(campaignMap).map(campaign => {
    const ads = Object.values(campaign.ads);
    const errorCount = ads.filter(ad => !ad.isValid).length;

    return {
      campaignName: campaign.campaignName,
      campaignId: campaign.campaignId,
      platform: platform,
      ads: ads,
      errorCount: errorCount,
      adCount: ads.length
    };
  });
};
export const ValidationResults = ({ data, showErrorsOnly, groupByPlatform }: ValidationResultsProps) => {
  // Group ads by campaign for each platform
  const facebookCampaigns = Array.isArray(data.facebook) ? processAdsData(data.facebook, 'Facebook') : [];
  const googleCampaigns = Array.isArray(data.google) ? processAdsData(data.google, 'Google') : [];
  const tiktokCampaigns = Array.isArray(data.tiktok) ? processAdsData(data.tiktok, 'TikTok') : [];
  const pinterestCampaigns = Array.isArray(data.pinterest) ? processAdsData(data.pinterest, 'Pinterest') : [];

  // Combine all campaign groups
  const allCampaignGroups = [...facebookCampaigns, ...googleCampaigns, ...tiktokCampaigns, ...pinterestCampaigns].sort((a,b)=>{
    if (a.errorCount !== b.errorCount) {
      return b.errorCount - a.errorCount;
    }

    // If error count is the same, sort alphabetically
    return a.campaignName.localeCompare(b.campaignName)
  });

  // Calculate total ads and errors across all campaigns
  const totalAds = allCampaignGroups.reduce((sum, group) => sum + group.adCount, 0);
  const totalErrors = allCampaignGroups.reduce((sum, group) => sum + group.errorCount, 0);
  const isValid = totalErrors === 0;

  // Platform data for summary
  const platformData = [
    { name: 'Facebook', campaigns: facebookCampaigns, isEmpty: !data.facebook || data.facebook.length === 0 },
    { name: 'Google', campaigns: googleCampaigns, isEmpty: !data.google || data.google.length === 0 },
    { name: 'TikTok', campaigns: tiktokCampaigns, isEmpty: !data.tiktok || data.tiktok.length === 0 },
    { name: 'Pinterest', campaigns: pinterestCampaigns, isEmpty: !data.pinterest || data.pinterest.length === 0 }
  ];

  // Count platforms with no data
  const emptyPlatforms = platformData.filter(p => p.isEmpty).length;
  const hasSomeData = totalAds > 0;

  // If showing errors only and there are none, display success message
  if (showErrorsOnly && isValid && hasSomeData) {
    return (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-medium">No Errors Found</h3>
              <p className="text-muted-foreground">All UTM configurations are valid!</p>
            </div>
          </CardContent>
        </Card>
    );
  }

  // If no data at all
  if (!hasSomeData) {
    return (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="text-lg font-medium">No Ads Available</h3>
              <p className="text-muted-foreground">
                {emptyPlatforms === platformData.length
                    ? "No ads found across any platforms."
                    : "Some platforms have no ads available for validation."}
              </p>
            </div>
          </CardContent>
        </Card>
    );
  }

  // If grouping by platform, organize campaigns by their platform
  if (groupByPlatform) {
    return (
        <Tabs defaultValue="summary">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            {platformData.filter(p => !p.isEmpty).map(platform => (
                <TabsTrigger key={platform.name} value={platform.name.toLowerCase()}>
                  {platform.name}
                </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="summary">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {platformData.map((platform) => (
                  <Card key={platform.name}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPlatformColor(platform.name)}`} />
                        {platform.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {platform.isEmpty ? (
                          <div className="text-center py-4">
                            <Badge variant="outline" className="bg-gray-100">No Data Available</Badge>
                          </div>
                      ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Ads:</span>
                              <span className="font-medium">
                          {platform.campaigns.reduce((sum, c) => sum + c.adCount, 0)}
                        </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Campaigns:</span>
                              <span className="font-medium">{platform.campaigns.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Errors:</span>
                              <Badge variant={platform.campaigns.some(c => c.errorCount > 0) ? "destructive" : "outline"}>
                                {platform.campaigns.reduce((sum, c) => sum + c.errorCount, 0)}
                              </Badge>
                            </div>
                          </div>
                      )}
                    </CardContent>
                  </Card>
              ))}
            </div>
          </TabsContent>

          {platformData.filter(p => !p.isEmpty).map(platform => (
              <TabsContent key={platform.name} value={platform.name.toLowerCase()}>
                <div className="space-y-4">
                  {platform.campaigns.length > 0 ? (
                      platform.campaigns.map((campaign) => (
                          <CampaignGroupCard key={`${platform.name}-${campaign.campaignId}`} campaignGroup={campaign} />
                      ))
                  ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        No data available for {platform.name}
                      </div>
                  )}
                </div>
              </TabsContent>
          ))}
        </Tabs>
    );
  }

  // Default view: show all campaigns regardless of platform
  return (
      <div className="space-y-4">
        <div className="flex justify-end mb-2">
          <ExportButton data={data} />
        </div>
        {isValid ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All UTM configurations are valid! {totalAds} ads checked with no issues.
              </AlertDescription>
            </Alert>
        ) : null}

        {/* Empty platforms summary */}
        {emptyPlatforms > 0 && (
            <Alert className="border-gray-200 bg-gray-50">
              <Info className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-gray-800">
                {emptyPlatforms === 1
                    ? `One platform has no ads available.`
                    : `${emptyPlatforms} platforms have no ads available.`}
                {platformData.filter(p => p.isEmpty).map(p => p.name).join(', ')}
              </AlertDescription>
            </Alert>
        )}

        <div className="space-y-4">
          {allCampaignGroups.map((campaign) => (
              <CampaignGroupCard key={`${campaign.platform}-${campaign.campaignId}`} campaignGroup={campaign} />
          ))}
        </div>
      </div>
  );
};