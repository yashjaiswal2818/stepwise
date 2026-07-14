import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/** Marketing / content shell: sticky nav + footer. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
