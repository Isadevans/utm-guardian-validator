import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { AdsConfigItem, AdsConfigsResult } from "@/types/AdsConfigItem.ts";

interface ExportButtonProps {
    data: AdsConfigsResult;
    dashboardName?: string;
}

export const ExportButton = ({ data, dashboardName }: ExportButtonProps) => {

    const handleExport = () => {
        const exportRows = [];

        // Helper function to process ads from a given platform
        const processAds = (ads: AdsConfigItem[], platformName: string) => {
            if (!ads || ads.length === 0) {
                return;
            }

            ads.forEach(ad => {
                // Determine the effective tracking parameters, similar to ValidationResults
                const effectiveTrackParams = ad.ad?.trackParams || ad.medium?.trackParams || ad.campaign?.trackParams || ad.account?.trackParams || ad.trackParams || "N/A";

                exportRows.push({
                    'Plataforma': platformName,
                    'Nome da Campanha': ad.campaign.name,
                    'ID da Campanha': ad.campaign.id,
                    'Nome do Conjunto de Anúncios': ad.medium.name,
                    'ID do Conjunto de Anúncios': ad.medium.id,
                    'Nome do Anúncio': ad.ad.name,
                    'ID do Anúncio': ad.ad.id,
                    'URL de Destino': ad.link,
                    'Parâmetros UTM': effectiveTrackParams,
                    'Status': ad.isTrackParamsValid ? 'Válido' : 'Inválido',
                    'Gasto': ad.spend,
                    'Ativo': ad.isActive ? 'Sim' : 'Não',
                });
            });
        };

        // Process ads from all platforms provided in the filtered data prop
        processAds(data.facebook, 'Facebook');
        processAds(data.google, 'Google');
        processAds(data.tiktok, 'TikTok');
        processAds(data.pinterest, 'Pinterest');

        // If no rows to export (due to filters), show an alert and stop.
        if (exportRows.length === 0) {
            alert("Não há dados para exportar com os filtros selecionados.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(exportRows);

        // Set column widths for better readability
        const colWidths = [
            { wch: 15 },  // Plataforma
            { wch: 40 },  // Nome da Campanha
            { wch: 20 },  // ID da Campanha
            { wch: 40 },  // Nome do Conjunto de Anúncios
            { wch: 20 },  // ID do Conjunto de Anúncios
            { wch: 40 },  // Nome do Anúncio
            { wch: 20 },  // ID do Anúncio
            { wch: 50 },  // URL de Destino
            { wch: 50 },  // Parâmetros UTM Efetivos
            { wch: 10 },  // Status
            { wch: 15 },  // Gasto
            { wch: 10 },  // Ativo
        ];
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Validação UTM");

        // Generate a dynamic file name
        const fileName = `relatorio_utm_${dashboardName || 'export'}_${new Date().toISOString().slice(0, 10)}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    };

    return (
        <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Relatório
        </Button>
    );
};