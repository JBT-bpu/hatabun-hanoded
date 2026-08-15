import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "hatabunhanoded.co.il";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const title = "הטאבון הנודד | תיאטרון אש נייד לאירועים";
  const description =
    "טאבון נייד לאירועים עם פוקאצ׳ות שנאפות מול האורחים. חוויה חמה, טרייה ובלתי נשכחת — בבית, בטבע, באולם או בגן אירועים.";

  return {
    metadataBase: baseUrl,
    title,
    description,
    keywords: [
      "טאבון נייד לאירועים",
      "עמדת טאבון",
      "פוקאצ׳ות לאירועים",
      "אוכל לאירועים",
      "הטאבון הנודד",
    ],
    openGraph: {
      title: "הטאבון הנודד | האש נדלקת. האירוע מתחיל.",
      description: "טאבון נייד, אפייה מול האורחים וחוויה שאי אפשר להתעלם ממנה.",
      locale: "he_IL",
      type: "website",
      url: baseUrl,
      images: [
        {
          url: new URL("/og.png", baseUrl),
          width: 1672,
          height: 909,
          alt: "הטאבון הנודד — האש נדלקת. האירוע מתחיל.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "הטאבון הנודד | האש נדלקת. האירוע מתחיל.",
      description: "טאבון נייד, אפייה מול האורחים וחוויה שאי אפשר להתעלם ממנה.",
      images: [new URL("/og.png", baseUrl)],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
