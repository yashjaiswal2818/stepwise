import { Navbar } from "@/components/Navbar";
import { LearnThroughline } from "@/components/learn/LearnThroughline";

/**
 * /learn — "The Index". A native-scrolling reading instrument (not a pan/zoom
 * map): one achromatic vertical spine you advance down, which is the whole scale
 * story — the page only ever gets taller.
 */
export default function LearnPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-5 sm:px-8">
          <LearnThroughline />
        </div>
      </main>
    </div>
  );
}
