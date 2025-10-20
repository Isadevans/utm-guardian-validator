export interface AdsConfigItem {
    account: Account
    campaign: Campaign
    medium: Medium
    ad: Ad
    link: string
    preview_link?: string; // Added preview_link to the main interface
    isLinkWithoutUtms: boolean
    isTrackParamsValid?: boolean
    spend: number
    isActive: boolean
    trackParams?: string
    messages: string[]

}

export interface Account {
    trackParams?: string
    suffix: string
}

export interface Campaign {
    name: string
    id: string
    trackParams?: string
    suffix: string
}

export interface Medium {
    name: string
    id: string
    trackParams?: string
    suffix: string
}

export interface Ad {
    name: string
    id: string
    trackParams?: string
    suffix: string
    status?: string
// New interface representing a platform block that contains the recommended utms and an array of items
export interface AdsPlatformConfig {
    recommendedUtms: string
    configs: AdsConfigItem[]
}

// This interface defines the shape of the entire validation payload
export interface AdsConfigsResult {
    facebook: AdsPlatformConfig;
    google: AdsPlatformConfig;
    tiktok: AdsPlatformConfig;
    pinterest: AdsPlatformConfig;
}

// Props for the ValidationSummary component
export interface ValidationSummaryProps {
    data: AdsConfigsResult;
}