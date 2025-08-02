import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { AdsConfigsResult } from "@/pages/Index";

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
                    'Campaign Name': ad.campaignName,
                    'Campaign ID': ad.campaignId,
                    'Ad Set Name': ad.mediumName,
                    'Ad Set ID': ad.mediumId,
                    'Ad Name': ad.adName,
                    'Ad ID': ad.adId,
                    'Destination URL': ad.link,
                    'UTM Parameters': ad.trackParams,
                    'Status': 'Invalid',
                });
            }
        });

        // Process Google ads - only invalid ones
        data.google.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    Platform: 'Google',
                    'Campaign Name': ad.campaignName,
                    'Campaign ID': ad.campaignId,
                    'Ad Set Name': ad.mediumName, // Using Ad Set naming consistently
                    'Ad Set ID': ad.mediumId,
                    'Ad Name': ad.adName,
                    'Ad ID': ad.adId,
                    'Destination URL': ad.link,
                    'UTM Parameters': ad.trackParams,
                    'Status': 'Invalid',
                });
            }
        });

        // Process TikTok ads - only invalid ones
        data.tiktok.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    Platform: 'TikTok',
                    'Campaign Name': ad.campaignName,
                    'Campaign ID': ad.campaignId,
                    'Ad Set Name': ad.mediumName,
                    'Ad Set ID': ad.mediumId,
                    'Ad Name': ad.adName,
                    'Ad ID': ad.adId,
                    'Destination URL': ad.link,
                    'UTM Parameters': ad.trackParams,
                    'Status': 'Invalid',
                });
            }
        });

        // Process Pinterest ads - only invalid ones
        data.pinterest.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    Platform: 'Pinterest',
                    'Campaign Name': ad.campaignName,
                    'Campaign ID': ad.campaignId,
                    'Ad Set Name': ad.mediumName,
                    'Ad Set ID': ad.mediumId,
                    'Ad Name': ad.adName,
                    'Ad ID': ad.adId,
                    'Destination URL': ad.link,
                    'UTM Parameters': ad.trackParams,
                    'Status': 'Invalid',
                });
            }
        });
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportRows);

        // Create column widths
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

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "UTM Validation");

        // Generate filename
        const fileName = `utm_validation_${dashboardName || 'report'}_${new Date().toISOString().slice(0, 10)}.xlsx`;

        // Export
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