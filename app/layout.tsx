import type { ReactNode } from 'react';

import { auth } from '@/auth';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import './_styles/globals.css';

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    return (
      <html lang='en'>
        <body className='antialiased'>{children}</body>
      </html>
    );
  }

  return (
    <html lang='en'>
      <body className='antialiased'>
        <SidebarProvider>
          <AppSidebar user={session?.user ?? undefined} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
