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
        // Prepara os dados para a exportação
        const exportRows = [];

        // Processa anúncios do Facebook
        data.facebook.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    'Plataforma': 'Facebook',
                    'Nome da Campanha': ad.campaign.name,
                    'ID da Campanha': ad.campaign.id,
                    'Nome do Conjunto de Anúncios': ad.medium.name,
                    'ID do Conjunto de Anúncios': ad.medium.id,
                    'Nome do Anúncio': ad.ad.name,
                    'ID do Anúncio': ad.ad.id,
                    'URL de Destino': ad.link,
                    'Parâmetros UTM': ad.account?.trackParams,
                    'Status': 'Inválido',
                    'Gasto': ad.spend,
                    'Ativo': ad.isActive,
                });
            }
        });

        // Processa anúncios do Google - apenas os inválidos
        data.google.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    'Plataforma': 'Google',
                    'Nome da Campanha': ad.campaign.name,
                    'ID da Campanha': ad.campaign.id,
                    'Nome do Conjunto de Anúncios': ad.medium.name,
                    'ID do Conjunto de Anúncios': ad.medium.id,
                    'Nome do Anúncio': ad.ad.name,
                    'ID do Anúncio': ad.ad.id,
                    'URL de Destino': ad.link,
                    'Parâmetros UTM': ad.account?.trackParams,
                    'Status': 'Inválido',
                    'Gasto': ad.spend,
                    'Ativo': ad.isActive,
                });
            }
        });

        // Processa anúncios do TikTok - apenas os inválidos
        data.tiktok.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    'Plataforma': 'TikTok',
                    'Nome da Campanha': ad.campaign.name,
                    'ID da Campanha': ad.campaign.id,
                    'Nome do Conjunto de Anúncios': ad.medium.name,
                    'ID do Conjunto de Anúncios': ad.medium.id,
                    'Nome do Anúncio': ad.ad.name,
                    'ID do Anúncio': ad.ad.id,
                    'URL de Destino': ad.link,
                    'Parâmetros UTM': ad.account?.trackParams,
                    'Status': 'Inválido',
                    'Gasto': ad.spend,
                    'Ativo': ad.isActive,
                });
            }
        });

        // Processa anúncios do Pinterest - apenas os inválidos
        data.pinterest.forEach(ad => {
            if (!ad.isTrackParamsValid) {
                exportRows.push({
                    'Plataforma': 'Pinterest',
                    'Nome da Campanha': ad.campaign.name,
                    'ID da Campanha': ad.campaign.id,
                    'Nome do Conjunto de Anúncios': ad.medium.name,
                    'ID do Conjunto de Anúncios': ad.medium.id,
                    'Nome do Anúncio': ad.ad.name,
                    'ID do Anúncio': ad.ad.id,
                    'URL de Destino': ad.link,
                    'Parâmetros UTM': ad.account?.trackParams,
                    'Status': 'Inválido',
                    'Gasto': ad.spend,
                    'Ativo': ad.isActive,
                });
            }
        });

        // O resto da função permanece inalterado
        const worksheet = XLSX.utils.json_to_sheet(exportRows);

        const colWidths = [
            { wch: 15 },  // Plataforma
            { wch: 40 },  // Nome da Campanha
            { wch: 20 },  // ID da Campanha
            { wch: 40 },  // Nome do Conjunto de Anúncios
            { wch: 20 },  // ID do Conjunto de Anúncios
            { wch: 40 },  // Nome do Anúncio
            { wch: 20 },  // ID do Anúncio
            { wch: 50 },  // URL de Destino
            { wch: 50 },  // Parâmetros UTM
            { wch: 10 },  // Status
            { wch: 15 },  // Gasto
            { wch: 10 },  // Ativo
        ];
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Validação UTM");

        const fileName = `validacao_utm_${dashboardName || 'relatorio'}_${new Date().toISOString().slice(0, 10)}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    };

    return (
        <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2"
        >
            <Download className="h-4 w-4" />
            Exportar para Excel
        </Button>
    );
};