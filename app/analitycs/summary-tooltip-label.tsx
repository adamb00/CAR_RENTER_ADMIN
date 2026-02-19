'use client';

import { CircleHelp } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type SummaryTooltipLabelProps = {
  label: string;
  description: string;
};

export function SummaryTooltipLabel({
  label,
  description,
}: SummaryTooltipLabelProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type='button'
          className='inline-flex items-center gap-1 text-left align-middle text-foreground hover:text-primary'
        >
          <span>{label}</span>
          <CircleHelp className='size-3.5 text-muted-foreground' />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side='top'
        sideOffset={8}
        className='max-w-sm text-left text-xs leading-relaxed'
      >
        {description}
      </TooltipContent>
    </Tooltip>
  );
}
