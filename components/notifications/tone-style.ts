import { SidebarNotification } from '@/data-service/notifications';

export const toneStyles: Record<
  SidebarNotification['tone'],
  { dot: string; emphasis: string }
> = {
  info: {
    dot: 'bg-sky-500',
    emphasis: 'text-sky-600',
  },
  warning: {
    dot: 'bg-amber-500',
    emphasis: 'text-amber-600',
  },
  danger: {
    dot: 'bg-rose-500',
    emphasis: 'text-rose-600',
  },
};
