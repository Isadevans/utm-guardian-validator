import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { PlatformBadge } from "@/components/ui/platform-badge";

const UtmTemplate = ({
                         title,
                         link,
                         platform,
                     }: {
    title: string;
    link: string;
    platform: string;
}) => {
    return (
        <Card className="mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <PlatformBadge platform={platform} />
                    <CardTitle className="text-lg font-medium">{title}</CardTitle>
                </div>
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                    <ExternalLink className="h-4 w-4" />
                    Abrir documentação
                </a>
            </CardHeader>
        </Card>
    );
};

export const UtmTemplates = () => {
    return (
        <div className="space-y-4">
            <UtmTemplate
                title="Configuração de UTMs - Meta (Facebook/Instagram)"
                link="https://docs.nemu.com.br/pages/onboarding/configuracao-utms/facebook/facebook"
                platform="facebook"
            />
            <UtmTemplate
                title="Configuração de UTMs - Google Ads"
                link="https://docs.nemu.com.br/pages/onboarding/configuracao-utms/google/google"
                platform="google"
            />
            <UtmTemplate
                title="Configuração de UTMs - TikTok Ads"
                link="https://docs.nemu.com.br/pages/onboarding/configuracao-utms/tiktok/tiktok"
                platform="tiktok"
            />
        </div>
    );
};
