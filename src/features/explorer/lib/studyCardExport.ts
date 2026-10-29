import { formatElementProperty } from "@/lib/elementProperties";
import type { ElementRecord } from "@/types";
import { categoryLabels } from "@/features/explorer/lib/elements";
import { formatElectronConfig } from "@/features/reactions/lib/formula";

/**
 * Generates an 800x1100 vector SVG study card for an element.
 */
export function generateElementStudyCardSvg(element: ElementRecord): string {
  const width = 800;
  const height = 1100;
  const cpk = element.cpkColor || "#38bdf8";
  const categoryName = categoryLabels[element.category] || element.categoryLabel || "Element";

  // Compute concentric Bohr shell circles & electron dots
  const bohrCenterX = 400;
  const bohrCenterY = 320;
  const baseRadius = 38;
  const radiusStep = 20;

  const shellSvgElements: string[] = [];

  element.shells.forEach((electronCount, shellIdx) => {
    const r = baseRadius + shellIdx * radiusStep;
    // Orbit ring
    shellSvgElements.push(
      `<circle cx="${bohrCenterX}" cy="${bohrCenterY}" r="${r}" fill="none" stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.6"/>`,
    );

    // Electron dots along the ring
    for (let e = 0; e < electronCount; e++) {
      const angle = (2 * Math.PI * e) / electronCount - Math.PI / 2;
      const ex = bohrCenterX + r * Math.cos(angle);
      const ey = bohrCenterY + r * Math.sin(angle);
      shellSvgElements.push(
        `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3.6" fill="#38bdf8" stroke="#0f172a" stroke-width="1"/>`,
      );
    }
  });

  // Shell occupancy text
  const shellText = element.shells.join(" · ");

  const cleanHistory = (element.history || "").replace(/[<>&"]/g, "").slice(0, 160) + "…";
  const cleanUses = (element.uses || "").replace(/[<>&"]/g, "").slice(0, 160) + "…";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#091414" />
      <stop offset="100%" stop-color="#122525" />
    </linearGradient>
    <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${cpk}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${cpk}" stop-opacity="0.2" />
    </linearGradient>
    <style>
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
      .sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    </style>
  </defs>

  <!-- Background Card Shell -->
  <rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="24" fill="url(#bgGrad)" stroke="#234240" stroke-width="2"/>

  <!-- Top Accent Banner -->
  <rect x="14" y="14" width="${width - 28}" height="8" rx="4" fill="url(#bannerGrad)"/>

  <!-- Topbar Header -->
  <text x="50" y="70" class="mono" font-size="14" fill="#64748b" letter-spacing="2">ATOMIC ATELIER · STUDY CARD</text>
  <text x="750" y="70" text-anchor="end" class="mono" font-size="14" fill="#64748b">NO. ${element.atomicNumber}</text>

  <!-- Element Identity Block -->
  <g transform="translate(50, 100)">
    <!-- Symbol Box -->
    <rect x="0" y="0" width="105" height="105" rx="16" fill="#183637" stroke="${cpk}" stroke-width="2"/>
    <text x="14" y="32" class="mono" font-size="18" fill="#94a3b8">${element.atomicNumber}</text>
    <text x="52" y="76" text-anchor="middle" class="mono" font-size="44" font-weight="bold" fill="#f8fafc">${element.symbol}</text>
    
    <!-- Title & Mass -->
    <text x="130" y="44" class="sans" font-size="34" font-weight="bold" fill="#ffffff">${element.name}</text>
    <text x="130" y="72" class="mono" font-size="16" fill="#60a5fa">${formatElementProperty(element, "atomicMass")}</text>
    <rect x="130" y="84" width="140" height="24" rx="6" fill="#1e3a39"/>
    <text x="200" y="100" text-anchor="middle" class="mono" font-size="11" font-weight="600" fill="#38bdf8">${categoryName.toUpperCase()}</text>
  </g>

  <!-- Bohr Model Diagram Section -->
  <g>
    <!-- Center Nucleus Badge -->
    <circle cx="${bohrCenterX}" cy="${bohrCenterY}" r="22" fill="#183637" stroke="${cpk}" stroke-width="2"/>
    <text x="${bohrCenterX}" y="${bohrCenterY + 7}" text-anchor="middle" class="mono" font-size="18" font-weight="bold" fill="#ffffff">${element.symbol}</text>

    <!-- Shell Rings & Electron Dots -->
    ${shellSvgElements.join("\n    ")}

    <!-- Shell Occupancy Readout -->
    <text x="${bohrCenterX}" y="475" text-anchor="middle" class="mono" font-size="14" fill="#94a3b8">BOHR SHELLS: ${shellText} (${element.atomicNumber} e⁻)</text>
  </g>

  <!-- Divider Rule -->
  <line x1="50" y1="505" x2="750" y2="505" stroke="#234240" stroke-width="1.5"/>

  <!-- Properties Grid (2 columns x 4 rows) -->
  <g transform="translate(50, 525)">
    <!-- Column 1 -->
    <g transform="translate(0, 0)">
      <text x="0" y="20" class="mono" font-size="12" fill="#64748b">ELECTRON CONFIGURATION</text>
      <text x="0" y="44" class="mono" font-size="16" font-weight="600" fill="#f8fafc">${formatElectronConfig(element.electronConfiguration)}</text>
    </g>
    <g transform="translate(0, 75)">
      <text x="0" y="20" class="mono" font-size="12" fill="#64748b">PERIOD / GROUP / BLOCK</text>
      <text x="0" y="44" class="mono" font-size="16" font-weight="600" fill="#f8fafc">Period ${element.period} · Group ${element.group ?? "f-block"} · ${element.block}-block</text>
    </g>
    <g transform="translate(0, 150)">
      <text x="0" y="20" class="mono" font-size="12" fill="#64748b">ELECTRONEGATIVITY (PAULING)</text>
      <text x="0" y="44" class="mono" font-size="16" font-weight="600" fill="#f8fafc">${formatElementProperty(element, "electronegativity")}</text>
    </g>
    <g transform="translate(0, 225)">
      <text x="0" y="20" class="mono" font-size="12" fill="#64748b">FIRST IONIZATION ENERGY</text>
      <text x="0" y="44" class="mono" font-size="16" font-weight="600" fill="#f8fafc">${formatElementProperty(element, "ionizationEnergy")}</text>
    </g>

    <!-- Column 2 -->
    <g transform="translate(370, 0)">
      <text x="0" y="20" class="mono" font-size="12" fill="#64748b">STANDARD STATE</text>
      <text x="0" y="44" class="mono" font-size="16" font-weight="600" fill="#f8fafc">${element.standardState ?? "Unknown state"}</text>
    </g>
    <g transform="translate(370, 75)">
      <text x="0" y="20" class="mono" font-size="12" fill="#64748b">OXIDATION STATES</text>
      <text x="0" y="44" class="mono" font-size="16" font-weight="600" fill="#f8fafc">${element.oxidationStates.length ? element.oxidationStates.join(", ") : "Not established"}</text>
    </g>
    <g transform="translate(370, 150)">
      <text x="0" y="20" class="mono" font-size="12" fill="#64748b">ATOMIC RADIUS</text>
      <text x="0" y="44" class="mono" font-size="16" font-weight="600" fill="#f8fafc">${formatElementProperty(element, "atomicRadius")}</text>
    </g>
    <g transform="translate(370, 225)">
      <text x="0" y="20" class="mono" font-size="12" fill="#64748b">VALENCE ELECTRONS</text>
      <text x="0" y="44" class="mono" font-size="16" font-weight="600" fill="#f8fafc">${element.valenceElectrons ?? "d/f involvement"}</text>
    </g>
  </g>

  <!-- Divider Rule -->
  <line x1="50" y1="825" x2="750" y2="825" stroke="#234240" stroke-width="1.5"/>

  <!-- Narrative Context: Uses & History -->
  <g transform="translate(50, 845)">
    <text x="0" y="20" class="mono" font-size="12" fill="#64748b">KEY USES &amp; OCCURRENCE</text>
    <text x="0" y="44" class="sans" font-size="14" fill="#cbd5e1" width="700">${cleanUses}</text>

    <text x="0" y="110" class="mono" font-size="12" fill="#64748b">HISTORY &amp; DISCOVERY (${element.yearDiscovered ?? "Ancient"})</text>
    <text x="0" y="134" class="sans" font-size="14" fill="#cbd5e1">${cleanHistory}</text>
  </g>

  <!-- Footer Banner -->
  <g transform="translate(50, 1045)">
    <line x1="0" y1="0" x2="700" y2="0" stroke="#234240" stroke-width="1"/>
    <text x="0" y="28" class="mono" font-size="11" fill="#64748b">ATOMIC ATELIER · INTERACTIVE CHEMISTRY LEARNING ATELIER</text>
    <text x="700" y="28" text-anchor="end" class="mono" font-size="11" fill="#64748b">https://atomic-atelier.vercel.app</text>
  </g>
</svg>`;
}

/**
 * Triggers a browser vector SVG download for an element study card.
 */
export function downloadElementCardSvg(element: ElementRecord) {
  const svgString = generateElementStudyCardSvg(element);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `atomic-card-${element.atomicNumber}-${element.slug}.svg`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
