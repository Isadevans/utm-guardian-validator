import { Building2, Calendar, Users, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface Dashboard {
  id: number;
  accountId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  tax: number;
  tribute: number;
  showType: string;
  eventClick: string;
  guestPassword: string | null;
  apiToken: string | null;
  cpaView: string;
  byOnboarding: boolean;
  integrations: string[];
}

interface DashboardSelectorProps {
  dashboards: Dashboard[];
  onSelectDashboard: (dashboardId: number) => void;
  onSelectAll: () => void;
}

export const DashboardSelector = ({ dashboards, onSelectDashboard, onSelectAll }: DashboardSelectorProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getIntegrationIcon = (integration: string) => {
    switch (integration.toLowerCase()) {
      case 'facebook':
        return '📘';
      case 'google':
        return '🔍';
      case 'tiktok':
        return '🎵';
      case 'pinterest':
        return '📌';
      default:
        return '🔗';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Select Dashboard</h2>
          <p className="text-gray-600">Choose a dashboard to validate UTM configurations</p>
        </div>
        <Button onClick={onSelectAll} variant="outline" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Validate All Dashboards
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboards.map((dashboard) => (
          <Card 
            key={dashboard.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20"
            onClick={() => onSelectDashboard(dashboard.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  ID: {dashboard.id}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Account: {dashboard.accountId}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Created: {formatDate(dashboard.createdAt)}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Integrations:</div>
                <div className="flex flex-wrap gap-1">
                  {dashboard.integrations.map((integration) => (
                    <Badge key={integration} variant="outline" className="text-xs">
                      {getIntegrationIcon(integration)} {integration}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>CPA View: {dashboard.cpaView}</div>
                <div>Show: {dashboard.showType}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};