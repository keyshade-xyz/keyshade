import './global.css';
import { Metadata } from "next";

const description = "Manage all your secrets securely with public key encryption and realtime based tools, that seamlessly fits into your codebase";
const name = "keyshade";

export const metadata: Metadata = {
  metadataBase: new URL("https://keyshade.xyz/"),
  title: {
    default: name,
    template: `%s | ${name}`,
  },
  description: description,
  keywords: [
    "Keyshade",
    "secrets integration",
    "codebase security",
    "Public Key Encryption",
    "secret rotation",
    "auto revoke",
    "collaboration",
    "data security",
    "secrets management",
    "secure code secrets",
    "realtime secrets integration",
    "encryption for secrets",
    "automated secret rotation",
    "team collaboration secrets",
    "secure runtime environment",
    "secrets management tool",
    "codebase security solution",
    "cybersecurity for secrets",
    "API security",
    "key management",
    "secure data transfer",
    "secure secrets sharing",
    "effortless secrets management",
    "Keyshade features",
    "cybersecurity solution",
    "secure software development",
    "automated access revocation",
    "secure secrets storage",
    "developer tools security",
    "API key security",
    "codebase encryption",
    "team-based secrets management"
  ],
  applicationName: name,
  openGraph: {
    title: name,
    description: description,
    type: "website",
    locale: "en_US",
    images: "https://keyshade.xyz/thumbnail.png",
  },
  twitter: {
    card: "summary_large_image",
    title: name,
    description: description,
    creator: "@keyshade_xyz",
    creatorId: "1738929014016966656",
  },
  robots: {
    index: true,
    follow: true,
    noarchive: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
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
