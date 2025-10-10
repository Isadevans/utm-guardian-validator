import { Badge } from "@/components/ui/badge";
import { getPlatformConfig } from "@/lib/platformConfig";
import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: string;
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
  variant?: "default" | "outline";
}

export const PlatformBadge = ({
  platform,
  showIcon = true,
  showLabel = false,
  className,
  iconClassName,
  variant = "outline"
}: PlatformBadgeProps) => {
  const config = getPlatformConfig(platform);

  return (
    <Badge 
      variant={variant} 
      className={cn(
        "px-2 py-1",
        config.color,
        className
      )}
    >
      {showIcon && (
        <img 
          src={config.icon} 
          alt={config.displayName} 
          className={cn("w-5 h-5", iconClassName)}
        />
      )}
      {showLabel && (
        <span className="ml-2">{config.displayName}</span>
      )}
    </Badge>
  );
};

