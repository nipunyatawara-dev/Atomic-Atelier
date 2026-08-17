"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Compass,
  Maximize2,
  Minimize2,
  RotateCcw,
  Zap,
} from "lucide-react";
import type { MoleculeAtom, MoleculeRecord } from "../lib/types";
import {
  calculateAngleDegrees,
  ELEMENT_CPK_COLORS,
  ELEMENT_RADII_VDW,
  PAULING_ELECTRONEGATIVITY,
} from "../lib/vsepr";

export type MoleculeRenderMode = "ball-and-stick" | "space-filling" | "wireframe";

type Props = {
  molecule: MoleculeRecord;
  renderMode: MoleculeRenderMode;
  showLonePairs: boolean;
  showDipole: boolean;
  measureMode: boolean;
  autoRotate: boolean;
  onSelectAtom?: (atom: MoleculeAtom | null) => void;
  onAngleMeasured?: (angle: number | null, atoms: MoleculeAtom[]) => void;
};

type SceneState = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  root: THREE.Group;
  moleculeGroup: THREE.Group;
  lonePairsGroup: THREE.Group;
  dipoleGroup: THREE.Group;
  labelsGroup: THREE.Group;
  measureGroup: THREE.Group;
  timer: THREE.Timer;
  frame: number;
  visible: boolean;
  reduced: boolean;
  dirty: boolean;
  resizeObserver: ResizeObserver;
  intersectionObserver: IntersectionObserver;
};

function disposeGroup(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material?.dispose());
    }
  });
  group.clear();
}

function createBondMesh(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  order: 1 | 2 | 3,
  renderMode: MoleculeRenderMode,
) {
  const group = new THREE.Group();
  const dir = p2.clone().sub(p1);
  const length = dir.length();
  const mid = p1.clone().add(p2).multiplyScalar(0.5);
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());

  if (renderMode === "wireframe") {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 });
    group.add(new THREE.Line(lineGeo, lineMat));
    return group;
  }

  const radius = 0.045;
  const cylinderMat = new THREE.MeshStandardMaterial({
    color: 0xbac3cf,
    roughness: 0.45,
    metalness: 0.15,
  });

  if (order === 1) {
    const geom = new THREE.CylinderGeometry(radius, radius, length, 12);
    const mesh = new THREE.Mesh(geom, cylinderMat);
    mesh.position.copy(mid);
    mesh.quaternion.copy(quat);
    group.add(mesh);
  } else if (order === 2) {
    const offset = 0.07;
    const perp = new THREE.Vector3(0, 0, 1).applyQuaternion(quat).normalize().multiplyScalar(offset);
    [-1, 1].forEach((sign) => {
      const geom = new THREE.CylinderGeometry(radius * 0.85, radius * 0.85, length, 10);
      const mesh = new THREE.Mesh(geom, cylinderMat);
      mesh.position.copy(mid).addScaledVector(perp, sign);
      mesh.quaternion.copy(quat);
      group.add(mesh);
    });
  } else if (order === 3) {
    const offset = 0.09;
    const perp = new THREE.Vector3(0, 0, 1).applyQuaternion(quat).normalize().multiplyScalar(offset);
    [-1, 0, 1].forEach((sign) => {
      const geom = new THREE.CylinderGeometry(radius * 0.75, radius * 0.75, length, 10);
      const mesh = new THREE.Mesh(geom, cylinderMat);
      mesh.position.copy(mid).addScaledVector(perp, sign);
      mesh.quaternion.copy(quat);
      group.add(mesh);
    });
  }

  return group;
}

function createLonePairLobe(pos: THREE.Vector3, center: THREE.Vector3) {
  const dir = pos.clone().sub(center).normalize();
  const group = new THREE.Group();

  const geom = new THREE.SphereGeometry(0.26, 24, 20);
  geom.scale(0.7, 1.25, 0.7);

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transmission: 0.65,
    opacity: 0.7,
    transparent: true,
    roughness: 0.2,
    ior: 1.2,
    emissive: 0x0284c7,
    emissiveIntensity: 0.25,
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.copy(pos);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  group.add(mesh);

  const dotMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  const dotGeo = new THREE.SphereGeometry(0.04, 16, 12);

  const d1 = new THREE.Mesh(dotGeo, dotMat);
  const d2 = new THREE.Mesh(dotGeo, dotMat);
  const perp = new THREE.Vector3(1, 0, 0).applyQuaternion(mesh.quaternion).multiplyScalar(0.07);

  d1.position.copy(pos).add(perp);
  d2.position.copy(pos).sub(perp);
  group.add(d1, d2);

  return group;
}

function createDipoleVectorMesh(vector: [number, number, number], length = 2.5) {
  const group = new THREE.Group();
  if (Math.hypot(...vector) < 0.001) return group;

  const dir = new THREE.Vector3(...vector).normalize();
  const halfLength = length * 0.5;
  const headLength = 0.42;
  const shaftLength = length - headLength;

  const arrowMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    emissive: 0x9f1239,
    emissiveIntensity: 0.55,
    roughness: 0.3,
  });

  // Shaft positioned through the center of the molecule
  const shaftGeo = new THREE.CylinderGeometry(0.038, 0.038, shaftLength, 12);
  const shaft = new THREE.Mesh(shaftGeo, arrowMat);
  const shaftCenterDist = -halfLength + shaftLength * 0.5;
  shaft.position.copy(dir.clone().multiplyScalar(shaftCenterDist));
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  group.add(shaft);

  // Positive cross (+) near the positive tail of the arrow (delta+)
  const crossGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.36, 8);
  const cross = new THREE.Mesh(crossGeo, arrowMat);
  const crossDist = -halfLength + 0.32;
  cross.position.copy(dir.clone().multiplyScalar(crossDist));
  const side = new THREE.Vector3(1, 0, 0).applyQuaternion(shaft.quaternion);
  cross.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), side);
  group.add(cross);

  // Arrowhead pointing in the direction of negative charge (delta-)
  const headGeo = new THREE.ConeGeometry(0.11, headLength, 16);
  const head = new THREE.Mesh(headGeo, arrowMat);
  const headCenterDist = halfLength - headLength * 0.5;
  head.position.copy(dir.clone().multiplyScalar(headCenterDist));
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  group.add(head);

  return group;
}

export function MoleculeViewer({
  molecule,
  renderMode,
  showLonePairs,
  showDipole,
  measureMode,
  autoRotate,
  onSelectAtom,
  onAngleMeasured,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneStateRef = useRef<SceneState | null>(null);
  const autoRotateRef = useRef(autoRotate);
  const onAngleMeasuredRef = useRef(onAngleMeasured);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    onAngleMeasuredRef.current = onAngleMeasured;
  }, [onAngleMeasured]);

  const [selectedAtoms, setSelectedAtoms] = useState<MoleculeAtom[]>([]);
  const [hoveredAtom, setHoveredAtom] = useState<MoleculeAtom | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const [prevKey, setPrevKey] = useState(`${molecule.slug}:${measureMode}`);
  if (prevKey !== `${molecule.slug}:${measureMode}`) {
    setPrevKey(`${molecule.slug}:${measureMode}`);
    setSelectedAtoms([]);
  }

  // Initialize Three.js Scene
  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.5;
    controls.maxDistance = 22;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(6, 8, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8ed6cb, 0.8);
    fillLight.position.set(-6, -4, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfffbeb, 1.0);
    rimLight.position.set(0, -6, 5);
    scene.add(rimLight);

    const root = new THREE.Group();
    const moleculeGroup = new THREE.Group();
    const lonePairsGroup = new THREE.Group();
    const dipoleGroup = new THREE.Group();
    const labelsGroup = new THREE.Group();
    const measureGroup = new THREE.Group();

    root.add(moleculeGroup, lonePairsGroup, dipoleGroup, labelsGroup, measureGroup);
    scene.add(root);

    const timer = new THREE.Timer();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(mount);

    let visible = true;
    const intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    intersectionObserver.observe(mount);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const state: SceneState = {
      renderer,
      scene,
      camera,
      controls,
      root,
      moleculeGroup,
      lonePairsGroup,
      dipoleGroup,
      labelsGroup,
      measureGroup,
      timer,
      frame: 0,
      visible,
      reduced,
      dirty: true,
      resizeObserver,
      intersectionObserver,
    };
    sceneStateRef.current = state;

    function renderLoop() {
      state.frame = requestAnimationFrame(renderLoop);
      timer.update();
      const delta = timer.getDelta();

      if (state.visible) {
        if (autoRotateRef.current && !state.reduced) {
          root.rotation.y += delta * 0.45;
        }
        controls.update();
        renderer.render(scene, camera);
      }
    }
    renderLoop();

    return () => {
      cancelAnimationFrame(state.frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      disposeGroup(root);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      sceneStateRef.current = null;
    };
  }, []);

  // Update Molecule Geometry & Visual Elements
  useEffect(() => {
    const state = sceneStateRef.current;
    if (!state) return;

    disposeGroup(state.moleculeGroup);
    disposeGroup(state.lonePairsGroup);
    disposeGroup(state.dipoleGroup);

    const atomPositions = new Map<string, THREE.Vector3>();

    // Build Atoms
    molecule.atoms.forEach((atom) => {
      const pos = new THREE.Vector3(...atom.position);
      atomPositions.set(atom.id, pos);

      const symbol = atom.symbol;
      const cpk = ELEMENT_CPK_COLORS[symbol] ?? 0xa8b3cf;
      const vdw = ELEMENT_RADII_VDW[symbol] ?? 1.6;

      let radius = 0.28;
      if (renderMode === "space-filling") {
        radius = vdw * 0.38;
      } else if (renderMode === "wireframe") {
        radius = 0.12;
      } else {
        radius = symbol === "H" ? 0.19 : symbol === "C" ? 0.32 : 0.29;
      }

      const isSelected = selectedAtoms.some((a) => a.id === atom.id);
      const isHovered = hoveredAtom?.id === atom.id;

      const geom = new THREE.SphereGeometry(radius, 32, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0x38bdf8 : isHovered ? 0x67e8f9 : cpk,
        roughness: 0.3,
        metalness: 0.1,
        emissive: isSelected ? 0x0284c7 : isHovered ? 0x0891b2 : 0x000000,
        emissiveIntensity: isSelected ? 0.4 : isHovered ? 0.25 : 0,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.userData = { atom, kind: "atom" };
      state.moleculeGroup.add(mesh);
    });

    // Build Bonds
    if (renderMode !== "space-filling") {
      molecule.bonds.forEach((bond) => {
        const p1 = atomPositions.get(bond.from);
        const p2 = atomPositions.get(bond.to);
        if (p1 && p2) {
          state.moleculeGroup.add(createBondMesh(p1, p2, bond.order, renderMode));
        }
      });
    }

    // Lone Pairs
    if (showLonePairs && molecule.lonePairs.length > 0) {
      molecule.lonePairs.forEach((lp) => {
        const centerPos = atomPositions.get(lp.centralAtomId) ?? new THREE.Vector3(0, 0, 0);
        state.lonePairsGroup.add(createLonePairLobe(new THREE.Vector3(...lp.position), centerPos));
      });
    }

    // Dipole Vector
    if (showDipole && molecule.vsepr.dipoleVector) {
      state.dipoleGroup.add(createDipoleVectorMesh(molecule.vsepr.dipoleVector));
    }
  }, [molecule, renderMode, showLonePairs, showDipole, selectedAtoms, hoveredAtom]);

  // Update Angle Measurement Arc
  useEffect(() => {
    const state = sceneStateRef.current;
    if (!state) return;
    disposeGroup(state.measureGroup);

    if (selectedAtoms.length === 3) {
      const a = selectedAtoms[0].position;
      const b = selectedAtoms[1].position; // apex
      const c = selectedAtoms[2].position;

      const angle = calculateAngleDegrees(a, b, c);
      onAngleMeasuredRef.current?.(angle, selectedAtoms);

      // Draw connecting lines and apex arc
      const pA = new THREE.Vector3(...a);
      const pB = new THREE.Vector3(...b);
      const pC = new THREE.Vector3(...c);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([pA, pB, pC]);
      const lineMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 0.1, gapSize: 0.05 });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      state.measureGroup.add(line);
    } else {
      onAngleMeasuredRef.current?.(null, selectedAtoms);
    }
  }, [selectedAtoms]);

  // Click & Pointer Interaction (Raycasting)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = sceneStateRef.current;
    const mount = containerRef.current;
    if (!state || !mount) return;

    const rect = mount.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), state.camera);

    const intersects = raycaster.intersectObjects(state.moleculeGroup.children, true);
    const atomHit = intersects.find((hit) => hit.object.userData?.kind === "atom");

    if (atomHit) {
      const atom: MoleculeAtom = atomHit.object.userData.atom;
      onSelectAtom?.(atom);

      if (measureMode) {
        setSelectedAtoms((current) => {
          if (current.some((a) => a.id === atom.id)) {
            return current.filter((a) => a.id !== atom.id);
          }
          if (current.length >= 3) {
            return [atom];
          }
          return [...current, atom];
        });
      } else {
        setSelectedAtoms([atom]);
      }
    } else if (!measureMode) {
      setSelectedAtoms([]);
      onSelectAtom?.(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = sceneStateRef.current;
    const mount = containerRef.current;
    if (!state || !mount) return;

    const rect = mount.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), state.camera);

    const intersects = raycaster.intersectObjects(state.moleculeGroup.children, true);
    const atomHit = intersects.find((hit) => hit.object.userData?.kind === "atom");

    if (atomHit) {
      setHoveredAtom(atomHit.object.userData.atom);
      mount.style.cursor = "pointer";
    } else {
      setHoveredAtom(null);
      mount.style.cursor = "grab";
    }
  };

  const resetView = () => {
    const state = sceneStateRef.current;
    if (!state) return;
    state.camera.position.set(0, 0, 7.5);
    state.camera.lookAt(0, 0, 0);
    state.controls.target.set(0, 0, 0);
    state.root.rotation.set(0, 0, 0);
  };

  return (
    <div
      className={`molecule-viewer-shell ${fullscreen ? "fullscreen" : ""}`}
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      {/* Top Floating Badges */}
      <div className="viewer-floating-top">
        <div className="molecule-badge">
          <strong>{molecule.formula}</strong>
          <span>{molecule.vsepr.molecularGeometry}</span>
        </div>
        <div className={`polarity-badge ${molecule.vsepr.polarity.toLowerCase()}`}>
          <Zap size={13} />
          <span>{molecule.vsepr.polarity}</span>
          {molecule.vsepr.dipoleMomentDebye > 0 && (
            <small>({molecule.vsepr.dipoleMomentDebye} D)</small>
          )}
        </div>
      </div>

      {/* Hover Atom Tooltip */}
      {hoveredAtom && (
        <div className="atom-hover-card">
          <strong>{hoveredAtom.symbol}</strong>
          <span>Electronegativity: {PAULING_ELECTRONEGATIVITY[hoveredAtom.symbol] ?? "—"}</span>
          <small>ID: {hoveredAtom.id}</small>
        </div>
      )}

      {/* Floating Bottom Controls */}
      <div className="viewer-floating-bottom">
        <button
          type="button"
          className="viewer-icon-btn"
          onClick={resetView}
          title="Reset camera angle"
          aria-label="Reset camera"
        >
          <RotateCcw size={15} />
          <span>Reset</span>
        </button>

        {measureMode && (
          <div className="measure-status">
            <Compass size={14} />
            <span>Click 3 atoms ({selectedAtoms.length}/3)</span>
          </div>
        )}

        <button
          type="button"
          className="viewer-icon-btn"
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? "Exit full stage" : "Expand full stage"}
          aria-label="Toggle full stage"
        >
          {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>
    </div>
  );
}
