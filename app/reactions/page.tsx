import { Suspense } from "react";
import { FlaskConical } from "lucide-react";
import { ReactionLab } from "../components/ReactionLab";

export const metadata = {
  title: "Guided reaction lab",
  description: "Balance twelve foundational chemistry reactions and watch schematic particle rearrangements.",
};

export default function ReactionsPage() {
  return (
    <Suspense fallback={<main className="route-loading"><FlaskConical /><strong>Preparing the reaction lab…</strong></main>}>
      <ReactionLab />
    </Suspense>
  );
}
