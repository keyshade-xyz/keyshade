import './global.css';

export const metadata = {
  title: 'keyshade.xyz',
  description: 'Distribute your secrets with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
