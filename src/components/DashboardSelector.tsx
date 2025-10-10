import { Building2, Calendar, Users, Zap, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/ui/platform-badge";

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
  onBack?: () => void;
}

export const DashboardSelector = ({ dashboards, onSelectDashboard, onSelectAll, onBack }: DashboardSelectorProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">Select Dashboard</h2>
            <p className="text-sm text-muted-foreground">Choose a dashboard to validate UTM configurations</p>
          </div>
        </div>
        <Button onClick={onSelectAll} variant="outline" className="flex items-center gap-2 sm:shrink-0">
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Created: {formatDate(dashboard.createdAt)}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Integrations:</div>
                <div className="flex flex-wrap gap-1">
                  {dashboard.integrations.map((integration) => (
                    <PlatformBadge 
                      key={integration}
                      platform={integration}
                      showLabel
                      className="text-xs gap-1.5 px-2 py-1 border-0"
                      iconClassName="w-4 h-4"
                    />
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
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