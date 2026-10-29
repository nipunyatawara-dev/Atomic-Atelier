import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuizModal } from "@/features/explorer/components/QuizModal";

afterEach(cleanup);

describe("targeted quiz practice", () => {
  it("reviews missed concepts and retries them without replacing a full quiz score", async () => {
    const user = userEvent.setup();
    const complete = vi.fn();
    render(<QuizModal title="Practice" questions={[
      { id: "charge", prompt: "Predict the charge", options: ["Positive", "Negative"], answer: 0, explanation: "Removing an electron leaves a positive ion.", followUp: { label: "Explore ions", href: "/?element=carbon&tool=ion-lab" } },
      { id: "shape", prompt: "Predict the shape", options: ["Linear", "Bent"], answer: 0, explanation: "CO₂ is linear." },
    ]} onClose={() => {}} onComplete={complete} />);
    await user.click(screen.getByRole("button", { name: "B Negative" }));
    expect(screen.getByRole("status")).toHaveTextContent("Not quite");
    await user.click(screen.getByRole("button", { name: /Next question/ }));
    await user.click(screen.getByRole("button", { name: "A Linear" }));
    await user.click(screen.getByRole("button", { name: /See score/ }));
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({ correct: 1, total: 2 }));
    expect(screen.getByRole("region", { name: "Concepts to revisit" })).toHaveTextContent("Predict the charge");
    expect(screen.getByRole("link", { name: /Explore ions/ })).toHaveAttribute("href", "/?element=carbon&tool=ion-lab");
    await user.click(screen.getByRole("button", { name: /Practice missed questions/ }));
    expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "A Positive" }));
    await user.click(screen.getByRole("button", { name: /See score/ }));
    expect(screen.queryByRole("region", { name: "Concepts to revisit" })).not.toBeInTheDocument();
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
