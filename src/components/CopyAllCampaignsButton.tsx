import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CampaignGroup {
  campaignName: string;
  campaignId: string;
  platform: string;
}

interface CopyAllCampaignsButtonProps {
  campaignGroups: CampaignGroup[];
}

export const CopyAllCampaignsButton = ({ campaignGroups }: CopyAllCampaignsButtonProps) => {
  const { toast } = useToast();

  const handleCopyAllCampaigns = async () => {
    if (campaignGroups.length === 0) {
      toast({
        title: "Nenhuma campanha",
        description: "Não há campanhas para copiar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Agrupar campanhas por plataforma
      const campaignsByPlatform: Record<string, CampaignGroup[]> = {};
      campaignGroups.forEach(campaign => {
        if (!campaignsByPlatform[campaign.platform]) {
          campaignsByPlatform[campaign.platform] = [];
        }
        campaignsByPlatform[campaign.platform].push(campaign);
      });

      // Formatar lista separada por plataforma
      const platformList = Object.keys(campaignsByPlatform).map(platform => {
        const platformCampaigns = campaignsByPlatform[platform];
        const campaigns = platformCampaigns.map(
          campaign => `${campaign.campaignName} (${campaign.campaignId})`
        ).join('\n');
        return `${platform}:\n${campaigns}`;
      });

      const campaignList = platformList.join('\n\n');
      
      await navigator.clipboard.writeText(campaignList);
      toast({
        title: "Copiado!",
        description: `${campaignGroups.length} campanha(s) copiada(s) para a área de transferência`,
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar as campanhas",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAllCampaigns}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar campanhas e IDs (por plataforma)
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copiar todas as campanhas com seus IDs separadas por plataforma</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

