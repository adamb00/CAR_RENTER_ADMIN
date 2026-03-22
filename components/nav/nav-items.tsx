import {
  BadgeDollarSign,
  BarChart3,
  Bell,
  BookOpen,
  CalendarClock,
  Car,
  Inbox,
  UserIcon,
} from 'lucide-react';
import { useMemo } from 'react';

export const navItems = (unreadBadgeCount: number) =>
  useMemo(
    () => [
      {
        title: 'Értesítések',
        url: '#notifications',
        icon: Bell,
        isNotifications: true,
        badgeContent:
          unreadBadgeCount > 0 ? (
            <span className='bg-sidebar-accent text-sidebar-accent-foreground inline-flex min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold'>
              {unreadBadgeCount}
            </span>
          ) : null,
      },
      {
        title: 'Foglalások',
        url: '/',
        icon: BookOpen,
      },
      {
        title: 'Naptár',
        url: '/calendar',
        icon: CalendarClock,
      },
      {
        title: 'Ajánlatkérések',
        url: '/quotes',
        icon: Inbox,
      },
      {
        title: 'Statisztikák',
        url: '/analitycs',
        icon: BarChart3,
      },
      {
        title: 'Költségek',
        url: '/costs',
        icon: BadgeDollarSign,
      },
      { title: 'Bérlők', url: '/renters', icon: UserIcon },
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
    [unreadBadgeCount],
  );
