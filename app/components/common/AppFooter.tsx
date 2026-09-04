import Link from "next/link";
import {
  Atom,
  ExternalLink,
  FlaskConical,
  Layers,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

function GithubIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo" aria-label="Atomic Atelier footer">
      <div className="footer-panel">
        <div className="footer-grid">
          {/* 1. Brand and Purpose */}
          <div className="footer-col footer-col-brand">
            <Link href="/" className="brand" aria-label="Atomic Atelier: See matter differently">
              <span className="brand-mark" aria-hidden="true">
                <Atom />
              </span>
              <span className="brand-copy">
                <strong>Atomic Atelier</strong>
                <em>See matter differently</em>
              </span>
            </Link>
            <p className="footer-desc">
              An interactive chemistry atelier designed to explore matter through
              intuitive 3D atomic models, periodic trends, molecular geometries,
              and guided reaction dynamics.
            </p>
            <div className="footer-pill-row">
              <span className="footer-pill">118 Elements</span>
              <span className="footer-pill">Interactive 3D</span>
              <span className="footer-pill">Offline Ready</span>
            </div>
          </div>

          {/* 2. Studios & Modules Navigation */}
          <div className="footer-col">
            <h4 className="footer-col-title">Studios</h4>
            <ul className="footer-links">
              <li>
                <Link href="/" className="footer-link">
                  <Atom size={15} aria-hidden="true" />
                  <span>Element Explorer</span>
                </Link>
              </li>
              <li>
                <Link href="/molecules" className="footer-link">
                  <Layers size={15} aria-hidden="true" />
                  <span>3D Molecule Studio</span>
                </Link>
              </li>
              <li>
                <Link href="/trends" className="footer-link">
                  <TrendingUp size={15} aria-hidden="true" />
                  <span>Periodic Trends Matrix</span>
                </Link>
              </li>
              <li>
                <Link href="/reactions" className="footer-link">
                  <FlaskConical size={15} aria-hidden="true" />
                  <span>Guided Reaction Lab</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Scientific Standards & Data */}
          <div className="footer-col">
            <h4 className="footer-col-title">Data & Standards</h4>
            <ul className="footer-links">
              <li>
                <a
                  href="https://pubchem.ncbi.nlm.nih.gov/periodic-table/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  <span>PubChem Periodic Table</span>
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://iupac.org/what-we-do/periodic-table-of-elements/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  <span>IUPAC Element Standards</span>
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://webbook.nist.gov/chemistry/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  <span>NIST Chemistry WebBook</span>
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </li>
            </ul>
            <p className="footer-pedagogy-note">
              Particle shells and geometries are stylized models for intuitive teaching.
            </p>
          </div>

          {/* 4. Open Source & GitHub */}
          <div className="footer-col footer-col-github">
            <h4 className="footer-col-title">Open Source</h4>
            <a
              href="https://github.com/nipunyatawara-dev/Atomic-Atelier"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-github-card"
              aria-label="Atomic Atelier on GitHub (opens in new tab)"
            >
              <div className="github-card-header">
                <GithubIcon size={20} />
                <span className="github-card-badge">MIT License</span>
              </div>
              <div className="github-card-body">
                <strong>nipunyatawara-dev/Atomic-Atelier</strong>
                <span>Explore the source code, inspect algorithms, or fork the project.</span>
              </div>
              <div className="github-card-footer">
                <span>View Repository</span>
                <ExternalLink size={12} aria-hidden="true" />
              </div>
            </a>
            <div className="footer-github-sublinks">
              <a
                href="https://github.com/nipunyatawara-dev/Atomic-Atelier/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-sublink"
              >
                Report an Issue
              </a>
              <span className="footer-sublink-dot" aria-hidden="true">·</span>
              <a
                href="https://github.com/nipunyatawara-dev/Atomic-Atelier/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-sublink"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} Atomic Atelier. Designed for students, educators, and curious minds.
          </p>

          <div className="footer-privacy-badge">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Zero telemetry · 100% private local storage</span>
          </div>

          <a
            href="https://github.com/nipunyatawara-dev/Atomic-Atelier"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-bottom-github"
            aria-label="GitHub repository"
          >
            <GithubIcon size={14} />
            <span>Source on GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
