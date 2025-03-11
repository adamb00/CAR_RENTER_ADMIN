import './_styles/globals.css';

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang='en'>
         <body className={`antialiased`}>{children}</body>
      </html>
   );
}

// TODO ADD FAVICON TO APP FOLDER
// TODO ADD DATABASE AND DIRECT URL
// TODO PNPM DLX PRISMA GENERATE
// TODO PNPM DLX AUTH SECRET
