import "./globals.css";

export const metadata = {
  title: "SFFD Command Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* HACKATHON DUCT TAPE: Force Tailwind to load instantly via CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}