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
  Orbit,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import type { ElementRecord } from "../lib/types";

type StructureKey = "nucleus" | "proton" | "neutron" | "electron" | "valence";

type ElectronParticle = {
  mesh: THREE.InstancedMesh;
  instance: number;
  radius: number;
  angle: number;
  speed: number;
  orbit: THREE.Quaternion;
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
};

const structureCopy: Record<StructureKey, { label: string; detail: (element: ElementRecord) => string }> = {
  nucleus: { label: "Nucleus", detail: (element) => `${element.atomicNumber} protons${element.neutrons === null ? "" : ` and ${element.neutrons} neutrons`} form the dense center.` },
  proton: { label: "Proton", detail: (element) => `The ${element.atomicNumber} protons define this atom as ${element.name}.` },
  neutron: { label: "Neutron", detail: (element) => element.neutrons === null ? "A representative neutron count is not established for this visualization." : `${element.neutrons} neutrons are shown for the representative isotope.` },
  electron: { label: "Electron", detail: (element) => `${element.atomicNumber} electrons make the neutral atom electrically balanced.` },
  valence: { label: "Valence shell", detail: (element) => element.valenceElectrons === null ? "Outer and d/f electrons can both participate in bonding." : `${element.valenceElectrons} outer-shell electrons strongly influence bonding.` },
};

const dummy = new THREE.Object3D();

function seededFraction(value: number) {
  return Math.abs(Math.sin(value * 12.9898) * 43758.5453) % 1;
}

function particlePosition(index: number, total: number, seed: number, maxRadius: number) {
  const t = (index + .5) / Math.max(total, 1);
  const y = 1 - 2 * t;
  const ring = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = (index + seed * .17) * 2.399963;
  const fill = .46 + .54 * Math.cbrt(seededFraction((index + 1) * (seed + 17)));
  return new THREE.Vector3(Math.cos(theta) * ring, y, Math.sin(theta) * ring).multiplyScalar(maxRadius * fill);
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
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
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

  useEffect(() => { autoRotateRef.current = autoRotate; if (stateRef.current) stateRef.current.dirty = true; }, [autoRotate]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !window.matchMedia("(max-width: 760px)").matches, powerPreference: "high-performance" });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.25 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute("aria-label", "Interactive simplified atomic model. Drag or use arrow keys to rotate, scroll or use plus and minus to zoom, and open the Structure guide for particle details.");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xf8fbf8, 0x18363a, 1.9));
    const key = new THREE.DirectionalLight(0xffffff, 3.5);
    key.position.set(4, 6, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9ce0d5, 1.7);
    fill.position.set(-4, -1, 4);
    scene.add(fill);
    const rim = new THREE.PointLight(0x8f79ff, 13, 18);
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
        state.electronData.forEach((electron) => {
          electron.angle += delta * electron.speed;
          dummy.position
            .set(Math.cos(electron.angle) * electron.radius, Math.sin(electron.angle) * electron.radius, 0)
            .applyQuaternion(electron.orbit);
          dummy.scale.setScalar(electron.mesh === state.valenceElectrons && valenceFocusRef.current ? 1.42 : 1);
          dummy.updateMatrix();
          electron.mesh.setMatrixAt(electron.instance, dummy.matrix);
        });
        if (state.innerElectrons) {
          state.innerElectrons.instanceMatrix.needsUpdate = true;
        }
        if (state.valenceElectrons) {
          state.valenceElectrons.instanceMatrix.needsUpdate = true;
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

    const neutronCount = element.neutrons ?? 0;
    const nucleusTotal = Math.max(1, element.atomicNumber + neutronCount);
    const particleSize = THREE.MathUtils.clamp(.245 - Math.log10(nucleusTotal + 1) * .052, .108, .215);
    const clusterRadius = THREE.MathUtils.clamp(.38 + Math.cbrt(nucleusTotal) * .105, .58, 1.08);
    const particleGeometry = new THREE.SphereGeometry(particleSize, nucleusTotal > 120 ? 12 : 16, nucleusTotal > 120 ? 8 : 11);
    const protonMaterial = new THREE.MeshPhysicalMaterial({ color: 0xef7765, roughness: .25, metalness: .03, clearcoat: .55, clearcoatRoughness: .32 });
    const neutronMaterial = new THREE.MeshPhysicalMaterial({ color: 0x587583, roughness: .3, metalness: .08, clearcoat: .42, clearcoatRoughness: .38 });
    const protons = new THREE.InstancedMesh(particleGeometry, protonMaterial, element.atomicNumber);
    const neutrons = new THREE.InstancedMesh(particleGeometry.clone(), neutronMaterial, neutronCount);
    let protonIndex = 0;
    let neutronIndex = 0;
    for (let slot = 0; slot < nucleusTotal; slot += 1) {
      const expectedProtons = Math.round(((slot + 1) * element.atomicNumber) / nucleusTotal);
      const isProton = protonIndex < expectedProtons && protonIndex < element.atomicNumber;
      const position = particlePosition(slot, nucleusTotal, element.atomicNumber, clusterRadius);
      dummy.position.copy(position);
      dummy.rotation.set(slot * .31, slot * .19, slot * .13);
      dummy.scale.setScalar(.94 + seededFraction(slot + element.atomicNumber) * .12);
      dummy.updateMatrix();
      if (isProton) {
        protons.setMatrixAt(protonIndex++, dummy.matrix);
      } else if (neutronIndex < neutronCount) {
        neutrons.setMatrixAt(neutronIndex++, dummy.matrix);
      }
    }
    const nucleusGlow = new THREE.Mesh(
      new THREE.SphereGeometry(clusterRadius * 1.13, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0x9bd8d0, transparent: true, opacity: .055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }),
    );
    const nucleusLight = new THREE.PointLight(0xf4a291, 2.6, 5.5, 2);
    state.atom.add(nucleusGlow, nucleusLight, protons, neutrons);
    state.nucleusMeshes = [nucleusGlow, protons, neutrons];

    const innerCount = element.shells.slice(0, -1).reduce((sum, count) => sum + count, 0);
    const outerCount = element.shells.at(-1) ?? 0;
    const electronSize = THREE.MathUtils.clamp(.128 - element.atomicNumber * .00035, .082, .124);
    const electronGeometry = new THREE.SphereGeometry(electronSize, 16, 11);
    const innerMaterial = new THREE.MeshPhysicalMaterial({ color: 0x78c9e8, emissive: 0x1a7199, emissiveIntensity: 1.7, roughness: .18, clearcoat: .75, clearcoatRoughness: .2 });
    const valenceMaterial = new THREE.MeshPhysicalMaterial({ color: 0xb68af0, emissive: 0x6840b1, emissiveIntensity: 2.15, roughness: .16, clearcoat: .8, clearcoatRoughness: .18 });
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
      const ring = new THREE.LineLoop(
        ringGeometry,
        new THREE.LineBasicMaterial({
          color: shellIndex === element.shells.length - 1 ? 0x9d75d7 : 0x73a7b8,
          transparent: true,
          opacity: shellIndex === element.shells.length - 1 ? .38 : .22,
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

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    state.shells.forEach((shell) => { shell.visible = shellsVisible; });
    state.dirty = true;
  }, [shellsVisible]);

  useEffect(() => {
    valenceFocusRef.current = valenceFocus;
    const state = stateRef.current;
    if (!state) return;
    const innerMaterial = state.innerElectrons?.material as THREE.MeshStandardMaterial | undefined;
    if (innerMaterial) { innerMaterial.transparent = valenceFocus; innerMaterial.opacity = valenceFocus ? 0.13 : 1; }
    state.shells.forEach((shell, index) => {
      const material = (shell as THREE.Line).material as THREE.LineBasicMaterial;
      material.opacity = valenceFocus && index !== state.shells.length - 1 ? .045 : index === state.shells.length - 1 ? .38 : .22;
    });
    state.dirty = true;
  }, [valenceFocus]);

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
    state.shells.forEach((shell) => { shell.visible = !next && shellsVisible; });
    if (state.innerElectrons) state.innerElectrons.visible = !next;
    if (state.valenceElectrons) state.valenceElectrons.visible = !next;
    state.camera.position.set(0, .3, next ? 4.1 : viewingDistance(state, element));
    state.dirty = true;
    if (next) { setSelected("nucleus"); setGuideOpen(true); }
    else if (selected === "nucleus") setSelected(null);
  };

  const reset = () => {
    const state = stateRef.current;
    if (!state) return;
    setShellsVisible(true); setNucleusFocus(false); setValenceFocus(false); setSelected(null); setGuideOpen(false);
    state.atom.rotation.set(-.12, -.2, .03);
    state.shells.forEach((shell) => { shell.visible = true; });
    if (state.innerElectrons) state.innerElectrons.visible = true;
    if (state.valenceElectrons) state.valenceElectrons.visible = true;
    state.camera.position.set(0, .55, viewingDistance(state, element));
    state.controls.target.set(0, 0, 0);
    state.dirty = true;
  };

  const tools = [
    { label: "Rotate", icon: RotateCcw, active: autoRotate, action: () => onAutoRotate(!autoRotate) },
    { label: "Zoom", icon: Search, active: false, action: zoom },
    { label: "Shells", icon: Orbit, active: shellsVisible, action: () => setShellsVisible((value) => !value) },
    { label: "Nucleus", icon: Focus, active: nucleusFocus, action: focusNucleus },
    { label: "Valence", icon: CircleDot, active: valenceFocus, action: () => { setValenceFocus((value) => !value); setSelected("valence"); setGuideOpen(true); } },
    { label: "Compare", icon: GitCompareArrows, active: compareActive, action: onCompare },
    { label: "Reset", icon: Atom, active: false, action: reset },
  ];

  return (
    <section className="viewer-shell" aria-label={`${element.name} interactive atomic viewer`}>
      <div className="viewer-aura" style={{ "--element-color": element.cpkColor } as React.CSSProperties} />
      <div className="atom-mount" ref={mountRef}>{fallback && <FallbackAtom element={element} />}</div>
      <div className="viewer-tools" aria-label="Atomic viewer tools">
        {tools.map(({ label, icon: Icon, active, action }) => (
          <button key={label} type="button" onClick={action} className={active ? "active" : ""} aria-pressed={active} title={label}>
            <Icon size={18} /><span>{label}</span>
          </button>
        ))}
      </div>
      <aside className="viewer-tip"><span><Info size={14} /> Model note</span><p>Shell paths and particle spacing are simplified—not physical scale.</p></aside>
      <aside className={`structure-guide ${guideOpen ? "open" : ""}`} onKeyDown={(event) => { if (event.key === "Escape") { setGuideOpen(false); setSelected(null); } }}>
        {!guideOpen ? (
          <button className="structure-guide-toggle" onClick={() => { setGuideOpen(true); setSelected("nucleus"); }} aria-expanded="false" aria-controls="structure-guide-panel"><BookOpen size={14} /> Structure guide</button>
        ) : (
          <div id="structure-guide-panel">
            <header><span><BookOpen size={14} /> Structure guide</span><button onClick={() => { setGuideOpen(false); setSelected(null); }} aria-label="Close structure guide"><X size={15} /></button></header>
            <div className="structure-options" role="tablist" aria-label="Atomic structure details">
              {(["nucleus", "proton", "neutron", "electron", "valence"] as StructureKey[]).filter((key) => key !== "neutron" || (element.neutrons ?? 0) > 0).map((key) => (
                <button key={key} role="tab" aria-selected={selected === key} className={`${key} ${selected === key ? "active" : ""}`} onClick={() => setSelected(key)}>{structureCopy[key].label}</button>
              ))}
            </div>
            {selected && <div className="structure-guide-copy" role="tabpanel" aria-live="polite"><strong>{structureCopy[selected].label}</strong><p>{structureCopy[selected].detail(element)}</p></div>}
          </div>
        )}
      </aside>
      <div className="viewer-caption"><span>Simplified shell model</span><strong>{element.shells.join(" · ")} electrons</strong></div>
      <button className="auto-rotate" onClick={() => onAutoRotate(!autoRotate)} aria-pressed={autoRotate}><RotateCcw size={14} /> Auto rotate <span className={autoRotate ? "switch on" : "switch"}><i /></span></button>
      <div className="atomic-stamp"><small>{element.atomicNumber}</small><b>{element.symbol}</b><span>{element.name}</span></div>
    </section>
  );
}
