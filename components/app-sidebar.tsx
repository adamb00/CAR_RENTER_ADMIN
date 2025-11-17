'use client';

import { BookOpen, Car } from 'lucide-react';
import * as React from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';

type SidebarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: SidebarUser | null;
};

const data = {
  navMain: [
    {
      title: 'Foglalások',
      url: '/',
      icon: BookOpen,
    },

    {
      title: 'Autók',
      url: '#',
      icon: Car,
      isActive: true,
      items: [
        {
          title: 'Összes autó',
          url: '/cars',
        },
        {
          title: 'Új autó hozzáadása',
          url: '/cars/new',
        },
      ],
    },
  ],
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
