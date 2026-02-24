import { Mail, Eye, MousePointerClick } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EmailStatusIconsProps {
  delivered: number;
  opened: number;
  clicked: number;
}

export function EmailStatusIcons({
  delivered,
  opened,
  clicked,
}: EmailStatusIconsProps) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger>
          <Mail
            className={cn(
              'h-4 w-4',
              delivered > 0 ? 'text-green-500' : 'text-muted-foreground/30',
            )}
          />
        </TooltipTrigger>
        <TooltipContent>{delivered} delivered</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <Eye
            className={cn(
              'h-4 w-4',
              opened > 0 ? 'text-amber-500' : 'text-muted-foreground/30',
            )}
          />
        </TooltipTrigger>
        <TooltipContent>{opened} opened</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <MousePointerClick
            className={cn(
              'h-4 w-4',
              clicked > 0 ? 'text-cyan-500' : 'text-muted-foreground/30',
            )}
          />
        </TooltipTrigger>
        <TooltipContent>{clicked} clicked</TooltipContent>
      </Tooltip>
    </div>
  );
}
