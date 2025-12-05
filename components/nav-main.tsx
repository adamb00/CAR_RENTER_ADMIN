'use client';

import type { ReactNode } from 'react';

import { ChevronRight, type LucideIcon } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
  renderNotifications,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    isNotifications?: boolean;
    badgeContent?: ReactNode;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  renderNotifications?: () => ReactNode;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Zodiacs Rent a Car</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.isNotifications ? (
            <Collapsible key={item.title} asChild className='group/collapsible'>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <div className='ml-auto flex items-center gap-2'>
                      {item.badgeContent}
                      <ChevronRight className='transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                    </div>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className='mt-2 rounded-lg border border-sidebar-border/80 bg-background px-3 py-2 text-sm text-sidebar-foreground'>
                    {renderNotifications?.()}
                  </div>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className='group/collapsible'
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <a href={item.url} className='flex w-full items-center gap-2'>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.badgeContent && (
                    <span className='ml-auto'>{item.badgeContent}</span>
                  )}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
