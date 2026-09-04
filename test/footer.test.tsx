import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppFooter } from "../app/components/common/AppFooter";

describe("AppFooter", () => {
  it("renders brand information and tagline", () => {
    render(<AppFooter />);

    expect(screen.getByText("Atomic Atelier")).toBeInTheDocument();
    expect(screen.getByText("See matter differently")).toBeInTheDocument();
    expect(
      screen.getByText(/An interactive chemistry atelier designed to explore matter/i)
    ).toBeInTheDocument();
  });

  it("renders links to all four studios with correct paths", () => {
    render(<AppFooter />);

    const elementLink = screen.getByRole("link", { name: /Element Explorer/i });
    expect(elementLink).toHaveAttribute("href", "/");

    const moleculeLink = screen.getByRole("link", { name: /3D Molecule Studio/i });
    expect(moleculeLink).toHaveAttribute("href", "/molecules");

    const trendsLink = screen.getByRole("link", { name: /Periodic Trends Matrix/i });
    expect(trendsLink).toHaveAttribute("href", "/trends");

    const reactionsLink = screen.getByRole("link", { name: /Guided Reaction Lab/i });
    expect(reactionsLink).toHaveAttribute("href", "/reactions");
  });

  it("renders source code GitHub link with secure target and rel attributes", () => {
    render(<AppFooter />);

    const githubLink = screen.getByRole("link", {
      name: /Atomic Atelier on GitHub/i,
    });
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/nipunyatawara-dev/Atomic-Atelier"
    );
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders scientific reference and standard links", () => {
    render(<AppFooter />);

    const pubchemLink = screen.getByRole("link", { name: /PubChem Periodic Table/i });
    expect(pubchemLink).toHaveAttribute(
      "href",
      "https://pubchem.ncbi.nlm.nih.gov/periodic-table/"
    );

    const iupacLink = screen.getByRole("link", { name: /IUPAC Element Standards/i });
    expect(iupacLink).toHaveAttribute(
      "href",
      "https://iupac.org/what-we-do/periodic-table-of-elements/"
    );

    const nistLink = screen.getByRole("link", { name: /NIST Chemistry WebBook/i });
    expect(nistLink).toHaveAttribute(
      "href",
      "https://webbook.nist.gov/chemistry/"
    );
  });

  it("renders offline and element pills without bottom bar telemetry or secondary button", () => {
    render(<AppFooter />);

    expect(screen.getByText("Offline Ready")).toBeInTheDocument();
    expect(screen.getByText("118 Elements")).toBeInTheDocument();
    expect(screen.queryByText(/Zero telemetry · 100% private local storage/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Source on GitHub")).not.toBeInTheDocument();
  });
});
