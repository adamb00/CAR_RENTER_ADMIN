'use client';

import { LogOut } from 'lucide-react';

import { logoutAction } from '@/actions/logoutAction';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

type NavUserProps = {
  user?: {
    email?: string | null;
  } | null;
};

export function NavUser({ user }: NavUserProps) {
  const displayEmail = user?.email ?? 'Unknown user';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate text-xs'>{displayEmail}</span>
          </div>
          <LogOut
            className='ml-auto size-4 cursor-pointer'
            onClick={async () => await logoutAction()}
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
