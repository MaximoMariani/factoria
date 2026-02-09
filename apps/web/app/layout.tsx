import Link from "next/link";

export const metadata = {
  title: "Apparel Ops",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f7f7f8" }}>
        <header style={{ padding: 16, background: "#111", color: "white" }}>
          <h1 style={{ margin: 0, marginBottom: 8 }}>Apparel Ops App</h1>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link href="/" style={{ color: "white" }}>Home</Link>
            <Link href="/catalog" style={{ color: "white" }}>Catalog</Link>
            <Link href="/productions/new" style={{ color: "white" }}>Production Wizard</Link>
            <Link href="/board" style={{ color: "white" }}>Board</Link>
            <Link href="/history" style={{ color: "white" }}>History</Link>
          </nav>
        </header>
        <main style={{ padding: 16, maxWidth: 1000, margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}
