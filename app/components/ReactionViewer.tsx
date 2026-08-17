"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { Info, RotateCcw } from "lucide-react";
import type { ReactionRecord, SpeciesRecord } from "../lib/types";

const colors: Record<string, number> = {
  H: 0xf4f1e8, C: 0x4c5264, N: 0x4776d9, O: 0xe7685e, Na: 0x9b72d4, Mg: 0x74b890,
  Al: 0xa9acb8, Cl: 0x62bb78, K: 0xb26ad2, Ca: 0xd2b56b, Fe: 0xba694c, Zn: 0x798bb6, Ag: 0xc9cdd7,
};

type SceneState = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  root: THREE.Group;
  timer: THREE.Timer;
  frame: number;
  resizeObserver: ResizeObserver;
  intersectionObserver: IntersectionObserver;
  visible: boolean;
  reduced: boolean;
  dirty: boolean;
  animating: boolean;
};

function disposeGroup(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    }
  });
  group.clear();
}

function bond(a: THREE.Vector3, b: THREE.Vector3) {
  const length = a.distanceTo(b);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, length, 8), new THREE.MeshStandardMaterial({ color: 0xaeb5c5, roughness: 0.6, transparent: true, opacity: 1 }));
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  mesh.userData.kind = "bond";
  return mesh;
}

function bondMaterials(root: THREE.Group) {
  const materials: THREE.MeshStandardMaterial[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.userData.kind === "bond") materials.push(object.material as THREE.MeshStandardMaterial);
  });
  return materials;
}

function buildMolecule(species: SpeciesRecord, seed: number, identityPrefix: string, identityMap: Map<string, string>) {
  const group = new THREE.Group();
  const positions = new Map(species.atoms.map((atom) => [atom.id, new THREE.Vector3(...atom.position)]));
  species.atoms.forEach((recipe) => {
    const symbol = recipe.symbol;
    const radius = symbol === "H" ? 0.17 : symbol === "C" ? 0.27 : 0.235;
    const atom = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 18, 14),
      new THREE.MeshStandardMaterial({ color: colors[symbol] ?? 0xd39b6a, roughness: 0.36, metalness: ["Fe", "Zn", "Ag", "Al", "Mg"].includes(symbol) ? 0.28 : 0 }),
    );
    atom.position.copy(positions.get(recipe.id)!);
    atom.userData.symbol = symbol;
    atom.userData.kind = "atom";
    atom.userData.identity = identityMap.get(`${identityPrefix}:${recipe.id}`) ?? `${identityPrefix}:${recipe.id}`;
    group.add(atom);
  });
  species.bonds.forEach((recipe) => group.add(bond(positions.get(recipe.from)!, positions.get(recipe.to)!)));
  if (species.representation === "ions") group.rotation.z = seed % 2 ? .12 : -.12;
  if (species.state === "s") group.scale.set(0.92, 0.92, 0.92);
  return group;
}

function buildSide(root: THREE.Group, reaction: ReactionRecord, side: "reactant" | "product", species: SpeciesRecord[], coefficients: number[]) {
  disposeGroup(root);
  const instances = species.flatMap((item, speciesIndex) => Array.from({ length: coefficients[speciesIndex] ?? 1 }, (_, copy) => ({ item, seed: speciesIndex * 11 + copy })));
  const columns = Math.ceil(Math.sqrt(instances.length));
  const identityMap = new Map(reaction.atomMapping.map((mapping) => side === "reactant" ? [mapping.from, mapping.from] : [mapping.to, mapping.from]));
  const copyIndexes = new Map<string, number>();
  instances.forEach(({ item, seed }, index) => {
    const speciesIndex = species.indexOf(item);
    const copy = copyIndexes.get(`${speciesIndex}`) ?? 0;
    copyIndexes.set(`${speciesIndex}`, copy + 1);
    const molecule = buildMolecule(item, seed, `${side}:${speciesIndex}:${copy}`, identityMap);
    const row = Math.floor(index / columns);
    const column = index % columns;
    molecule.position.set((column - (columns - 1) / 2) * 1.55, ((instances.length - 1) / columns / 2 - row) * 1.45, (index % 2 ? 0.35 : -0.2));
    root.add(molecule);
  });
}

export function ReactionViewer({ reaction, reactantCoefficients, productCoefficients, animationRun, onAnimationComplete }: { reaction: ReactionRecord; reactantCoefficients: number[]; productCoefficients: number[]; animationRun: number; onAnimationComplete: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SceneState | null>(null);
  const [side, setSide] = useState<"reactants" | "products">("reactants");
  const reactionRef = useRef(reaction);
  const reactantRef = useRef(reactantCoefficients);
  const productRef = useRef(productCoefficients);
  const [fallback, setFallback] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tipOpen) return;
    const closeFromOutside = (event: PointerEvent) => {
      if (!tipRef.current?.contains(event.target as Node)) setTipOpen(false);
    };
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTipOpen(false);
    };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [tipOpen]);

  useEffect(() => { reactionRef.current = reaction; reactantRef.current = reactantCoefficients; productRef.current = productCoefficients; }, [reaction, reactantCoefficients, productCoefficients]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !window.matchMedia("(max-width: 760px)").matches, powerPreference: "high-performance" });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.setAttribute("aria-label", "Three-dimensional schematic of the selected reaction particles.");
    renderer.domElement.tabIndex = 0;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xf4f4ff, 0x202335, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 3.8); key.position.set(3, 5, 6); scene.add(key);
    const glow = new THREE.PointLight(0x8e77df, 18, 16); glow.position.set(-4, 0, -3); scene.add(glow);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100); camera.position.set(0, 0.6, 10);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enablePan = false; controls.enableDamping = true; controls.minDistance = 5; controls.maxDistance = 15;
    const root = new THREE.Group(); scene.add(root);
    buildSide(root, reactionRef.current, "reactant", reactionRef.current.reactants, reactantRef.current);
    const timer = new THREE.Timer();
    timer.connect(document);
    const state: SceneState = {
      renderer, scene, camera, controls, root, timer, frame: 0, resizeObserver: null!, intersectionObserver: null!, visible: true,
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches, dirty: true, animating: false,
    };
    stateRef.current = state;
    controls.addEventListener("change", () => { state.dirty = true; });
    const resize = () => { const width = Math.max(mount.clientWidth, 1); const height = Math.max(mount.clientHeight, 1); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); state.dirty = true; };
    state.resizeObserver = new ResizeObserver(resize); state.resizeObserver.observe(mount); resize();
    state.intersectionObserver = new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; state.dirty = true; }, { rootMargin: "100px" });
    state.intersectionObserver.observe(mount);
    const animate = () => {
      state.frame = requestAnimationFrame(animate);
      if (!state.visible || document.hidden) return;
      state.timer.update();
      const delta = Math.min(state.timer.getDelta(), .05);
      if (!state.reduced) { root.rotation.y += delta * .11; state.dirty = true; }
      if (controls.update(delta)) state.dirty = true;
      if (state.dirty || state.animating) renderer.render(scene, camera);
      state.dirty = !state.reduced || state.animating;
    };
    animate();
    const contextLost = (event: Event) => { event.preventDefault(); setFallback(true); };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    return () => {
      cancelAnimationFrame(state.frame); renderer.domElement.removeEventListener("webglcontextlost", contextLost); gsap.killTweensOf(root.scale);
      state.resizeObserver.disconnect(); state.intersectionObserver.disconnect(); controls.dispose(); disposeGroup(root); renderer.dispose(); renderer.domElement.remove(); stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    buildSide(state.root, reaction, "reactant", reaction.reactants, reactantCoefficients);
    state.root.scale.setScalar(1);
    state.dirty = true;
    setSide("reactants");
  }, [reaction, reactantCoefficients]);

  useEffect(() => {
    if (!animationRun) return;
    const state = stateRef.current;
    if (!state) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      buildSide(state.root, reaction, "product", reaction.products, productCoefficients);
      state.dirty = true;
      queueMicrotask(() => { setSide("products"); onAnimationComplete(); });
      return;
    }
    state.animating = true;
    const outgoingBonds = bondMaterials(state.root);
    gsap.timeline({ onComplete: () => { state.animating = false; state.dirty = true; onAnimationComplete(); } })
      .to(outgoingBonds, { opacity: 0, duration: .32, ease: "power1.in" })
      .to(state.root.scale, { x: 0.12, y: 0.12, z: 0.12, duration: 0.52, ease: "power2.in" }, "<")
      .add(() => {
        buildSide(state.root, reaction, "product", reaction.products, productCoefficients);
        bondMaterials(state.root).forEach((material) => { material.opacity = 0; });
        setSide("products"); state.root.rotation.y += Math.PI;
      })
      .to(state.root.scale, { x: 1, y: 1, z: 1, duration: 0.72, ease: "back.out(1.35)" })
      .add(() => { gsap.to(bondMaterials(state.root), { opacity: 1, duration: .3 }); }, "<.18");
  }, [animationRun, reaction, productCoefficients, onAnimationComplete]);

  return (
    <section className="reaction-viewer" aria-label={`${reaction.title} particle viewer`}>
      <div ref={mountRef} className="reaction-mount">{fallback && <div className="reaction-fallback" role="img" aria-label={`Schematic formula view for ${reaction.title}`}>{(side === "reactants" ? reaction.reactants : reaction.products).map((item) => <span key={item.formula}><b>{item.formula}</b><small>{item.label} · {item.representation}</small></span>)}</div>}</div>
      <div className="viewer-tip" ref={tipRef}>
        <button
          type="button"
          className={`viewer-tip-trigger ${tipOpen ? "active" : ""}`}
          onClick={() => setTipOpen((value) => !value)}
          aria-expanded={tipOpen}
          aria-label="Toggle schematic info tooltip"
        >
          <Info size={13} />
          <span>Schematic</span>
        </button>
        <div className={`viewer-tip-popover ${tipOpen ? "open" : ""}`} role="tooltip">
          <span className="viewer-tip-title">
            <Info size={12} /> Schematic
          </span>
          <p>Particles are rearranged for counting—not a reaction mechanism.</p>
        </div>
      </div>
      <div className="reaction-side"><small>Viewing</small><strong>{side}</strong></div>
      <div className="representation-legend">{(side === "reactants" ? reaction.reactants : reaction.products).map((item) => <span key={`${side}-${item.formula}`}><b>{item.formula}</b>{item.representation === "ions" ? "labeled ion field" : item.representation === "lattice" ? "lattice model" : "ball-and-stick"}</span>)}</div>
      <button className="reaction-reset-view" onClick={() => { const state = stateRef.current; if (!state) return; state.camera.position.set(0, .6, 10); state.controls.target.set(0,0,0); state.root.rotation.set(0,0,0); }}><RotateCcw size={14} /> Reset view</button>
    </section>
  );
}
