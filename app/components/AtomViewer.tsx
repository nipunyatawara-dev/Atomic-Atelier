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
  Info,
  Layers,
  Orbit,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { formatElectronConfig } from "../lib/formula";
import type { ElementRecord } from "../lib/types";
import {
  generateOrbitalCloudPoints,
  parseElectronConfiguration,
  SUBSHELL_COLORS,
  type SubshellInfo,
} from "../lib/orbitals";

type ViewMode = "bohr" | "orbital";
type StructureKey = "nucleus" | "proton" | "neutron" | "electron" | "valence" | "orbitals";

type SceneState = {
  container: HTMLDivElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  atom: THREE.Group;
  resizeObserver: ResizeObserver;
  intersectionObserver: IntersectionObserver;
  electronData: Array<{ mesh: THREE.InstancedMesh; shellRadius: number; speed: number; angle: number; inclination: number; phase: number }>;
  shells: THREE.LineLoop[];
  nucleusMeshes: THREE.Mesh[];
  innerElectrons: THREE.InstancedMesh | null;
  valenceElectrons: THREE.InstancedMesh | null;
  orbitalMeshes: Map<string, THREE.Points>;
};

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

function shellRadius(element: ElementRecord, shellIndex: number) {
  const compression = THREE.MathUtils.clamp((element.shells.length - 3) / 4, 0, 1);
  const spacing = THREE.MathUtils.lerp(.69, .52, compression);
  return 1.48 + shellIndex * spacing;
}

function viewingDistance(state: ViewerState, element: ElementRecord) {
  const outerRadius = shellRadius(element, Math.max(0, element.shells.length - 1)) + .2;
  const fittedDistance = (outerRadius / Math.tan(THREE.MathUtils.degToRad(16))) * 1.08;
  const narrowViewportCompensation = Math.min(1, Math.max(.7, state.camera.aspect));
  return Math.max(8.8, fittedDistance) / narrowViewportCompensation;
}

function clearGroup(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    }
  });
  group.clear();
}

function FallbackAtom({ element }: { element: ElementRecord }) {
  return (
    <div className="atom-fallback" role="img" aria-label={`Simplified shell diagram for ${element.name}`}>
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
}: {
  element: ElementRecord;
  autoRotate: boolean;
  onAutoRotate: (value: boolean) => void;
  compareActive: boolean;
  onCompare: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<ViewerState | null>(null);
  const autoRotateRef = useRef(autoRotate);
  const valenceFocusRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const [fallback, setFallback] = useState(false);
  const [selected, setSelected] = useState<StructureKey | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [shellsVisible, setShellsVisible] = useState(true);
  const [nucleusFocus, setNucleusFocus] = useState(false);
  const [valenceFocus, setValenceFocus] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("bohr");
  const viewModeRef = useRef<ViewMode>("bohr");
  const [activeSubshell, setActiveSubshell] = useState<string>("all");
  const [subshells, setSubshells] = useState<SubshellInfo[]>([]);
  const [hoveredMode, setHoveredMode] = useState<ViewMode | null>(null);

  useEffect(() => { autoRotateRef.current = autoRotate; if (stateRef.current) stateRef.current.dirty = true; }, [autoRotate]);
  useEffect(() => { viewModeRef.current = viewMode; if (stateRef.current) stateRef.current.dirty = true; }, [viewMode]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    const rim = new THREE.PointLight(0x8f79ff, 6.5, 18);
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
      if (["+", "=", "-"].includes(event.key)) {
        event.preventDefault();
        camera.position.multiplyScalar(event.key === "-" ? 1.12 : .88).clampLength(3, 26);
        state.dirty = true;
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
          state.electronData.forEach((electron) => {
            electron.angle += delta * electron.speed;
            dummy.position
              .set(Math.cos(electron.angle) * electron.radius, Math.sin(electron.angle) * electron.radius, 0)
              .applyQuaternion(electron.orbit);
            dummy.scale.setScalar(electron.mesh === state.valenceElectrons && valenceFocusRef.current ? 1.42 : 1);
            dummy.updateMatrix();
            electron.mesh.setMatrixAt(electron.instance, dummy.matrix);
          });
          if (state.innerElectrons) state.innerElectrons.instanceMatrix.needsUpdate = true;
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

    const neutronCount = element.neutrons ?? 0;
    const nucleusTotal = Math.max(1, element.atomicNumber + neutronCount);
    const particleSize = THREE.MathUtils.clamp(.245 - Math.log10(nucleusTotal + 1) * .052, .108, .215);
    const positions = generateNucleusPositions(nucleusTotal, particleSize, element.atomicNumber);
    let maxClusterRadius = particleSize;
    positions.forEach((pos) => {
      const d = pos.length() + particleSize;
      if (d > maxClusterRadius) maxClusterRadius = d;
    });

    const particleGeometry = new THREE.SphereGeometry(particleSize, 32, 24);
    const protonMaterial = new THREE.MeshPhysicalMaterial({ color: 0xef7765, roughness: 0.38, metalness: 0.02, clearcoat: 0.25, clearcoatRoughness: 0.45 });
    const neutronMaterial = new THREE.MeshPhysicalMaterial({ color: 0x587583, roughness: 0.42, metalness: 0.05, clearcoat: 0.20, clearcoatRoughness: 0.50 });
    const protons = new THREE.InstancedMesh(particleGeometry, protonMaterial, element.atomicNumber);
    const neutrons = new THREE.InstancedMesh(particleGeometry.clone(), neutronMaterial, neutronCount);
    let protonIndex = 0;
    let neutronIndex = 0;
    for (let slot = 0; slot < nucleusTotal; slot += 1) {
      const expectedProtons = Math.round(((slot + 1) * element.atomicNumber) / nucleusTotal);
      const isProton = protonIndex < expectedProtons && protonIndex < element.atomicNumber;
      dummy.position.copy(positions[slot]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      if (isProton) {
        protons.setMatrixAt(protonIndex++, dummy.matrix);
      } else if (neutronIndex < neutronCount) {
        neutrons.setMatrixAt(neutronIndex++, dummy.matrix);
      }
    }
    const nucleusGlow = new THREE.Mesh(
      new THREE.SphereGeometry(maxClusterRadius * 1.12, 36, 28),
      new THREE.MeshBasicMaterial({ color: 0x9bd8d0, transparent: true, opacity: .055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }),
    );
    const nucleusLight = new THREE.PointLight(0xf4a291, 1.8, 5.5, 2);
    state.atom.add(nucleusGlow, nucleusLight, protons, neutrons);
    state.nucleusMeshes = [nucleusGlow, protons, neutrons];

    const innerCount = element.shells.slice(0, -1).reduce((sum, count) => sum + count, 0);
    const outerCount = element.shells.at(-1) ?? 0;
    const electronSize = THREE.MathUtils.clamp(.128 - element.atomicNumber * .00035, .082, .124);
    const electronGeometry = new THREE.SphereGeometry(electronSize, 28, 20);
    const innerMaterial = new THREE.MeshPhysicalMaterial({ color: 0x78c9e8, emissive: 0x1a7199, emissiveIntensity: 1.4, roughness: 0.30, clearcoat: 0.35, clearcoatRoughness: 0.35 });
    const valenceMaterial = new THREE.MeshPhysicalMaterial({ color: 0xb68af0, emissive: 0x6840b1, emissiveIntensity: 1.8, roughness: 0.28, clearcoat: 0.40, clearcoatRoughness: 0.35 });
    state.innerElectrons = new THREE.InstancedMesh(electronGeometry, innerMaterial, innerCount);
    state.valenceElectrons = new THREE.InstancedMesh(electronGeometry.clone(), valenceMaterial, outerCount);
    state.atom.add(state.innerElectrons, state.valenceElectrons);

    let innerInstance = 0;
    let valenceInstance = 0;
    element.shells.forEach((count, shellIndex) => {
      const radius = shellRadius(element, shellIndex);
      const points = Array.from({ length: 150 }, (_, index) => {
        const angle = (index / 150) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      });
      const ringGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const isValence = shellIndex === element.shells.length - 1;
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
        (shellIndex - (element.shells.length - 1) / 2) * .12,
        (shellIndex % 2 ? -1 : 1) * (.18 + shellIndex * .1),
      );
      const orbit = ring.quaternion.clone();
      state.atom.add(ring);
      state.shells.push(ring);
      const target = shellIndex === element.shells.length - 1 ? state.valenceElectrons! : state.innerElectrons!;
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count + shellIndex * 0.43;
        const instance = target === state.valenceElectrons ? valenceInstance++ : innerInstance++;
        const electron = { mesh: target, instance, radius, angle, speed: .22 + .055 * (element.shells.length - shellIndex), orbit };
        state.electronData.push(electron);
        dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0).applyQuaternion(orbit);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        target.setMatrixAt(instance, dummy.matrix);
      }
    });
    state.innerElectrons.instanceMatrix.needsUpdate = true;
    state.valenceElectrons.instanceMatrix.needsUpdate = true;

    // Create 3D Quantum Orbital Probability Cloud Meshes
    const parsedSubshells = parseElectronConfiguration(element.electronConfiguration, element);
    setSubshells(parsedSubshells);
    setActiveSubshell("all");

    parsedSubshells.forEach((subshell) => {
      const cloudPositions = generateOrbitalCloudPoints(subshell, 650);
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
      orbitalPoints.visible = false;
      state.atom.add(orbitalPoints);
      state.orbitalMeshes.set(subshell.label, orbitalPoints);
    });

    state.camera.position.set(0, .55, viewingDistance(state, element));
    state.controls.target.set(0, 0, 0);
    state.controls.update();
    state.dirty = true;
    setSelected(null);
    setGuideOpen(false);
    setShellsVisible(true);
    setNucleusFocus(false);
    setValenceFocus(false);
  }, [element]);

  // Update Bohr vs Orbital Mode visibility
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    const isBohr = viewMode === "bohr";

    // Bohr components
    state.shells.forEach((shell) => { shell.visible = isBohr && shellsVisible && !nucleusFocus; });
    if (state.innerElectrons) state.innerElectrons.visible = isBohr && !nucleusFocus;
    if (state.valenceElectrons) state.valenceElectrons.visible = isBohr && !nucleusFocus;

    // Orbital clouds
    state.orbitalMeshes.forEach((mesh, label) => {
      mesh.visible = !isBohr && (activeSubshell === "all" || activeSubshell === label);
    });

    state.dirty = true;
  }, [viewMode, activeSubshell, shellsVisible, nucleusFocus]);

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
  }, [valenceFocus, viewMode]);

  const zoom = () => {
    const state = stateRef.current;
    if (!state) return;
    state.camera.position.multiplyScalar(0.86);
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
    state.camera.position.set(0, .3, next ? 4.1 : viewingDistance(state, element));
    state.dirty = true;
    if (next) { setSelected("nucleus"); setGuideOpen(true); }
    else if (selected === "nucleus") setSelected(null);
  };

  const reset = () => {
    const state = stateRef.current;
    if (!state) return;
    setViewMode("bohr"); setActiveSubshell("all"); setShellsVisible(true); setNucleusFocus(false); setValenceFocus(false); setSelected(null); setGuideOpen(false);
    state.atom.rotation.set(-.12, -.2, .03);
    state.shells.forEach((shell) => { shell.visible = true; });
    if (state.innerElectrons) state.innerElectrons.visible = true;
    if (state.valenceElectrons) state.valenceElectrons.visible = true;
    state.orbitalMeshes.forEach((mesh) => { mesh.visible = false; });
    state.camera.position.set(0, .55, viewingDistance(state, element));
    state.controls.target.set(0, 0, 0);
    state.dirty = true;
  };

  const tools = [
    { label: "Rotate", icon: RotateCcw, active: autoRotate, action: () => onAutoRotate(!autoRotate) },
    { label: "Zoom", icon: Search, active: false, action: zoom },
    { label: viewMode === "bohr" ? "Shells" : "Orbitals", icon: Orbit, active: viewMode === "bohr" ? shellsVisible : true, action: () => {
      if (viewMode === "bohr") setShellsVisible((value) => !value);
    } },
    { label: "Nucleus", icon: Focus, active: nucleusFocus, action: focusNucleus },
    { label: "Valence", icon: CircleDot, active: valenceFocus, action: () => { setValenceFocus((value) => !value); setSelected("valence"); setGuideOpen(true); } },
    { label: "Compare", icon: GitCompareArrows, active: compareActive, action: onCompare },
    { label: "Reset", icon: Atom, active: false, action: reset },
  ];

  return (
    <section className="viewer-shell" aria-label={`${element.name} interactive atomic viewer`}>
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

      <div className="atom-mount" ref={mountRef}>{fallback && <FallbackAtom element={element} />}</div>

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
          <button key={label} type="button" onClick={action} className={active ? "active" : ""} aria-pressed={active} title={label}>
            <Icon size={18} /><span>{label}</span>
          </button>
        ))}
      </div>

      <aside className={`structure-guide ${guideOpen ? "open" : ""}`} onKeyDown={(event) => { if (event.key === "Escape") { setGuideOpen(false); setSelected(null); } }}>
        {!guideOpen ? (
          <button className="structure-guide-toggle" onClick={() => { setGuideOpen(true); setSelected(viewMode === "orbital" ? "orbitals" : "nucleus"); }} aria-expanded="false" aria-controls="structure-guide-panel">
            <BookOpen size={14} /> Structure guide
          </button>
        ) : (
          <div id="structure-guide-panel">
            <header><span><BookOpen size={14} /> Structure guide</span><button onClick={() => { setGuideOpen(false); setSelected(null); }} aria-label="Close structure guide"><X size={15} /></button></header>
            <div className="structure-options" role="tablist" aria-label="Atomic structure details">
              {(["nucleus", "proton", "neutron", "electron", "valence", "orbitals"] as StructureKey[]).filter((key) => key !== "neutron" || (element.neutrons ?? 0) > 0).map((key) => (
                <button key={key} role="tab" aria-selected={selected === key} className={`${key} ${selected === key ? "active" : ""}`} onClick={() => setSelected(key)}>{structureCopy[key].label}</button>
              ))}
            </div>
            {selected && <div className="structure-guide-copy" role="tabpanel" aria-live="polite"><strong>{structureCopy[selected].label}</strong><p>{structureCopy[selected].detail(element)}</p></div>}
          </div>
        )}
      </aside>

      <div className="viewer-caption">
        <span>{viewMode === "bohr" ? "Simplified shell model" : "Quantum subshell configuration"}</span>
        <strong>{viewMode === "bohr" ? `${element.shells.join(" · ")} ${element.atomicNumber === 1 ? "electron" : "electrons"}` : formatElectronConfig(element.electronConfiguration)}</strong>
      </div>
      <button className="auto-rotate" onClick={() => onAutoRotate(!autoRotate)} aria-pressed={autoRotate}><RotateCcw size={14} /> Auto rotate <span className={autoRotate ? "switch on" : "switch"}><i /></span></button>
      <div className="atomic-stamp"><small>{element.atomicNumber}</small><b>{element.symbol}</b><span>{element.name}</span></div>
    </section>
  );
}

