import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>VaidyaChain - Ayurvedic Supply Chain Traceability</title>
        <meta name="description" content="Blockchain-based traceability system for Ayurvedic herbs" />
      </head>
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
