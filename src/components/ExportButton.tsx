import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';
import {AdsConfigItem, AdsConfigsResult} from "@/types/AdsConfigItem.ts";

interface ExportButtonProps {
    data: AdsConfigsResult;
    dashboardName?: string;
}

export const ExportButton = ({ data, dashboardName }: ExportButtonProps) => {
    // A função de exportação agora aceita um parâmetro para filtrar por anúncios ativos
    const handleExport = (activeOnly: boolean) => {
        const exportRows = [];

        // Função auxiliar para evitar repetição de código
        const processAds = (ads: AdsConfigItem[], platformName: string) => {
            ads.forEach(ad => {
                // A condição agora verifica se o anúncio é inválido
                // E, se activeOnly for true, verifica também se o anúncio está ativo
                if (!ad.isTrackParamsValid && (!activeOnly || ad.isActive)) {
                    exportRows.push({
                        'Plataforma': platformName,
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
        };

        // Processa os anúncios de cada plataforma usando a função auxiliar
        processAds(data.facebook, 'Facebook');
        processAds(data.google, 'Google');
        processAds(data.tiktok, 'TikTok');
        processAds(data.pinterest, 'Pinterest');

        // Se não houver linhas para exportar, não faz nada
        if (exportRows.length === 0) {
            alert("Não há dados para exportar com os filtros selecionados.");
            return;
        }

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

        // Personaliza o nome do arquivo com base na opção escolhida
        const fileType = activeOnly ? 'ativos_invalidos' : 'todos_invalidos';
        const fileName = `validacao_utm_${dashboardName || 'relatorio'}_${fileType}_${new Date().toISOString().slice(0, 10)}.xlsx`;

        XLSX.writeFile(workbook, fileName);
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
                <DropdownMenuItem onClick={() => handleExport(false)}>
                    Exportar Todos os Inválidos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(true)}>
                    Exportar Apenas Ativos Inválidos
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};