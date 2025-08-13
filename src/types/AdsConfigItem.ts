export interface AdsConfigItem {
    account: Account
    campaign: Campaign
    medium: Medium
    ad: Ad
    link: string
    preview_link?: string; // Added preview_link to the main interface
    isLinkWithoutUtms: boolean
    isTrackParamsValid: boolean
    trackParams?:string
    messages: string[]
}

export interface Account {
    trackParams: string
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
}

// This interface defines the shape of the entire validation payload
export interface AdsConfigsResult {
    facebook: AdsConfigItem[];
    google: AdsConfigItem[];
    tiktok: AdsConfigItem[];
    pinterest: AdsConfigItem[];
}

// Props for the ValidationSummary component
export interface ValidationSummaryProps {
    data: AdsConfigsResult;
}