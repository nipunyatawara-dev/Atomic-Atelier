import { Suspense } from "react";
import { Atom } from "lucide-react";
import { ExplorerApp } from "./components/ExplorerApp";

export default function HomePage() {
  return (
    <Suspense fallback={<main className="route-loading"><Atom /><strong>Arranging the elements…</strong></main>}>
      <ExplorerApp />
    </Suspense>
  );
}
