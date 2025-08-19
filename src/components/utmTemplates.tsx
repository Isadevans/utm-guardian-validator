import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCopy } from 'lucide-react';
import { useState } from 'react';

const UtmTemplate = ({ title, template }: { title: string, template: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(template);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    };

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative p-3 bg-gray-100 rounded-md">
          <pre className="text-sm whitespace-pre-wrap break-all">
            {template}
          </pre>
                    <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-1.5 bg-gray-200 hover:bg-gray-300 rounded-md"
                        title="Copy to clipboard"
                    >
                        <ClipboardCopy className="h-4 w-4 text-gray-700" />
                    </button>
                    {copied && (
                        <div className="absolute top-10 right-2 text-xs bg-green-500 text-white px-2 py-1 rounded-md">
                            Copied!
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export const UtmTemplates = () => {
    return (
        <Tabs defaultValue="meta">
            <TabsList className="mb-4">
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>

            {/* Meta Tab */}
            <TabsContent value="meta">
                <UtmTemplate
                    title="Meta para outras plataformas"
                    template="nemu_source=facebook&nemu_campaign={{campaign.name}}|{{campaign.id}}&nemu_medium={{adset.name}}|{{adset.id}}&nemu_content={{ad.name}}|{{ad.id}}"
                />
                <UtmTemplate
                    title="Meta Hotmart"
                    template="src=facebook|{{adset.name}}|{{campaign.name}}|{{ad.name}}|{{campaign.id}}|{{adset.id}}|{{ad.id}}&utm_source=facebook&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium=cpc_{{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}"
                />
            </TabsContent>

            {/* Google Tab */}
            <TabsContent value="google">
                <UtmTemplate
                    title="Google para outras plataformas"
                    template="{lpurl}?nemu_source=google&nemu_campaign={campaignid}&nemu_medium={adgroupid}&nemu_content={creative}&nemu_term={keyword}"
                />
                <UtmTemplate
                    title="Google para Hotmart"
                    template="{lpurl}?src=google|{creative}-{adgroupid}|{campaignid}|{keyword}&nemu_source=google&nemu_campaign={campaignid}&nemu_medium={adgroupid}&nemu_content={creative}&nemu_term={keyword}"
                />
            </TabsContent>
        </Tabs>
    );
};