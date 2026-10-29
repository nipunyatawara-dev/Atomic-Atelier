"use client";
/* eslint-disable react-hooks/refs, react-hooks/immutability, react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Atom,
  BookOpen,
  CircleDot,
  Focus,
  GitCompareArrows,
  Hand,
  Info,
  Layers,
  Minus,
  Orbit,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Dialog } from "@/components/common/Dialog";
import { ConceptHelp } from "@/components/common/ConceptHelp";
import { formatElectronConfig } from "@/features/reactions/lib/formula";
import type { ElementRecord } from "@/types";
import {
  generateOrbitalCloudPoints,
  parseElectronConfiguration,
  SUBSHELL_COLORS,
  type SubshellInfo,
} from "@/features/explorer/lib/orbitals";

type ViewMode = "bohr" | "orbital";
type StructureKey = "nucleus" | "proton" | "neutron" | "electron" | "valence" | "orbitals";

type ViewerState = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  atom: THREE.Group;
  timer: THREE.Timer;
  resizeObserver: ResizeObserver;
  intersectionObserver: IntersectionObserver;
  frame: number;
  visible: boolean;
  dirty: boolean;
  electronData: ElectronParticle[];
  shells: THREE.Object3D[];
  nucleusMeshes: THREE.Object3D[];
  innerElectrons: THREE.InstancedMesh | null;
  valenceElectrons: THREE.InstancedMesh | null;
  orbitalMeshes: Map<string, THREE.Points>;
};

type ElectronParticle = {
  mesh: THREE.InstancedMesh;
  instance: number;
  radius: number;
  angle: number;
  speed: number;
  orbit: THREE.Quaternion;
};

const structureCopy: Record<StructureKey, { label: string; detail: (element: ElementRecord) => string }> = {
  nucleus: { label: "Nucleus", detail: (element) => `${element.atomicNumber} ${element.atomicNumber === 1 ? "proton" : "protons"}${element.neutrons === null ? "" : ` and ${element.neutrons} ${element.neutrons === 1 ? "neutron" : "neutrons"}`} form the dense center.` },
  proton: { label: "Proton", detail: (element) => `The ${element.atomicNumber} ${element.atomicNumber === 1 ? "proton defines" : "protons define"} this atom as ${element.name}.` },
  neutron: { label: "Neutron", detail: (element) => element.neutrons === null ? "A representative neutron count is not established for this visualization." : `${element.neutrons} ${element.neutrons === 1 ? "neutron is" : "neutrons are"} shown for the representative isotope.` },
  electron: { label: "Electron", detail: (element) => `${element.atomicNumber} ${element.atomicNumber === 1 ? "electron makes" : "electrons make"} the neutral atom electrically balanced.` },
  valence: { label: "Valence shell", detail: (element) => element.valenceElectrons === null ? "Outer and d/f electrons can both participate in bonding." : `${element.valenceElectrons} outer-shell ${element.valenceElectrons === 1 ? "electron strongly influences" : "electrons strongly influence"} bonding.` },
  orbitals: { label: "Quantum Orbitals", detail: (element) => `Subshell electron clouds (s, p, d, f) for ${element.name} show 3D probability distributions (|ψ|²) where electrons are ~90% likely to be located around the nucleus.` },
};

const dummy = new THREE.Object3D();

function seededFraction(value: number) {
  return Math.abs(Math.sin(value * 12.9898) * 43758.5453) % 1;
}

export function generateNucleusPositions(total: number, particleSize: number, seed: number): THREE.Vector3[] {
  const contactDist = particleSize * 1.80; // snug contact distance with minimal gap
  let rawPoints: THREE.Vector3[] = [];

  if (total <= 1) {
    rawPoints = [new THREE.Vector3(0, 0, 0)];
  } else if (total === 2) {
    const d = contactDist * 0.5;
    rawPoints = [new THREE.Vector3(-d, 0, 0), new THREE.Vector3(d, 0, 0)];
  } else if (total === 3) {
    const r = contactDist / Math.sqrt(3);
    rawPoints = [
      new THREE.Vector3(0, r, 0),
      new THREE.Vector3(-r * Math.cos(Math.PI / 6), -r * Math.sin(Math.PI / 6), 0),
      new THREE.Vector3(r * Math.cos(Math.PI / 6), -r * Math.sin(Math.PI / 6), 0),
    ];
  } else if (total === 4) {
    const s = contactDist / Math.sqrt(8);
    rawPoints = [
      new THREE.Vector3(s, s, s),
      new THREE.Vector3(s, -s, -s),
      new THREE.Vector3(-s, s, -s),
      new THREE.Vector3(-s, -s, s),
    ];
  } else {
    // Face-Centered Cubic (FCC) close packing for optimal dense sphere clustering
    const a = contactDist * Math.SQRT2;
    const maxLayers = Math.ceil(Math.cbrt(total)) + 3;
    const candidates: { x: number; y: number; z: number; distSq: number }[] = [];

    for (let i = -maxLayers; i <= maxLayers; i++) {
      for (let j = -maxLayers; j <= maxLayers; j++) {
        for (let k = -maxLayers; k <= maxLayers; k++) {
          if ((i + j + k) % 2 === 0) {
            const x = (i * a) / 2;
            const y = (j * a) / 2;
            const z = (k * a) / 2;
            const distSq = x * x + y * y + z * z;
            candidates.push({ x, y, z, distSq });
          }
        }
      }
    }

    candidates.sort((p1, p2) => p1.distSq - p2.distSq);
    rawPoints = candidates.slice(0, total).map((p) => new THREE.Vector3(p.x, p.y, p.z));
  }

  // Apply deterministic organic orientation based on element seed
  const rotation = new THREE.Euler(
    seededFraction(seed * 2.37 + 1.1) * Math.PI * 2,
    seededFraction(seed * 4.71 + 3.3) * Math.PI * 2,
    seededFraction(seed * 6.19 + 7.7) * Math.PI * 2,
  );

  return rawPoints.map((p) => p.applyEuler(rotation));
}

function shellRadius(shellCount: number, shellIndex: number) {
  const compression = THREE.MathUtils.clamp((shellCount - 3) / 4, 0, 1);
  const spacing = THREE.MathUtils.lerp(.69, .52, compression);
  return 1.48 + shellIndex * spacing;
}

function viewingDistance(state: ViewerState, shellCount: number) {
  const outerRadius = shellRadius(shellCount, Math.max(0, shellCount - 1)) + .2;
  const fittedDistance = (outerRadius / Math.tan(THREE.MathUtils.degToRad(16))) * 1.08;
  const narrowViewportCompensation = Math.min(1, Math.max(.7, state.camera.aspect));
  return Math.max(8.8, fittedDistance) / narrowViewportCompensation;
}

export function computeIonShells(baseShells: number[], charge: number): number[] {
  const shells = [...baseShells];
  if (charge > 0) {
    let toRemove = charge;
    for (let i = shells.length - 1; i >= 0 && toRemove > 0; i--) {
      const removed = Math.min(shells[i], toRemove);
      shells[i] -= removed;
      toRemove -= removed;
    }
    while (shells.length > 0 && shells[shells.length - 1] === 0) {
      shells.pop();
    }
    return shells;
  }
  if (charge < 0) {
    let toAdd = Math.abs(charge);
    const maxCaps = [2, 8, 18, 32, 32, 18, 8];
    if (shells.length === 0) shells.push(0);
    for (let i = shells.length - 1; i < maxCaps.length && toAdd > 0; i++) {
      if (i >= shells.length) shells.push(0);
      const cap = i === shells.length - 1 ? Math.max(8, shells[i]) : maxCaps[i];
      const room = Math.max(0, Math.min(maxCaps[i], cap) - shells[i]);
      const added = Math.min(room > 0 ? room : maxCaps[i] - shells[i], toAdd);
      if (added > 0) {
        shells[i] += added;
        toAdd -= added;
      } else if (i === shells.length - 1 && i + 1 < maxCaps.length) {
        shells.push(0);
      } else {
        break;
      }
    }
  }
  return shells;
}

export function evaluateIsotopeStability(
  z: number,
  neutrons: number,
  defaultNeutrons: number | null,
): { stable: boolean; label: string } {
  if (z >= 84 || z === 43 || z === 61) {
    return { stable: false, label: "Radioactive (No stable isotopes)" };
  }
  if (defaultNeutrons !== null && Math.abs(neutrons - defaultNeutrons) <= 1) {
    return { stable: true, label: "Stable / Natural Isotope" };
  }
  if (z === 1 && (neutrons === 0 || neutrons === 1)) {
    return { stable: true, label: neutrons === 0 ? "Stable (Protium ¹H)" : "Stable (Deuterium ²H)" };
  }
  const diff = defaultNeutrons !== null ? neutrons - defaultNeutrons : neutrons - z;
  return {
    stable: false,
    label: diff > 0 ? "Neutron-rich · β⁻ decay likely" : "Proton-rich · β⁺ / EC decay likely",
  };
}

function formatChargeSuperscript(charge: number): string {
  if (charge === 0) return "";
  const abs = Math.abs(charge);
  const sign = charge > 0 ? "+" : "−";
  return abs === 1 ? sign : `${abs}${sign}`;
}

function clearGroup(group: THREE.Group) {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();

  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
      if (object.geometry && !disposedGeometries.has(object.geometry)) {
        disposedGeometries.add(object.geometry);
        object.geometry.dispose();
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material && !disposedMaterials.has(material)) {
          disposedMaterials.add(material);
          material.dispose();
        }
      });
    }
  });
  group.clear();
}

function FallbackAtom({ element, highlighted = false }: { element: ElementRecord; highlighted?: boolean }) {
  return (
    <div className={`atom-fallback ${highlighted ? "valence-highlighted" : ""}`} role="img" aria-label={`Simplified shell diagram for ${element.name}`}>
      {element.shells.map((count, shell) => (
        <span key={shell} className="fallback-shell" style={{ width: `${96 + shell * 54}px`, height: `${96 + shell * 54}px` }}>
          {Array.from({ length: Math.min(count, 18) }, (_, index) => (
            <i key={index} style={{ transform: `rotate(${(360 / Math.min(count, 18)) * index}deg) translateX(${48 + shell * 27}px)` }} />
          ))}
        </span>
      ))}
      <b>{element.symbol}</b>
    </div>
  );
}

export function AtomViewer({
  element,
  autoRotate,
  onAutoRotate,
  compareActive,
  onCompare,
  highlightRequest = 0,
  initialTool,
  onValenceChange,
}: {
  element: ElementRecord;
  autoRotate: boolean;
  onAutoRotate: (value: boolean) => void;
  compareActive: boolean;
  onCompare: () => void;
  highlightRequest?: number;
  initialTool?: string | null;
  onValenceChange?: (active: boolean) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<ViewerState | null>(null);
  const autoRotateRef = useRef(autoRotate);
  const valenceFocusRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [selected, setSelected] = useState<StructureKey | null>(initialTool === "structure-guide" ? "nucleus" : null);
  const [guideOpen, setGuideOpen] = useState(initialTool === "structure-guide");
  const [shellsVisible, setShellsVisible] = useState(true);
  const [nucleusFocus, setNucleusFocus] = useState(false);
  const [valenceFocus, setValenceFocus] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("bohr");
  const viewModeRef = useRef<ViewMode>("bohr");
  const [activeSubshell, setActiveSubshell] = useState<string>("all");
  const [subshells, setSubshells] = useState<SubshellInfo[]>([]);
  const [hoveredMode, setHoveredMode] = useState<ViewMode | null>(null);

  useEffect(() => { onValenceChange?.(valenceFocus && viewMode === "bohr"); }, [valenceFocus, viewMode, onValenceChange]);

  // Interactive Ion & Isotope Lab state
  const [ionCharge, setIonCharge] = useState<number>(0);
  const [neutronOffset, setNeutronOffset] = useState<number>(0);
  const [ionLabOpen, setIonLabOpen] = useState<boolean>(initialTool === "ion-lab");

  // Mobile 3D Touch Scroll-Trap Guard
  const [mobileScrollLock, setMobileScrollLock] = useState<boolean>(false);

  const baseNeutrons = element.neutrons ?? element.atomicNumber;
  const activeNeutrons = Math.max(0, baseNeutrons + neutronOffset);
  const activeMassNumber = element.atomicNumber + activeNeutrons;
  const activeShells = computeIonShells(element.shells, ionCharge);
  const totalElectrons = activeShells.reduce((sum, c) => sum + c, 0);
  const isotopeStability = evaluateIsotopeStability(element.atomicNumber, activeNeutrons, element.neutrons);

  const onAutoRotateRef = useRef(onAutoRotate);
  useEffect(() => { autoRotateRef.current = autoRotate; if (stateRef.current) stateRef.current.dirty = true; }, [autoRotate]);
  useEffect(() => { onAutoRotateRef.current = onAutoRotate; }, [onAutoRotate]);
  useEffect(() => { viewModeRef.current = viewMode; if (stateRef.current) stateRef.current.dirty = true; }, [viewMode]);

  // Reset Ion & Isotope offsets when switching elements
  useEffect(() => {
    setIonCharge(0);
    setNeutronOffset(0);
  }, [element.atomicNumber]);

  // Sync mobile scroll lock with OrbitControls & canvas touch-action
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    state.controls.enabled = !mobileScrollLock;
    state.renderer.domElement.style.touchAction = mobileScrollLock ? "pan-y" : "none";
    state.renderer.domElement.style.pointerEvents = mobileScrollLock ? "none" : "auto";
  }, [mobileScrollLock]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const isMobileViewport = typeof window !== "undefined" && (window.innerWidth <= 768 || window.matchMedia("(max-width: 768px)").matches);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("aria-label", "Interactive simplified atomic model. Drag to rotate, scroll to zoom, switch between Bohr Shells and Quantum Orbitals.");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xf8fbf8, 0x18363a, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(4, 6, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9ce0d5, 1.4);
    fill.position.set(-4, -1, 4);
    scene.add(fill);
    const rim = isMobileViewport
      ? new THREE.DirectionalLight(0x8f79ff, 1.2)
      : new THREE.PointLight(0x8f79ff, 6.5, 18);
    rim.position.set(-4, 2, -4);
    scene.add(rim);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, .65, 10.8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 26;
    controls.target.set(0, 0, 0);
    controls.addEventListener("change", () => { if (stateRef.current) stateRef.current.dirty = true; });

    const atom = new THREE.Group();
    atom.rotation.set(-.12, -.2, .03);
    scene.add(atom);
    const timer = new THREE.Timer();
    timer.connect(document);
    const state: ViewerState = {
      renderer, scene, camera, controls, atom, timer, frame: 0, visible: true, dirty: true,
      resizeObserver: null!, intersectionObserver: null!, electronData: [], shells: [], nucleusMeshes: [], innerElectrons: null, valenceElectrons: null,
      orbitalMeshes: new Map(),
    };
    stateRef.current = state;

    const resize = () => {
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      state.dirty = true;
    };
    state.resizeObserver = new ResizeObserver(resize);
    state.resizeObserver.observe(mount);
    state.intersectionObserver = new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; state.dirty = true; }, { rootMargin: "100px" });
    state.intersectionObserver.observe(mount);

    const onCanvasKey = (event: KeyboardEvent) => {
      const rotationKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
      if (rotationKeys.includes(event.key)) {
        event.preventDefault();
        if (event.key === "ArrowLeft") atom.rotation.y -= .14;
        if (event.key === "ArrowRight") atom.rotation.y += .14;
        if (event.key === "ArrowUp") atom.rotation.x -= .14;
        if (event.key === "ArrowDown") atom.rotation.x += .14;
        state.dirty = true;
      }
      if (["+", "=", "-", "_"].includes(event.key)) {
        event.preventDefault();
        camera.position.multiplyScalar(["-", "_"].includes(event.key) ? 1.12 : .88).clampLength(3, 26);
        state.dirty = true;
      }
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        atom.rotation.set(-.12, -.2, .03);
        camera.position.set(0, .65, 10.8);
        controls.target.set(0, 0, 0);
        state.dirty = true;
      }
      if (event.key === " ") {
        event.preventDefault();
        onAutoRotateRef.current(!autoRotateRef.current);
      }
    };
    renderer.domElement.addEventListener("keydown", onCanvasKey);

    const animate = () => {
      state.frame = requestAnimationFrame(animate);
      if (!state.visible || document.hidden) return;
      state.timer.update();
      const delta = Math.min(state.timer.getDelta(), 0.05);
      const moving = autoRotateRef.current && !reducedMotionRef.current;
      if (moving) {
        state.atom.rotation.y += delta * 0.18;
        if (viewModeRef.current === "bohr") {
          const isHeavyMobile = isMobileViewport && state.electronData.length > 40;
          const updateInner = !isHeavyMobile || state.frame % 2 === 0;
          state.electronData.forEach((electron) => {
            const isInner = electron.mesh === state.innerElectrons;
            if (isInner && !updateInner) return;
            electron.angle += (isInner && isHeavyMobile ? delta * 2 : delta) * electron.speed;
            dummy.position
              .set(Math.cos(electron.angle) * electron.radius, Math.sin(electron.angle) * electron.radius, 0)
              .applyQuaternion(electron.orbit);
            if (valenceFocusRef.current && electron.mesh === state.valenceElectrons) {
              dummy.scale.setScalar(1.42);
            } else {
              dummy.scale.setScalar(1);
            }
            dummy.updateMatrix();
            electron.mesh.setMatrixAt(electron.instance, dummy.matrix);
          });
          if (state.innerElectrons && updateInner) state.innerElectrons.instanceMatrix.needsUpdate = true;
          if (state.valenceElectrons) state.valenceElectrons.instanceMatrix.needsUpdate = true;
        } else {
          state.orbitalMeshes.forEach((mesh) => {
            if (mesh.visible) {
              mesh.rotation.y += delta * 0.12;
            }
          });
        }
        state.dirty = true;
      }
      if (controls.update(delta)) state.dirty = true;
      if (state.dirty) {
        renderer.render(scene, camera);
        state.dirty = moving;
      }
    };
    animate();
    resize();

    const contextLost = (event: Event) => { event.preventDefault(); setFallback(true); };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    return () => {
      cancelAnimationFrame(state.frame);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener("keydown", onCanvasKey);
      state.resizeObserver.disconnect();
      state.intersectionObserver.disconnect();
      controls.dispose();
      clearGroup(atom);
      state.timer.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
      renderer.domElement.remove();
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    clearGroup(state.atom);
    state.electronData = [];
    state.shells = [];
    state.nucleusMeshes = [];
    state.orbitalMeshes.clear();

    const neutronCount = activeNeutrons;
    const nucleusTotal = Math.max(1, element.atomicNumber + neutronCount);
    const particleSize = THREE.MathUtils.clamp(.245 - Math.log10(nucleusTotal + 1) * .052, .108, .215);
    const positions = generateNucleusPositions(nucleusTotal, particleSize, element.atomicNumber + neutronOffset);
    let maxClusterRadius = particleSize;
    positions.forEach((pos) => {
      const d = pos.length() + particleSize;
      if (d > maxClusterRadius) maxClusterRadius = d;
    });

    const isMobile = typeof window !== "undefined" && (window.innerWidth <= 768 || window.matchMedia("(max-width: 768px)").matches);
    const maxNucleons = isMobile ? Math.min(nucleusTotal, 110) : nucleusTotal;
    const renderedProtons = Math.min(element.atomicNumber, Math.round(maxNucleons * (element.atomicNumber / nucleusTotal)));
    const renderedNeutrons = maxNucleons - renderedProtons;
    const isDenseNucleus = nucleusTotal > 40;
    const isUltraDense = nucleusTotal > 90;
    const nSegmentsWidth = isUltraDense ? 8 : isDenseNucleus ? 12 : 20;
    const nSegmentsHeight = isUltraDense ? 6 : isDenseNucleus ? 8 : 14;
    const particleGeometry = new THREE.SphereGeometry(particleSize, nSegmentsWidth, nSegmentsHeight);
    const protonMaterial = new THREE.MeshPhongMaterial({ color: 0xef7765, specular: 0x222222, shininess: 24 });
    const neutronMaterial = new THREE.MeshPhongMaterial({ color: 0x587583, specular: 0x222222, shininess: 20 });
    const protons = new THREE.InstancedMesh(particleGeometry, protonMaterial, renderedProtons);
    const neutrons = new THREE.InstancedMesh(particleGeometry, neutronMaterial, renderedNeutrons);
    let protonIndex = 0;
    let neutronIndex = 0;
    for (let slot = 0; slot < maxNucleons; slot += 1) {
      const expectedProtons = Math.round(((slot + 1) * renderedProtons) / maxNucleons);
      const isProton = protonIndex < expectedProtons && protonIndex < renderedProtons;
      dummy.position.copy(positions[slot]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      if (isProton) {
        protons.setMatrixAt(protonIndex++, dummy.matrix);
      } else if (neutronIndex < renderedNeutrons) {
        neutrons.setMatrixAt(neutronIndex++, dummy.matrix);
      }
    }
    const nucleusGlow = new THREE.Mesh(
      new THREE.SphereGeometry(maxClusterRadius * 1.12, isUltraDense ? 10 : isDenseNucleus ? 14 : 24, isUltraDense ? 8 : isDenseNucleus ? 10 : 18),
      new THREE.MeshBasicMaterial({ color: 0x9bd8d0, transparent: true, opacity: .055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }),
    );
    const nucleusLight = isUltraDense
      ? new THREE.AmbientLight(0xf4a291, 0.5)
      : new THREE.PointLight(0xf4a291, 1.8, 5.5, 2);
    state.atom.add(nucleusGlow, nucleusLight, protons, neutrons);
    state.nucleusMeshes = [nucleusGlow, protons, neutrons];

    const shellsToRender = activeShells;
    const innerCount = shellsToRender.slice(0, -1).reduce((sum, count) => sum + count, 0);
    const outerCount = shellsToRender.at(-1) ?? 0;
    const electronSize = THREE.MathUtils.clamp(.128 - element.atomicNumber * .00035, .082, .124);
    const electronGeometry = new THREE.SphereGeometry(
      electronSize,
      element.atomicNumber > 60 ? 8 : element.atomicNumber > 30 ? 10 : 16,
      element.atomicNumber > 60 ? 6 : element.atomicNumber > 30 ? 8 : 12,
    );
    const innerMaterial = new THREE.MeshPhongMaterial({ color: 0x78c9e8, emissive: 0x1a7199, specular: 0x333333, shininess: 28 });
    const valenceMaterial = new THREE.MeshPhongMaterial({ color: 0xb68af0, emissive: 0x6840b1, specular: 0x444444, shininess: 34 });
    state.innerElectrons = new THREE.InstancedMesh(electronGeometry, innerMaterial, innerCount);
    state.valenceElectrons = new THREE.InstancedMesh(electronGeometry, valenceMaterial, outerCount);
    state.atom.add(state.innerElectrons, state.valenceElectrons);

    let innerInstance = 0;
    let valenceInstance = 0;
    shellsToRender.forEach((count, shellIndex) => {
      const radius = shellRadius(shellsToRender.length, shellIndex);
      const points = Array.from({ length: 128 }, (_, index) => {
        const angle = (index / 128) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      });
      const ringGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const isValence = shellIndex === shellsToRender.length - 1;
      const ring = new THREE.LineLoop(
        ringGeometry,
        new THREE.LineBasicMaterial({
          color: isValence ? 0xae7aff : 0x38bdf8,
          transparent: true,
          opacity: isValence ? 0.68 : 0.58,
          depthWrite: false,
        }),
      );
      ring.rotation.set(
        .62 + (shellIndex % 3) * .24,
        (shellIndex - (shellsToRender.length - 1) / 2) * .12,
        (shellIndex % 2 ? -1 : 1) * (.18 + shellIndex * .1),
      );
      const orbit = ring.quaternion.clone();
      state.atom.add(ring);
      state.shells.push(ring);
      const target = shellIndex === shellsToRender.length - 1 ? state.valenceElectrons! : state.innerElectrons!;
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count + shellIndex * 0.43;
        const instance = target === state.valenceElectrons ? valenceInstance++ : innerInstance++;
        const electron = { mesh: target, instance, radius, angle, speed: .22 + .055 * (shellsToRender.length - shellIndex), orbit };
        state.electronData.push(electron);
        dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0).applyQuaternion(orbit);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        target.setMatrixAt(instance, dummy.matrix);
      }
    });
    state.innerElectrons.instanceMatrix.needsUpdate = true;
    state.valenceElectrons.instanceMatrix.needsUpdate = true;

    // Parse 3D Quantum Orbital configurations (clouds generated on-demand in orbital mode)
    const parsedSubshells = parseElectronConfiguration(element.electronConfiguration, element);
    setSubshells(parsedSubshells);

    state.camera.position.set(0, .55, viewingDistance(state, Math.max(1, shellsToRender.length)));
    state.controls.target.set(0, 0, 0);
    state.controls.update();
    state.dirty = true;
  }, [element, activeNeutrons, neutronOffset, ionCharge]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setActiveSubshell("all");
    setSelected(null);
    setGuideOpen(false);
    setShellsVisible(true);
    setNucleusFocus(false);
    setValenceFocus(false);
  }, [element]);

  useEffect(() => {
    if (highlightRequest > 0) {
      setViewMode("bohr");
      setNucleusFocus(false);
      setShellsVisible(true);
      setValenceFocus(true);
      setGuideOpen(false);
      setIonCharge(0);
      setNeutronOffset(0);
      setIonLabOpen(false);
    }
  }, [highlightRequest]);

  useEffect(() => {
    if (initialTool === "ion-lab") setIonLabOpen(true);
    if (initialTool === "structure-guide") { setGuideOpen(true); setSelected("nucleus"); }
  }, [initialTool]);

  // Update Bohr vs Orbital Mode visibility (lazily creates orbital point clouds)
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    const isBohr = viewMode === "bohr";

    if (!isBohr && state.orbitalMeshes.size === 0 && subshells.length > 0) {
      subshells.forEach((subshell) => {
        const cloudPositions = generateOrbitalCloudPoints(subshell, 500);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(cloudPositions, 3));
        const color = SUBSHELL_COLORS[subshell.type].main;
        const material = new THREE.PointsMaterial({
          color,
          size: 0.07,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const orbitalPoints = new THREE.Points(geometry, material);
        state.atom.add(orbitalPoints);
        state.orbitalMeshes.set(subshell.label, orbitalPoints);
      });
    }

    // Bohr components
    state.shells.forEach((shell) => { shell.visible = isBohr && shellsVisible && !nucleusFocus; });
    if (state.innerElectrons) state.innerElectrons.visible = isBohr && !nucleusFocus;
    if (state.valenceElectrons) state.valenceElectrons.visible = isBohr && !nucleusFocus;

    // Orbital clouds (supports "all", exact subshell label like "2p", or block type like "type:p")
    state.orbitalMeshes.forEach((mesh, label) => {
      if (isBohr) {
        mesh.visible = false;
        return;
      }
      if (activeSubshell === "all") {
        mesh.visible = true;
      } else if (activeSubshell.startsWith("type:")) {
        const blockType = activeSubshell.slice(5);
        mesh.visible = label.includes(blockType);
      } else {
        mesh.visible = activeSubshell === label;
      }
    });

    state.dirty = true;
  }, [viewMode, activeSubshell, shellsVisible, nucleusFocus, subshells]);

  useEffect(() => {
    valenceFocusRef.current = valenceFocus;
    const state = stateRef.current;
    if (!state || viewMode !== "bohr") return;
    const innerMaterial = state.innerElectrons?.material as THREE.MeshStandardMaterial | undefined;
    if (innerMaterial) { innerMaterial.transparent = valenceFocus; innerMaterial.opacity = valenceFocus ? 0.13 : 1; }
    state.shells.forEach((shell, index) => {
      const isValence = index === state.shells.length - 1;
      const material = (shell as THREE.Line).material as THREE.LineBasicMaterial;
      material.opacity = valenceFocus && !isValence ? 0.12 : isValence ? 0.80 : 0.58;
    });
    state.dirty = true;
  }, [valenceFocus, viewMode, element, activeNeutrons, ionCharge]);

  const zoomIn = () => {
    const state = stateRef.current;
    if (!state) return;
    state.camera.position.multiplyScalar(0.84);
    state.camera.position.clampLength(3, 26);
    state.dirty = true;
  };

  const zoomOut = () => {
    const state = stateRef.current;
    if (!state) return;
    state.camera.position.multiplyScalar(1.18);
    state.camera.position.clampLength(3, 26);
    state.dirty = true;
  };

  const focusNucleus = () => {
    const next = !nucleusFocus;
    setNucleusFocus(next);
    const state = stateRef.current;
    if (!state) return;
    if (viewMode === "bohr") {
      state.shells.forEach((shell) => { shell.visible = !next && shellsVisible; });
      if (state.innerElectrons) state.innerElectrons.visible = !next;
      if (state.valenceElectrons) state.valenceElectrons.visible = !next;
    }
    state.camera.position.set(0, .3, next ? 4.1 : viewingDistance(state, Math.max(1, activeShells.length)));
    state.dirty = true;
    if (next) { setSelected("nucleus"); setGuideOpen(true); }
    else if (selected === "nucleus") setSelected(null);
  };

  const reset = () => {
    const state = stateRef.current;
    if (!state) return;
    setViewMode("bohr");
    setActiveSubshell("all");
    setShellsVisible(true);
    setNucleusFocus(false);
    setValenceFocus(false);
    setSelected(null);
    setGuideOpen(false);
    setIonCharge(0);
    setNeutronOffset(0);
    setIonLabOpen(false);
    state.atom.rotation.set(-.12, -.2, .03);
    state.shells.forEach((shell) => { shell.visible = true; });
    if (state.innerElectrons) state.innerElectrons.visible = true;
    if (state.valenceElectrons) state.valenceElectrons.visible = true;
    state.orbitalMeshes.forEach((mesh) => { mesh.visible = false; });
    state.camera.position.set(0, .55, viewingDistance(state, Math.max(1, element.shells.length)));
    state.controls.target.set(0, 0, 0);
    state.dirty = true;
  };

  const availableOrbitalTypes = Array.from(new Set(subshells.map((s) => s.type)));
  const cycleOrbitalType = () => {
    const sequence = ["all", ...availableOrbitalTypes.map((t) => `type:${t}`)];
    const currentIndex = sequence.indexOf(activeSubshell);
    const next = sequence[(currentIndex + 1) % sequence.length];
    setActiveSubshell(next);
  };

  const tools = [
    { label: "Zoom in", icon: ZoomIn, active: false, action: zoomIn },
    { label: "Zoom out", icon: ZoomOut, active: false, action: zoomOut },
    {
      label: viewMode === "bohr" ? "Shells" : activeSubshell === "all" ? "Subshells" : `${activeSubshell.replace("type:", "")}-cloud`,
      icon: viewMode === "bohr" ? Orbit : Layers,
      active: viewMode === "bohr" ? shellsVisible : activeSubshell !== "all",
      action: () => {
        if (viewMode === "bohr") setShellsVisible((value) => !value);
        else cycleOrbitalType();
      },
    },
    { label: "Nucleus", icon: Focus, active: nucleusFocus, action: focusNucleus },
    { label: "Valence", icon: CircleDot, active: valenceFocus, action: () => { setViewMode("bohr"); setNucleusFocus(false); setValenceFocus(viewMode !== "bohr" || !valenceFocus); setSelected("valence"); setGuideOpen(true); } },
    { label: "Compare", icon: GitCompareArrows, active: compareActive, action: onCompare },
    { label: "Reset", icon: Atom, active: false, action: reset },
  ];

  const isModifiedSpecies = ionCharge !== 0 || neutronOffset !== 0;

  return (
    <section className={`viewer-shell ${mobileScrollLock ? "scroll-locked" : ""}`} aria-label={`${element.name} interactive atomic viewer`}>
      <div className="mobile-element-summary"><div><strong>{element.name}</strong><span>{element.symbol}{formatChargeSuperscript(ionCharge)} · Atomic number {element.atomicNumber}</span></div><span>{activeShells.length} shells · {activeShells.at(-1) ?? 0} outer e⁻</span></div>
      <div className="viewer-aura" style={{ "--element-color": element.cpkColor } as React.CSSProperties} />

      {/* Model View Mode Switcher Header with integrated Model Note tooltip */}
      <div
        className="viewer-view-switcher"
        role="tablist"
        aria-label="Atomic model representation"
        onMouseLeave={() => setHoveredMode(null)}
      >
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === "bohr"}
          className={`switcher-btn ${viewMode === "bohr" ? "active" : ""}`}
          onClick={(e) => {
            setViewMode("bohr");
            e.currentTarget.blur();
          }}
          onMouseEnter={() => setHoveredMode("bohr")}
        >
          <Orbit size={15} /> <span>Bohr Shells</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === "orbital"}
          className={`switcher-btn ${viewMode === "orbital" ? "active" : ""}`}
          onClick={(e) => {
            setViewMode("orbital");
            setSelected("orbitals");
            e.currentTarget.blur();
          }}
          onMouseEnter={() => setHoveredMode("orbital")}
        >
          <Layers size={15} /> <span>Quantum Orbitals</span>
        </button>

        <div
          className="switcher-tooltip"
          role="tooltip"
          aria-live="polite"
        >
          <span className="switcher-tooltip-title">
            <Info size={11} /> Model note · {(hoveredMode ?? viewMode) === "bohr" ? "Bohr Shells" : "Quantum Orbitals"}
          </span>
          <p>
            {(hoveredMode ?? viewMode) === "bohr"
              ? "Bohr shell orbits show particle counts—not quantum orbital probability shapes."
              : `Quantum cloud density represents |ψ|² electron probability distributions for ${element.electronConfiguration}.`}
          </p>
        </div>
      </div>

      <div className="atom-mount" ref={mountRef}>{fallback && <FallbackAtom element={element} highlighted={valenceFocus} />}</div>
      <div className="mobile-scroll-gutter" aria-hidden="true" />

      {/* Mobile Touch Scroll vs Orbit Toggle */}
      <button
        type="button"
        className={`mobile-touch-guard ${mobileScrollLock ? "locked" : ""}`}
        onClick={() => setMobileScrollLock((v) => !v)}
        aria-pressed={mobileScrollLock}
        title={mobileScrollLock ? "Tap to enable 3D touch orbit" : "Tap to lock 3D canvas for vertical page scrolling"}
      >
        <Hand size={13} />
        <span>{mobileScrollLock ? "Touch: Scroll" : "Touch: Orbit"}</span>
      </button>

      {/* Interactive Ion & Isotope Builder Panel */}
      {!ionLabOpen ? (
        <button
          type="button"
          className={`ion-lab-trigger ${isModifiedSpecies ? "modified" : ""}`}
          onClick={() => setIonLabOpen(true)}
          aria-expanded="false"
        >
          <SlidersHorizontal size={13} />
          <span>
            {isModifiedSpecies
              ? `${element.symbol}-${activeMassNumber}${formatChargeSuperscript(ionCharge)}`
              : "Ion & Isotope Lab"}
          </span>
        </button>
      ) : (
        <aside className="ion-isotope-panel" aria-label="Ion and Isotope Builder">
          <header className="ion-lab-header">
            <div>
              <small>Ion & Isotope Lab</small>
              <strong>
                <sup>{activeMassNumber}</sup>
                {element.symbol}
                <sup>{formatChargeSuperscript(ionCharge)}</sup>
              </strong>
            </div>
            <div className="ion-lab-header-actions">
              {isModifiedSpecies && (
                <button
                  type="button"
                  className="ion-lab-reset"
                  onClick={() => {
                    setIonCharge(0);
                    setNeutronOffset(0);
                  }}
                >
                  Ground state
                </button>
              )}
              <button
                type="button"
                className="ion-lab-close"
                onClick={() => setIonLabOpen(false)}
                aria-label="Close Ion and Isotope Lab"
              >
                <X size={14} />
              </button>
            </div>
          </header>

          <div className="ion-lab-controls">
            <div className="ion-lab-row">
              <div className="ion-lab-label">
                <span>Ion Charge (q)</span>
                <small>
                  {ionCharge === 0
                    ? `Neutral (${totalElectrons} e⁻)`
                    : ionCharge > 0
                      ? `Cation +${ionCharge} (${totalElectrons} e⁻)`
                      : `Anion ${ionCharge} (${totalElectrons} e⁻)`}
                </small>
              </div>
              <div className="ion-lab-stepper">
                <button
                  type="button"
                  onClick={() => setIonCharge((q) => Math.max(-3, q - 1))}
                  disabled={ionCharge <= -3}
                  aria-label="Add electron (make more negative)"
                  title="Add electron (anion)"
                >
                  <Minus size={13} />
                </button>
                <b>{ionCharge > 0 ? `+${ionCharge}` : ionCharge}</b>
                <button
                  type="button"
                  onClick={() => setIonCharge((q) => Math.min(Math.min(4, element.atomicNumber), q + 1))}
                  disabled={ionCharge >= Math.min(4, element.atomicNumber)}
                  aria-label="Remove electron (make more positive)"
                  title="Remove electron (cation)"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            <div className="ion-lab-row">
              <div className="ion-lab-label">
                <span>Isotope Mass (A = {activeMassNumber})</span>
                <small>{element.atomicNumber} p⁺ · {activeNeutrons} n⁰</small>
              </div>
              <div className="ion-lab-stepper">
                <button
                  type="button"
                  onClick={() => setNeutronOffset((n) => Math.max(-baseNeutrons, n - 1))}
                  disabled={activeNeutrons <= 0}
                  aria-label="Remove neutron"
                >
                  <Minus size={13} />
                </button>
                <b>{element.symbol}-{activeMassNumber}</b>
                <button
                  type="button"
                  onClick={() => setNeutronOffset((n) => Math.min(8, n + 1))}
                  disabled={neutronOffset >= 8}
                  aria-label="Add neutron"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          <footer className="ion-lab-footer">
            <span className={`stability-badge ${isotopeStability.stable ? "stable" : "unstable"}`}>
              <i /> {isotopeStability.label}
            </span>
          </footer>
        </aside>
      )}

      {/* Subshell Chips & Legend overlay when in Orbital Mode */}
      {viewMode === "orbital" && (
        <div className="orbital-bar" aria-label="Quantum subshell orbital selector">
          <div className="subshell-chips">
            <button
              type="button"
              className={`chip ${activeSubshell === "all" ? "active" : ""}`}
              onClick={() => setActiveSubshell("all")}
            >
              All subshells
            </button>
            {availableOrbitalTypes.map((type) => (
              <button
                key={`type-${type}`}
                type="button"
                className={`chip subshell-${type} ${activeSubshell === `type:${type}` ? "active" : ""}`}
                onClick={() => setActiveSubshell(`type:${type}`)}
                style={{ "--subshell-color": SUBSHELL_COLORS[type].hex } as React.CSSProperties}
              >
                <i className="chip-dot" /> {type}-block
              </button>
            ))}
            {subshells.map((s) => (
              <button
                key={s.label}
                type="button"
                className={`chip subshell-${s.type} ${activeSubshell === s.label ? "active" : ""}`}
                onClick={() => setActiveSubshell(s.label)}
                style={{ "--subshell-color": SUBSHELL_COLORS[s.type].hex } as React.CSSProperties}
              >
                <i className="chip-dot" /> {s.label} <sup>{s.electrons}</sup>
              </button>
            ))}
          </div>

          <div className="orbital-legend">
            {Object.entries(SUBSHELL_COLORS).map(([type, info]) => (
              <span key={type} className="legend-item">
                <i style={{ backgroundColor: info.hex }} />
                {info.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="viewer-tools" aria-label="Atomic viewer tools">
        {tools.map(({ label, icon: Icon, active, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className={`${active ? "active" : ""} ${["Zoom in", "Zoom out", "Valence"].includes(label) ? "essential-tool" : "advanced-tool"}`}
            aria-pressed={active}
            aria-label={label}
            title={label}
            data-tooltip={label}
          >
            <Icon size={18} /><span>{label}</span>
          </button>
        ))}
        <button type="button" className="mobile-more-controls" onClick={() => setMoreOpen(true)} aria-haspopup="dialog"><SlidersHorizontal size={18} /><span>More</span></button>
      </div>
      {moreOpen && <Dialog title="More viewer controls" onClose={() => setMoreOpen(false)} className="viewer-controls-dialog">
        <p>Adjust the model or explore how electrons and neutrons change an atom.</p>
        <div className="advanced-controls-grid">{tools.filter((tool) => !["Zoom in", "Zoom out", "Valence"].includes(tool.label)).map(({ label, icon: Icon, active, action }) => <button key={label} type="button" aria-pressed={active} onClick={() => { action(); setMoreOpen(false); }}><Icon size={18} />{label}</button>)}
          <button type="button" onClick={() => { setMoreOpen(false); setIonLabOpen(true); }}><SlidersHorizontal size={18} />Ion & Isotope Lab</button>
        </div>
        <div className="concept-row">Valence electrons <ConceptHelp concept="valence" /></div>
      </Dialog>}

      <aside className={`structure-guide ${guideOpen ? "open" : ""}`} onKeyDown={(event) => { if (event.key === "Escape") { setGuideOpen(false); setSelected(null); } }}>
        {!guideOpen ? (
          <button className="structure-guide-toggle" onClick={() => { setGuideOpen(true); setSelected(viewMode === "orbital" ? "orbitals" : "nucleus"); }} aria-expanded="false" aria-controls="structure-guide-panel">
            <BookOpen size={14} /> Structure guide
          </button>
        ) : (
          <div id="structure-guide-panel">
            <header><span><BookOpen size={14} /> Structure guide</span><button onClick={() => { setGuideOpen(false); setSelected(null); }} aria-label="Close structure guide"><X size={15} /></button></header>
            <div className="structure-options" role="tablist" aria-label="Atomic structure details">
              {(["nucleus", "proton", "neutron", "electron", "valence", "orbitals"] as StructureKey[]).filter((key) => key !== "neutron" || activeNeutrons > 0).map((key) => (
                <button key={key} role="tab" aria-selected={selected === key} className={`${key} ${selected === key ? "active" : ""}`} onClick={() => setSelected(key)}>{structureCopy[key].label}</button>
              ))}
            </div>
            {selected && <div className="structure-guide-copy" role="tabpanel" aria-live="polite"><strong>{structureCopy[selected].label}</strong><p>{structureCopy[selected].detail(element)}</p></div>}
          </div>
        )}
      </aside>

      <div className="viewer-caption">
        <span>
          {viewMode === "bohr"
            ? isModifiedSpecies
              ? `Modified ${ionCharge !== 0 ? (ionCharge > 0 ? "cation" : "anion") : "isotope"} · ${element.symbol}-${activeMassNumber}${formatChargeSuperscript(ionCharge)}`
              : "Simplified shell model"
            : "Quantum subshell configuration"}
        </span>
        <strong>
          {viewMode === "bohr"
            ? activeShells.length > 0
              ? `${activeShells.join(" · ")} (${totalElectrons} ${totalElectrons === 1 ? "electron" : "electrons"})`
              : "0 electrons (bare nucleus)"
            : formatElectronConfig(element.electronConfiguration)}
        </strong>
      </div>
      <button className="auto-rotate" onClick={() => onAutoRotate(!autoRotate)} aria-pressed={autoRotate}><RotateCcw size={14} /> Auto rotate <span className={autoRotate ? "switch on" : "switch"}><i /></span></button>
      <div className="atomic-stamp">
        <small>{element.atomicNumber}</small>
        <b>
          {element.symbol}
          {ionCharge !== 0 && <sup className="stamp-charge">{formatChargeSuperscript(ionCharge)}</sup>}
        </b>
        <span>{neutronOffset !== 0 ? `${element.name}-${activeMassNumber}` : element.name}</span>
      </div>
    </section>
  );
}

