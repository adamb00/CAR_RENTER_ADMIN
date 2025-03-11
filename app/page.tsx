'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function Home() {
   return (
      <main className='flex h-full flex-col items-center justify-center'>
         <SidebarProvider>
            <AppSidebar />
            Here comes the rest
         </SidebarProvider>
      </main>
   );
}
