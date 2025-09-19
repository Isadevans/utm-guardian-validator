import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { AdsConfigItem, AdsConfigsResult } from "@/types/AdsConfigItem.ts";

interface ExportButtonProps {
    data: AdsConfigsResult;
    dashboardName?: string;
}

export const ExportButton = ({ data, dashboardName }: ExportButtonProps) => {

    // Generates the data rows for export, reusable for both formats
    const generateExportData = () => {
        const exportRows = [];

        const processAds = (ads: AdsConfigItem[], platformName: string) => {
            if (!ads || ads.length === 0) return;

            ads.forEach(ad => {
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
                    'Parâmetros de UTM': effectiveTrackParams,
                    'Status': ad.isTrackParamsValid ? 'Válido' : 'Inválido',
                    'Gasto': ad.spend,
                    'Ativo': ad.isActive ? 'Sim' : 'Não',
                });
            });
        };

        processAds(data.facebook, 'Facebook');
        processAds(data.google, 'Google');
        processAds(data.tiktok, 'TikTok');
        processAds(data.pinterest, 'Pinterest');

        return exportRows;
    };

    // Handles the export to XLSX format
    const handleXlsxExport = () => {
        const exportRows = generateExportData();

        if (exportRows.length === 0) {
            alert("Não há dados para exportar com os filtros selecionados.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const colWidths = [
            { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 40 },
            { wch: 20 }, { wch: 40 }, { wch: 20 }, { wch: 50 },
            { wch: 50 }, { wch: 10 }, { wch: 15 }, { wch: 10 },
        ];
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Validação UTM");

        const fileName = `relatorio_utm_${dashboardName || 'export'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    // Handles the export to CSV format
    const handleCsvExport = () => {
        const exportRows = generateExportData();

        if (exportRows.length === 0) {
            alert("Não há dados para exportar com os filtros selecionados.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

        const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const fileName = `relatorio_utm_${dashboardName || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Relatório
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={handleXlsxExport}>
                    Exportar como XLSX (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCsvExport}>
                    Exportar como CSV
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};