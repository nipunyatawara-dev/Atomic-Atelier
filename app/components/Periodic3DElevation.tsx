"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Compass,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
} from "lucide-react";
import { elementGridPosition, elements } from "../lib/elements";
import {
  getInterpolatedColor,
  getNormalizedValue,
  PALETTES,
  resolveTrend,
} from "../lib/trends";
import type { ElementRecord, TrendPaletteId, TrendPropertyId } from "../lib/types";

type Props = {
  selectedProperty: TrendPropertyId;
  paletteId: TrendPaletteId;
  selectedElementNumber: number | null;
  onSelectElement: (element: ElementRecord) => void;
  autoRotate?: boolean;
  exaggeration?: number;
};

type PillarObject = {
  element: ElementRecord;
  mesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  currentHeight: number;
  targetHeight: number;
  targetColor: THREE.Color;
};

type SceneState = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  pillars: PillarObject[];
  root: THREE.Group;
  timer: THREE.Timer;
  frame: number;
  visible: boolean;
  reduced: boolean;
  resizeObserver: ResizeObserver;
  intersectionObserver: IntersectionObserver;
};

const CELL_SIZE_X = 1.3;
const CELL_SIZE_Z = 1.3;
const BASE_HEIGHT = 0.25;
const MAX_HEIGHT_SCALE = 4.2;

export function Periodic3DElevation({
  selectedProperty,
  paletteId,
  selectedElementNumber,
  onSelectElement,
  autoRotate = false,
  exaggeration = 1.0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneStateRef = useRef<SceneState | null>(null);
  const [hoveredElement, setHoveredElement] = useState<ElementRecord | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const autoRotateRef = useRef(autoRotate);
  const exaggerationRef = useRef(exaggeration);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    exaggerationRef.current = exaggeration;
  }, [exaggeration]);

  // Initialize Three.js Scene
  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200,
    );
    camera.position.set(0, 22, 26);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 65;
    controls.target.set(0, 1.2, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't flip below ground

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(16, 32, 20);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8ed6cb, 1.1);
    fillLight.position.set(-18, 14, -14);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfffbeb, 0.9);
    rimLight.position.set(0, -10, 18);
    scene.add(rimLight);

    const root = new THREE.Group();
    scene.add(root);

    // Ground Table Platform Grid
    const groundGeo = new THREE.PlaneGeometry(28, 17);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xf1efe6,
      roughness: 0.8,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.02, 0);
    ground.receiveShadow = true;
    root.add(ground);

    const gridHelper = new THREE.GridHelper(28, 28, 0xd0d8d3, 0xe4ebe6);
    gridHelper.position.set(0, 0.001, 0);
    root.add(gridHelper);

    // Build 118 Extruded Box Pillars
    const unitBoxGeo = new THREE.BoxGeometry(1.05, 1, 1.05);
    // Shift box geometry origin so scale.y expands strictly upward from ground
    unitBoxGeo.translate(0, 0.5, 0);

    const pillars: PillarObject[] = [];

    elements.forEach((element) => {
      const pos = elementGridPosition(element);
      // Center grid around (0, 0): cols 1..18 -> x, rows 1..10 -> z
      const posX = (pos.column - 9.5) * CELL_SIZE_X;
      const posZ = (pos.row - 5.5) * CELL_SIZE_Z;

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x2d7773),
        roughness: 0.35,
        metalness: 0.15,
      });

      const mesh = new THREE.Mesh(unitBoxGeo, mat);
      mesh.position.set(posX, 0, posZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { element, kind: "pillar" };

      root.add(mesh);

      pillars.push({
        element,
        mesh,
        currentHeight: BASE_HEIGHT,
        targetHeight: BASE_HEIGHT,
        targetColor: new THREE.Color(0x2d7773),
      });
    });

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
      pillars,
      root,
      timer,
      frame: 0,
      visible,
      reduced,
      resizeObserver,
      intersectionObserver,
    };
    sceneStateRef.current = state;

    function renderLoop() {
      state.frame = requestAnimationFrame(renderLoop);
      timer.update();
      const delta = timer.getDelta();

      if (state.visible) {
        // Animate pillar heights and colors toward their target values
        const lerpFactor = Math.min(1, delta * 9);
        state.pillars.forEach((p) => {
          p.currentHeight += (p.targetHeight - p.currentHeight) * lerpFactor;
          p.mesh.scale.y = Math.max(0.05, p.currentHeight);
          p.mesh.material.color.lerp(p.targetColor, lerpFactor);
        });

        if (autoRotateRef.current && !state.reduced) {
          root.rotation.y += delta * 0.25;
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
      unitBoxGeo.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      pillars.forEach((p) => {
        p.mesh.material.dispose();
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      sceneStateRef.current = null;
    };
  }, []);

  // Update target heights and colors when selected property, palette, or exaggeration changes
  useEffect(() => {
    const state = sceneStateRef.current;
    if (!state) return;

    const prop = resolveTrend(selectedProperty);

    state.pillars.forEach((p) => {
      const val = prop.accessor(p.element);
      const normalized = getNormalizedValue(val, prop);
      const isSelected = selectedElementNumber === p.element.atomicNumber;
      const isHovered = hoveredElement?.atomicNumber === p.element.atomicNumber;

      // Target elevation height
      const targetHeight =
        val === null
          ? BASE_HEIGHT * 0.5
          : BASE_HEIGHT + normalized * MAX_HEIGHT_SCALE * exaggeration;

      p.targetHeight = targetHeight;

      // Target color from palette
      const hex = getInterpolatedColor(normalized, paletteId);
      p.targetColor = new THREE.Color(hex);

      // Highlight emissive
      if (isSelected) {
        p.mesh.material.emissive.setHex(0x0284c7);
        p.mesh.material.emissiveIntensity = 0.65;
      } else if (isHovered) {
        p.mesh.material.emissive.setHex(0x38bdf8);
        p.mesh.material.emissiveIntensity = 0.45;
      } else {
        p.mesh.material.emissive.setHex(0x000000);
        p.mesh.material.emissiveIntensity = 0;
      }
    });
  }, [selectedProperty, paletteId, selectedElementNumber, hoveredElement, exaggeration]);

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

    const intersects = raycaster.intersectObjects(
      state.pillars.map((p) => p.mesh),
      false,
    );
    const hit = intersects.find((i) => i.object.userData?.kind === "pillar");

    if (hit) {
      const elem = hit.object.userData.element as ElementRecord;
      onSelectElement(elem);
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

    const intersects = raycaster.intersectObjects(
      state.pillars.map((p) => p.mesh),
      false,
    );
    const hit = intersects.find((i) => i.object.userData?.kind === "pillar");

    if (hit) {
      setHoveredElement(hit.object.userData.element as ElementRecord);
    } else {
      setHoveredElement(null);
    }
  };

  // Camera Presets
  const setCameraPreset = (preset: "isometric" | "topdown" | "side" | "front") => {
    const state = sceneStateRef.current;
    if (!state) return;

    state.root.rotation.set(0, 0, 0);

    if (preset === "isometric") {
      state.camera.position.set(0, 22, 26);
      state.controls.target.set(0, 1.2, 0);
    } else if (preset === "topdown") {
      state.camera.position.set(0, 32, 0.01);
      state.controls.target.set(0, 0, 0);
    } else if (preset === "side") {
      state.camera.position.set(28, 8, 0);
      state.controls.target.set(0, 1.5, 0);
    } else if (preset === "front") {
      state.camera.position.set(0, 10, 26);
      state.controls.target.set(0, 1.5, 0);
    }
    state.controls.update();
  };

  const currentPropDef = resolveTrend(selectedProperty);
  const hoveredValue = hoveredElement ? currentPropDef.accessor(hoveredElement) : null;

  return (
    <div
      className={`trend-elevation-shell ${fullscreen ? "fullscreen" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div ref={containerRef} className="elevation-canvas-mount" />

      {/* Floating Top Legend Badges */}
      <div className="elevation-floating-top">
        <div className="elevation-prop-badge">
          <Compass size={14} className="text-teal" />
          <strong>{currentPropDef.name}</strong>
          <span>3D Elevation Matrix</span>
        </div>

        {/* Dynamic Color Palette Strip */}
        <div className="palette-gradient-bar" title={`Color Palette: ${PALETTES[paletteId]?.name}`}>
          <div
            className="gradient-strip"
            style={{
              background: `linear-gradient(to right, ${PALETTES[paletteId]?.stops
                .map(([t, c]) => `${c} ${t * 100}%`)
                .join(", ")})`,
            }}
          />
          <div className="gradient-labels">
            <span>{currentPropDef.format(currentPropDef.min)}</span>
            <span>{currentPropDef.format(currentPropDef.max)}</span>
          </div>
        </div>
      </div>

      {/* Hover Card */}
      {hoveredElement && (
        <div className="elevation-hover-card">
          <div className="hover-header">
            <span className="hover-number">{hoveredElement.atomicNumber}</span>
            <strong className="hover-symbol">{hoveredElement.symbol}</strong>
            <span className="hover-name">{hoveredElement.name}</span>
          </div>
          <div className="hover-value-row">
            <small>{currentPropDef.shortName}:</small>
            <b>{currentPropDef.format(hoveredValue)}</b>
          </div>
          <span className="hover-click-hint">Click to inspect element</span>
        </div>
      )}

      {/* Floating Camera & View Controls */}
      <div className="elevation-floating-controls">
        <div className="preset-btn-group">
          <button
            type="button"
            className="preset-btn"
            onClick={() => setCameraPreset("isometric")}
            title="Isometric 3D Angle"
          >
            <Compass size={13} />
            <span>3D Isometric</span>
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => setCameraPreset("topdown")}
            title="Top-Down 2D Map"
          >
            <Eye size={13} />
            <span>Top-Down</span>
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => setCameraPreset("side")}
            title="Side Elevation Peaks"
          >
            <Sliders size={13} />
            <span>Side Peaks</span>
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => setCameraPreset("isometric")}
            title="Reset Camera Target"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <button
          type="button"
          className="preset-btn icon-only"
          onClick={() => setFullscreen((f) => !f)}
          title={fullscreen ? "Exit Fullscreen" : "Fullscreen 3D View"}
          aria-label={fullscreen ? "Exit Fullscreen" : "Fullscreen 3D View"}
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );
}
