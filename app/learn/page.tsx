import { Navbar } from "@/components/Navbar";
import { Constellation } from "@/components/learn/Constellation";

export default function LearnPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Navbar />
      <div className="min-h-0 flex-1">
        <Constellation />
      </div>
    </div>
  );
}
