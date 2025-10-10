import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const UtmTemplate = ({
                         title,
                         link,
                     }: {
    title: string;
    link: string;
}) => {
    return (
        <Card className="mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
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
            />
            <UtmTemplate
                title="Configuração de UTMs - Google Ads"
                link="https://docs.nemu.com.br/pages/onboarding/configuracao-utms/google/google"
            />
            <UtmTemplate
                title="Configuração de UTMs - TikTok Ads"
                link="https://docs.nemu.com.br/pages/onboarding/configuracao-utms/tiktok/tiktok"
            />
        </div>
    );
};
