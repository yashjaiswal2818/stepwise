import { SiteChrome } from "@/components/SiteChrome";
import { Hero } from "@/components/landing/Hero";
import { StructureGrid } from "@/components/landing/StructureGrid";
import { FeaturedStrip } from "@/components/landing/FeaturedStrip";

export default function Home() {
  return (
    <SiteChrome>
      <Hero />
      <StructureGrid />
      <FeaturedStrip />
    </SiteChrome>
  );
}
