import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';
import {AdsConfigsResult} from "@/types/AdsConfigItem.ts";

interface ExportButtonProps {
    data: AdsConfigsResult;
    dashboardName?: string;
}

export const ExportButton = ({ data, dashboardName }: ExportButtonProps) => {
    const handleExport = () => {
        // Prepare data for export
        const exportRows = [];

        // Process Facebook ads
        data.facebook.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    Platform: 'Facebook',
                    'Campaign Name': ad.campaign.name,
                    'Campaign ID': ad.campaign.id,
                    'Ad Set Name': ad.medium.name,
                    'Ad Set ID': ad.medium.id,
                    'Ad Name': ad.ad.name,
                    'Ad ID': ad.ad.id,
                    'Destination URL': ad.link,
                    'UTM Parameters': ad.account?.trackParams,
                    'Status': 'Invalid',
                });
            }
        });

        // Process Google ads - only invalid ones
        data.google.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    Platform: 'Google',
                    'Campaign Name': ad.campaign.name,
                    'Campaign ID': ad.campaign.id,
                    'Ad Set Name': ad.medium.name,
                    'Ad Set ID': ad.medium.id,
                    'Ad Name': ad.ad.name,
                    'Ad ID': ad.ad.id,
                    'Destination URL': ad.link,
                    'UTM Parameters': ad.account?.trackParams,
                    'Status': 'Invalid',
                });
            }
        });

        // Process TikTok ads - only invalid ones
        data.tiktok.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    Platform: 'TikTok',
                    'Campaign Name': ad.campaign.name,
                    'Campaign ID': ad.campaign.id,
                    'Ad Set Name': ad.medium.name,
                    'Ad Set ID': ad.medium.id,
                    'Ad Name': ad.ad.name,
                    'Ad ID': ad.ad.id,
                    'Destination URL': ad.link,
                    'UTM Parameters': ad.account?.trackParams,
                    'Status': 'Invalid',
                });
            }
        });

        // Process Pinterest ads - only invalid ones
        data.pinterest.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    Platform: 'Pinterest',
                    'Campaign Name': ad.campaign.name,
                    'Campaign ID': ad.campaign.id,
                    'Ad Set Name': ad.medium.name,
                    'Ad Set ID': ad.medium.id,
                    'Ad Name': ad.ad.name,
                    'Ad ID': ad.ad.id,
                    'Destination URL': ad.link,
                    'UTM Parameters': ad.account?.trackParams,
                    'Status': 'Invalid',
                });
            }
        });

        // Rest of the function remains unchanged
        const worksheet = XLSX.utils.json_to_sheet(exportRows);

        const colWidths = [
            { wch: 10 },  // Platform
            { wch: 40 },  // Campaign Name
            { wch: 15 },  // Campaign ID
            { wch: 25 },  // Ad Set Name
            { wch: 15 },  // Ad Set ID
            { wch: 30 },  // Ad Name
            { wch: 15 },  // Ad ID
            { wch: 40 },  // Destination URL
            { wch: 40 },  // UTM Parameters
            { wch: 10 },  // Status
            { wch: 40 },  // Issues
        ];
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "UTM Validation");

        const fileName = `utm_validation_${dashboardName || 'report'}_${new Date().toISOString().slice(0, 10)}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    };

    return (
        <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2"
        >
            <Download className="h-4 w-4" />
            Export to Excel
        </Button>
    );
};