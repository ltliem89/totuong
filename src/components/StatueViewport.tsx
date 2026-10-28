import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  AnimalId,
  BrushToolId,
  StudioThemeId,
  STUDIO_THEMES,
  ANIMAL_DARK_HARMONIES,
  ANIMAL_STATUES,
} from "../data/statuesData";
import {
  buildAnimalStatue,
  BuiltStatue,
  PaintableMeshData,
  paintBrushStrokeOnCanvas,
  fillCanvasWithColor,
  resetCanvasToPlaster,
} from "../three/statueBuilder";
import { soundEngine } from "../audio/soundEngine";

export interface StatueViewportHandle {
  resetStatueToWhite: () => void;
  autoPaintSample: () => void;
  rotateTurntableBy: (angleRad: number) => void;
  zoomBy: (scaleFactor: number) => void;
  triggerCelebrationSpin: () => void;
}

interface StatueViewportProps {
  animalId: AnimalId;
  studioThemeId: StudioThemeId;
  selectedColorHex: string;
  selectedTool: BrushToolId;
  brushRadiusPx: number;
  interactionMode: "paint" | "rotate";
  highlightedPartId: string | null;
  isTitleScreen: boolean;
  onPartPainted: (partId: string, colorHex: string) => void;
  onPartErased: (partId: string) => void;
  onPartHovered: (partId: string | null) => void;
}

// Pre-allocated math & color helpers at module scope (Zero GC in render loop)
const _mouse = new THREE.Vector2();
const _hitPoint = new THREE.Vector3();
const _hitNormal = new THREE.Vector3();
const _normalMatrix = new THREE.Matrix3();
const _upVec = new THREE.Vector3(0, 1, 0);
const _targetQuat = new THREE.Quaternion();
const _targetSkyColor = new THREE.Color(0x101929);
const _targetFloorColor = new THREE.Color(0x17253b);
const _targetRimColor = new THREE.Color(0x38bdf8);
const _brushAccentColor = new THREE.Color(0xffd93d);

const _surfaceNormal = new THREE.Vector3(0, 1, 0);
const _trailQuat = new THREE.Quaternion();

interface ParticleItem {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  baseScale: number;
  gravity: number;
  isDust: boolean;
}

interface PaintTrailItem {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  life: number;
  maxLife: number;
  startScale: number;
}

export const StatueViewport = forwardRef<StatueViewportHandle, StatueViewportProps>(
  (
    {
      animalId,
      studioThemeId,
      selectedColorHex,
      selectedTool,
      brushRadiusPx,
      interactionMode,
      highlightedPartId,
      isTitleScreen,
      onPartPainted,
      onPartErased,
      onPartHovered,
    },
    ref
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);

    // Keep mutable state in refs so React UI updates never re-initialize WebGL
    const stateRef = useRef({
      animalId,
      studioThemeId,
      selectedColorHex,
      selectedTool,
      brushRadiusPx,
      interactionMode,
      highlightedPartId,
      isTitleScreen,
      onPartPainted,
      onPartErased,
      onPartHovered,
    });

    useEffect(() => {
      stateRef.current = {
        animalId,
        studioThemeId,
        selectedColorHex,
        selectedTool,
        brushRadiusPx,
        interactionMode,
        highlightedPartId,
        isTitleScreen,
        onPartPainted,
        onPartErased,
        onPartHovered,
      };
    }, [
      animalId,
      studioThemeId,
      selectedColorHex,
      selectedTool,
      brushRadiusPx,
      interactionMode,
      highlightedPartId,
      isTitleScreen,
      onPartPainted,
      onPartErased,
      onPartHovered,
    ]);

    const sceneActionsRef = useRef<{
      resetStatue: () => void;
      paintSample: () => void;
      rotateBy: (angle: number) => void;
      zoomBy: (scaleFactor: number) => void;
      celebrateSpin: () => void;
      rebuildAnimal: (id: AnimalId) => void;
      updateBrushAppearance: (hex: string, tool: BrushToolId, radiusPx: number) => void;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      resetStatueToWhite: () => sceneActionsRef.current?.resetStatue(),
      autoPaintSample: () => sceneActionsRef.current?.paintSample(),
      rotateTurntableBy: (angleRad: number) => sceneActionsRef.current?.rotateBy(angleRad),
      zoomBy: (scaleFactor: number) => sceneActionsRef.current?.zoomBy(scaleFactor),
      triggerCelebrationSpin: () => sceneActionsRef.current?.celebrateSpin(),
    }));

    // Rebuild 3D statue when animalId changes
    useEffect(() => {
      sceneActionsRef.current?.rebuildAnimal(animalId);
    }, [animalId]);

    // Update 3D paintbrush tip color and size when selectedColorHex, selectedTool, or brushRadiusPx changes
    useEffect(() => {
      sceneActionsRef.current?.updateBrushAppearance(
        selectedColorHex,
        selectedTool,
        brushRadiusPx
      );
    }, [selectedColorHex, selectedTool, brushRadiusPx]);

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      // 1. Detect software WebGL via renderer string
      const isSoftwareGl = (() => {
        const probeCanvas = document.createElement("canvas");
        const gl = probeCanvas.getContext("webgl2");
        if (!gl) return true;
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      })();

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      // Soft eye-comfort exposure so the white plaster statue looks dimensional without harsh glare
      renderer.toneMappingExposure = 0.96;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const skyColor = new THREE.Color(0x101929);
      const fog = new THREE.FogExp2(0x101929, 0.042);
      scene.background = skyColor;
      scene.fog = fog;

      // 2. Studio Environment Map via RoomEnvironment + PMREMGenerator
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();

      // 3. Camera & OrbitControls (Optimized for Desktop, Tablet & Phone Portrait/Landscape)
      const initAspect = container.clientWidth / Math.max(1, container.clientHeight);
      const camera = new THREE.PerspectiveCamera(
        initAspect < 0.75 ? 48 : initAspect < 1.0 ? 44 : 40,
        initAspect,
        0.1,
        100
      );
      camera.position.set(0, 2.55, initAspect < 0.75 ? 7.8 : 6.9);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 1.38, 0);
      controls.enablePan = false;
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.08;
      controls.minDistance = 3.2;
      controls.maxDistance = 11.0;
      controls.minPolarAngle = 0.25;
      controls.maxPolarAngle = Math.PI / 2 - 0.03;
      // Desktop: Left on background or Right anywhere rotates; Wheel zooms
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
      // Tablet & Mobile: 1 finger rotates (when in rotate mode or on background), 2 fingers pinch-zoom + rotate anywhere
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_ROTATE,
      };
      controls.update();

      // 4. Balanced 3-Point Eye-Care Studio Lighting Rig
      const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x17253b, 0.68);
      hemiLight.position.set(0, 10, 0);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfff3db, 1.12);
      keyLight.position.set(4.5, 7.5, 5.5);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 20;
      const d = 3.8;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
      rimLight.position.set(-4.5, 4.5, -4.5);
      scene.add(rimLight);

      // 5. Studio Table Environment & Contact Shadow Grounding
      const studioFloorGeo = new THREE.CircleGeometry(18, 64);
      const studioFloorMat = new THREE.MeshStandardMaterial({
        color: 0x17253b,
        roughness: 0.88,
        metalness: 0.06,
      });
      const studioFloor = new THREE.Mesh(studioFloorGeo, studioFloorMat);
      studioFloor.rotation.x = -Math.PI / 2;
      studioFloor.position.y = -0.28;
      studioFloor.receiveShadow = true;
      scene.add(studioFloor);

      // Soft radial contact shadow directly beneath turntable
      const shadowCanvas = document.createElement("canvas");
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const sCtx = shadowCanvas.getContext("2d")!;
      const grad = sCtx.createRadialGradient(128, 128, 20, 128, 128, 124);
      grad.addColorStop(0, "rgba(2, 6, 23, 0.65)");
      grad.addColorStop(0.65, "rgba(2, 6, 23, 0.28)");
      grad.addColorStop(1, "rgba(2, 6, 23, 0)");
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);

      const contactShadowGeo = new THREE.PlaneGeometry(5.6, 5.6);
      const contactShadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.y = -0.26;
      scene.add(contactShadow);

      // Decorative pastel paint pots in the background studio (non-obstructive)
      const bgPropsGroup = new THREE.Group();
      const potColors = [0xffd93d, 0xff5964, 0x4ecdc4, 0x4d96ff, 0xa685e2];
      const potGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.34, 20);
      potColors.forEach((col, idx) => {
        const angle = -2.35 + idx * 0.36;
        const radius = 3.85;
        const mat = new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.32,
          metalness: 0.08,
        });
        const pot = new THREE.Mesh(potGeo, mat);
        pot.position.set(Math.sin(angle) * radius, -0.11, Math.cos(angle) * radius - 0.8);
        pot.castShadow = !isSoftwareGl;
        pot.receiveShadow = true;
        bgPropsGroup.add(pot);
      });
      scene.add(bgPropsGroup);

      // 6. 3D High-Precision Paintbrush Cursor Follower + Surface Contact Ring
      const brushCursorGroup = new THREE.Group();
      brushCursorGroup.visible = false;

      // Surface contact ring showing exact brush width & color at hit point
      const ringGeo = new THREE.RingGeometry(0.055, 0.08, 32);
      ringGeo.rotateX(-Math.PI / 2);
      ringGeo.translate(0, 0.004, 0);
      const ringMat = new THREE.MeshBasicMaterial({
        color: stateRef.current.selectedColorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);

      // Sharp, fine-tipped conical brush bristles (smaller & sharper for meticulous details)
      const tipGeo = new THREE.ConeGeometry(0.068, 0.24, 24);
      tipGeo.rotateX(Math.PI); // Point sharp tip right to origin (0,0,0)
      tipGeo.translate(0, 0.12, 0);
      const tipMat = new THREE.MeshStandardMaterial({
        color: stateRef.current.selectedColorHex,
        roughness: 0.25,
      });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);

      const ferruleGeo = new THREE.CylinderGeometry(0.052, 0.065, 0.12, 20);
      ferruleGeo.translate(0, 0.3, 0);
      const ferruleMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.78,
        roughness: 0.22,
      });
      const ferruleMesh = new THREE.Mesh(ferruleGeo, ferruleMat);

      const handleGeo = new THREE.CylinderGeometry(0.042, 0.062, 0.72, 20);
      handleGeo.translate(0, 0.72, 0);
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0xf4a261,
        roughness: 0.45,
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);

      brushCursorGroup.add(ringMesh, tipMesh, ferruleMesh, handleMesh);
      scene.add(brushCursorGroup);

      // 7. Subtle 10% Micro-Dust & Wet Sheen Feedback (Lightweight & Realistic)
      const particles: ParticleItem[] = [];
      const dropletGeo = new THREE.OctahedronGeometry(0.018, 0);
      const dustGeo = new THREE.SphereGeometry(0.015, 6, 6);

      for (let i = 0; i < 16; i++) {
        const isDust = i < 10;
        const pMat = new THREE.MeshBasicMaterial({
          color: 0xffd93d,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        });
        const pMesh = new THREE.Mesh(isDust ? dustGeo : dropletGeo, pMat);
        pMesh.visible = false;
        scene.add(pMesh);
        particles.push({
          mesh: pMesh,
          mat: pMat,
          velocity: new THREE.Vector3(),
          life: 0,
          maxLife: 0.24,
          baseScale: 0.65,
          gravity: isDust ? 0.35 : 3.2,
          isDust,
        });
      }

      const trailCanvas = document.createElement("canvas");
      trailCanvas.width = 64;
      trailCanvas.height = 64;
      const tCtx = trailCanvas.getContext("2d")!;
      const tGrad = tCtx.createRadialGradient(32, 32, 4, 32, 32, 28);
      tGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      tGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.18)");
      tGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      tCtx.fillStyle = tGrad;
      tCtx.fillRect(0, 0, 64, 64);
      const trailTex = new THREE.CanvasTexture(trailCanvas);

      const paintTrails: PaintTrailItem[] = [];
      const trailGeo = new THREE.PlaneGeometry(0.14, 0.14);
      trailGeo.rotateX(-Math.PI / 2);
      trailGeo.translate(0, 0.003, 0);

      for (let i = 0; i < 8; i++) {
        const tMat = new THREE.MeshBasicMaterial({
          map: trailTex,
          color: 0xffd93d,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const tMesh = new THREE.Mesh(trailGeo, tMat);
        tMesh.visible = false;
        scene.add(tMesh);
        paintTrails.push({
          mesh: tMesh,
          mat: tMat,
          life: 0,
          maxLife: 0.2,
          startScale: 1,
        });
      }

      const spawnPaintDustAndTrail = (
        worldPos: THREE.Vector3,
        normal: THREE.Vector3,
        hexColor: string,
        radiusPx: number,
        isBurst: boolean
      ) => {
        // 10% subtle emission: while dragging, only emit occasionally (12% chance) and 1 tiny speck
        if (!isBurst && Math.random() > 0.12) return;

        const sizeFactor = THREE.MathUtils.clamp(0.4 + (radiusPx / 45) * 0.5, 0.35, 1.0);
        const maxToSpawn = isBurst ? 2 : 1;
        let spawned = 0;

        for (const p of particles) {
          if (p.life <= 0 && spawned < maxToSpawn) {
            p.maxLife = 0.18 + Math.random() * 0.1;
            p.life = p.maxLife;
            p.baseScale = (0.55 + Math.random() * 0.35) * sizeFactor;
            p.mesh.visible = true;
            p.mesh.position.copy(worldPos).addScaledVector(normal, 0.012);
            p.mesh.scale.setScalar(p.baseScale);
            p.mat.color.set(hexColor);
            p.mat.opacity = 0.26;

            const speed = isBurst ? 0.55 + Math.random() * 0.45 : 0.25 + Math.random() * 0.3;
            p.velocity.set(
              normal.x * speed * 0.5 + (Math.random() - 0.5) * speed * 0.7,
              normal.y * speed * 0.5 + 0.18 + Math.random() * 0.35,
              normal.z * speed * 0.5 + (Math.random() - 0.5) * speed * 0.7
            );
            spawned++;
          }
        }

        if (isBurst || Math.random() < 0.25) {
          for (const tr of paintTrails) {
            if (tr.life <= 0) {
              tr.maxLife = 0.18;
              tr.life = tr.maxLife;
              tr.startScale = THREE.MathUtils.clamp(0.28 + (radiusPx / 32) * 0.65, 0.25, 1.15);
              tr.mat.color.set(hexColor);
              tr.mat.opacity = 0.16;
              tr.mesh.position.copy(worldPos);
              _trailQuat.setFromUnitVectors(_upVec, normal);
              tr.mesh.quaternion.copy(_trailQuat);
              tr.mesh.scale.setScalar(tr.startScale);
              tr.mesh.visible = true;
              break;
            }
          }
        }
      };

      // 8. Build Active Animal Statue
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      let currentStatue: BuiltStatue | null = null;
      let targetTurntableRotY = 0;
      let bounceScale = 1.0;
      let bounceVelocity = 0.0;

      const loadAnimal = (id: AnimalId) => {
        if (currentStatue) {
          scene.remove(currentStatue.group);
          currentStatue.dispose();
        }
        currentStatue = buildAnimalStatue(id, maxAniso);
        targetTurntableRotY = 0;
        bounceScale = 0.86;
        bounceVelocity = 2.8;
        scene.add(currentStatue.group);
      };

      loadAnimal(stateRef.current.animalId);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      // 9. Raycasting & Direct 3D Painting Logic
      const raycaster = new THREE.Raycaster();
      let isPaintingStroke = false;
      let lastHitMesh: THREE.Mesh | null = null;
      const lastUv = new THREE.Vector2();
      let hasLastUv = false;
      let lastHoveredPart: string | null = null;
      let lastAnnouncedPart: string | null = null;
      let lastAnnouncedTime = 0;

      const updateMouseCoords = (clientX: number, clientY: number) => {
        const rect = renderer.domElement.getBoundingClientRect();
        _mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      };

      const findPaintableMeshData = (mesh: THREE.Object3D): PaintableMeshData | undefined => {
        if (!currentStatue) return undefined;
        return currentStatue.paintableMeshes.find((m) => m.mesh === mesh);
      };

      const performPaintAtHit = (
        hit: THREE.Intersection,
        isInitialClick: boolean
      ) => {
        if (!currentStatue || stateRef.current.isTitleScreen) return;
        const meshData = findPaintableMeshData(hit.object);
        if (!meshData) return;

        const { selectedColorHex: colorHex, selectedTool: tool, brushRadiusPx: radius } =
          stateRef.current;

        // Compute world surface normal at hit for realistic outward dust & flush wet-paint trails
        if (hit.face) {
          _normalMatrix.getNormalMatrix(hit.object.matrixWorld);
          _surfaceNormal.copy(hit.face.normal).applyMatrix3(_normalMatrix).normalize();
        } else {
          _surfaceNormal.set(0, 1, 0);
        }

        if (tool === "erase_part") {
          if (!isInitialClick) return;
          const partMeshes = currentStatue.partMeshesMap.get(meshData.partId) || [meshData];
          partMeshes.forEach((m) => {
            resetCanvasToPlaster(m.ctx, m.canvas.width, m.canvas.height, m.basePlasterType);
            m.texture.needsUpdate = true;
          });
          bounceScale = 0.94;
          bounceVelocity = 1.6;
          spawnPaintDustAndTrail(hit.point, _surfaceNormal, "#FAF8F5", radius, true);
          soundEngine.playBrushStroke("erase_part");
          stateRef.current.onPartErased(meshData.partId);
          return;
        }

        if (tool === "fill") {
          if (!isInitialClick) return;
          // Fill all meshes belonging to this partId
          const partMeshes = currentStatue.partMeshesMap.get(meshData.partId) || [meshData];
          partMeshes.forEach((m) => fillCanvasWithColor(m, colorHex));
          bounceScale = 1.07;
          bounceVelocity = -1.5;
          spawnPaintDustAndTrail(hit.point, _surfaceNormal, colorHex, 28, true);
          soundEngine.playPartFillSound();
          stateRef.current.onPartPainted(meshData.partId, colorHex);
          return;
        }

        if (hit.uv) {
          const sameMesh = lastHitMesh === meshData.mesh && hasLastUv && !isInitialClick;
          paintBrushStrokeOnCanvas(
            meshData,
            hit.uv,
            sameMesh ? lastUv : null,
            colorHex,
            tool,
            radius
          );
          lastHitMesh = meshData.mesh;
          lastUv.copy(hit.uv);
          hasLastUv = true;

          soundEngine.playBrushStroke(tool);

          // Continuous "Bụi Màu" & "Vệt Sơn" emission along the 3D brush stroke
          const fxColor = tool === "eraser" ? "#FAF8F5" : colorHex;
          spawnPaintDustAndTrail(hit.point, _surfaceNormal, fxColor, radius, isInitialClick);

          const now = performance.now();
          if (
            tool !== "eraser" &&
            (isInitialClick ||
              lastAnnouncedPart !== meshData.partId ||
              now - lastAnnouncedTime > 1200)
          ) {
            lastAnnouncedPart = meshData.partId;
            lastAnnouncedTime = now;
            stateRef.current.onPartPainted(meshData.partId, colorHex);
          }
        }
      };

      const activePointers = new Set<number>();

      const onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };

      const onPointerDown = (e: PointerEvent) => {
        activePointers.add(e.pointerId);

        if (stateRef.current.isTitleScreen || !currentStatue) return;

        // Multi-touch (2+ fingers on tablet/phone), Right-click, Middle-click, or Rotate Mode -> always rotate/zoom 3D model!
        if (
          activePointers.size >= 2 ||
          e.button === 2 ||
          e.button === 1 ||
          stateRef.current.interactionMode === "rotate"
        ) {
          isPaintingStroke = false;
          hasLastUv = false;
          controls.enabled = true;
          brushCursorGroup.visible = false;
          return;
        }

        if (e.button !== 0) return;

        updateMouseCoords(e.clientX, e.clientY);
        raycaster.setFromCamera(_mouse, camera);
        const meshes = currentStatue.paintableMeshes.map((m) => m.mesh);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
          // 1-finger touch or Left-click directly on the 3D animal statue in Paint Mode -> Disable orbit rotation and paint!
          controls.enabled = false;
          isPaintingStroke = true;
          hasLastUv = false;
          performPaintAtHit(intersects[0], true);
        } else {
          // 1-finger touch or Left-click on background -> allow OrbitControls to rotate camera smoothly!
          controls.enabled = true;
          isPaintingStroke = false;
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        if (stateRef.current.isTitleScreen || !currentStatue) {
          brushCursorGroup.visible = false;
          return;
        }

        // If 2+ fingers are touching (pinch-zoom/rotate), holding right mouse button, or in Rotate Mode without painting
        if (
          activePointers.size >= 2 ||
          (e.buttons & 2) !== 0 ||
          stateRef.current.interactionMode === "rotate"
        ) {
          isPaintingStroke = false;
          brushCursorGroup.visible = false;
          return;
        }

        updateMouseCoords(e.clientX, e.clientY);
        raycaster.setFromCamera(_mouse, camera);
        const meshes = currentStatue.paintableMeshes.map((m) => m.mesh);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
          const hit = intersects[0];
          const meshData = findPaintableMeshData(hit.object);

          // Position 3D paintbrush cursor at surface hit point oriented along normal
          _hitPoint.copy(hit.point);
          if (hit.face) {
            _normalMatrix.getNormalMatrix(hit.object.matrixWorld);
            _hitNormal.copy(hit.face.normal).applyMatrix3(_normalMatrix).normalize();
            _targetQuat.setFromUnitVectors(_upVec, _hitNormal);
            brushCursorGroup.quaternion.slerp(_targetQuat, 0.35);
          }
          brushCursorGroup.position.copy(_hitPoint);
          brushCursorGroup.visible = true;

          const partId = meshData?.partId || null;
          if (partId !== lastHoveredPart) {
            lastHoveredPart = partId;
            stateRef.current.onPartHovered(partId);
          }

          if (
            isPaintingStroke &&
            stateRef.current.selectedTool !== "fill" &&
            stateRef.current.selectedTool !== "erase_part"
          ) {
            performPaintAtHit(hit, false);
          } else {
            hasLastUv = false;
          }
        } else {
          brushCursorGroup.visible = false;
          hasLastUv = false;
          if (lastHoveredPart !== null) {
            lastHoveredPart = null;
            stateRef.current.onPartHovered(null);
          }
        }
      };

      const stopPaintingStroke = (e?: PointerEvent) => {
        if (e) {
          activePointers.delete(e.pointerId);
          if (e.pointerType === "touch" && activePointers.size === 0) {
            brushCursorGroup.visible = false;
          }
        } else {
          activePointers.clear();
        }
        isPaintingStroke = false;
        hasLastUv = false;
        controls.enabled = true;
      };

      const domElem = renderer.domElement;
      domElem.style.touchAction = "none";
      domElem.addEventListener("contextmenu", onContextMenu);
      domElem.addEventListener("pointerdown", onPointerDown, { capture: true });
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", stopPaintingStroke);
      window.addEventListener("pointercancel", stopPaintingStroke);
      window.addEventListener("blur", () => stopPaintingStroke());

      // Expose imperative actions to parent React UI
      sceneActionsRef.current = {
        resetStatue: () => {
          if (!currentStatue) return;
          currentStatue.paintableMeshes.forEach((m) => {
            resetCanvasToPlaster(m.ctx, m.canvas.width, m.canvas.height, m.basePlasterType);
            m.texture.needsUpdate = true;
          });
          bounceScale = 0.9;
          bounceVelocity = 2.5;
        },
        paintSample: () => {
          if (!currentStatue) return;
          const animalDef = ANIMAL_STATUES.find((a) => a.id === stateRef.current.animalId);
          if (!animalDef) return;
          animalDef.parts.forEach((partDef) => {
            const meshes = currentStatue!.partMeshesMap.get(partDef.id) || [];
            meshes.forEach((m) => fillCanvasWithColor(m, partDef.suggestedColorHex));
            stateRef.current.onPartPainted(partDef.id, partDef.suggestedColorHex);
          });
          bounceScale = 1.1;
          bounceVelocity = -1.8;
          soundEngine.playPartFillSound();
        },
        rotateBy: (angle: number) => {
          targetTurntableRotY += angle;
        },
        zoomBy: (scaleFactor: number) => {
          const offset = camera.position.clone().sub(controls.target);
          const currentDist = offset.length();
          const nextDist = THREE.MathUtils.clamp(
            currentDist * scaleFactor,
            controls.minDistance,
            controls.maxDistance
          );
          offset.normalize().multiplyScalar(nextDist);
          camera.position.copy(controls.target).add(offset);
          controls.update();
        },
        celebrateSpin: () => {
          targetTurntableRotY += Math.PI * 2;
          bounceScale = 1.14;
          bounceVelocity = -2.0;
        },
        rebuildAnimal: (id: AnimalId) => {
          loadAnimal(id);
        },
        updateBrushAppearance: (hex: string, tool: BrushToolId, radiusPx: number) => {
          const activeHex = tool === "eraser" || tool === "erase_part" ? "#F4ACB7" : hex;
          tipMat.color.set(activeHex);
          ringMat.color.set(activeHex);

          // Scale 3D brush tip & precision ring proportionally from 1px (needle fine) to 60px (broad)
          const tipWidthScale = THREE.MathUtils.clamp(0.18 + (radiusPx / 28) * 0.95, 0.18, 1.85);
          const ferruleScale = THREE.MathUtils.clamp(0.45 + (radiusPx / 40) * 0.65, 0.45, 1.35);
          tipMesh.scale.set(tipWidthScale, 1, tipWidthScale);
          ferruleMesh.scale.set(ferruleScale, 1, ferruleScale);
          ringMesh.scale.set(tipWidthScale, 1, tipWidthScale);
        },
      };

      // 10. Handle Window Resize (Responsive FOV for Portrait Phone vs Tablet/Desktop)
      const onResize = () => {
        if (!container) return;
        const w = container.clientWidth;
        const h = Math.max(1, container.clientHeight);
        const aspect = w / h;
        camera.aspect = aspect;
        camera.fov = aspect < 0.75 ? 48 : aspect < 1.0 ? 44 : 40;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      // 11. Animation Loop with Clamped Delta & Software-WebGL Fence Pacing
      let frameId = 0;
      let isDisposed = false;
      const clock = new THREE.Clock();

      function afterDraw(cb: () => void) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || !gl.fenceSync) {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      function tick() {
        if (isDisposed) return;
        const rawDt = clock.getDelta();
        const dt = Math.min(rawDt, 0.05);
        const elapsed = clock.getElapsedTime();

        if (controls.enableDamping) {
          controls.update();
        }

        // Smoothly interpolate Smart Eye-Care Dark Studio Background & Lighting
        const {
          studioThemeId: themeId,
          animalId: curAnimalId,
          selectedColorHex: curColorHex,
        } = stateRef.current;

        const baseHarmony =
          themeId === "auto"
            ? ANIMAL_DARK_HARMONIES[curAnimalId] || ANIMAL_DARK_HARMONIES.duck
            : STUDIO_THEMES.find((t) => t.id === themeId) || STUDIO_THEMES[0];

        _targetSkyColor.set(baseHarmony.skyHex);
        _targetFloorColor.set(baseHarmony.floorHex);
        _targetRimColor.set(baseHarmony.rimHex);
        _brushAccentColor.set(curColorHex);

        // Intelligently blend a subtle 8% brush-color tint into the studio floor & 25% into the rim light when in 'auto' mode
        if (themeId === "auto") {
          _targetFloorColor.lerp(_brushAccentColor, 0.06);
          _targetRimColor.lerp(_brushAccentColor, 0.25);
        }

        const colorLerpFactor = 1 - Math.exp(-4.0 * dt);
        skyColor.lerp(_targetSkyColor, colorLerpFactor);
        fog.color.copy(skyColor);
        studioFloorMat.color.lerp(_targetFloorColor, colorLerpFactor);
        hemiLight.groundColor.copy(studioFloorMat.color);
        rimLight.color.lerp(_targetRimColor, colorLerpFactor);

        if (currentStatue) {
          // Title screen gentle live-world showcase spin vs Playing mode damped turntable
          if (stateRef.current.isTitleScreen) {
            targetTurntableRotY += dt * 0.55;
          }
          currentStatue.turntable.rotation.y = THREE.MathUtils.damp(
            currentStatue.turntable.rotation.y,
            targetTurntableRotY,
            8,
            dt
          );

          // Squash-and-stretch spring physics on statue
          const springForce = (1.0 - bounceScale) * 48.0;
          bounceVelocity += springForce * dt;
          bounceVelocity *= Math.exp(-9.5 * dt);
          bounceScale += bounceVelocity * dt;
          const sy = THREE.MathUtils.clamp(bounceScale, 0.82, 1.18);
          const sxz = 1.0 / Math.sqrt(sy);
          currentStatue.turntable.scale.set(sxz, sy, sxz);

          // Highlight hinted or hovered part with gentle warm emissive shimmer
          const activeHintPart = stateRef.current.highlightedPartId;
          const shimmer = (Math.sin(elapsed * 5.5) * 0.5 + 0.5) * 0.28 + 0.08;
          for (const item of currentStatue.paintableMeshes) {
            if (activeHintPart && item.partId === activeHintPart) {
              item.material.emissive.setHex(0xffb703);
              item.material.emissiveIntensity = shimmer;
            } else if (lastHoveredPart && item.partId === lastHoveredPart && !isPaintingStroke) {
              item.material.emissive.setHex(0x64748b);
              item.material.emissiveIntensity = 0.07;
            } else {
              item.material.emissiveIntensity = 0;
            }
          }
        }

        // Subtle 3D brush tip press when actively painting
        if (brushCursorGroup.visible) {
          const pressOffset = isPaintingStroke ? -0.015 : 0;
          tipMesh.position.y = pressOffset;
          ringMesh.scale.y = 1.0;
        }

        // Advance subtle 10% micro-dust particles
        for (const p of particles) {
          if (p.life > 0) {
            p.life -= dt;
            if (p.life <= 0) {
              p.mesh.visible = false;
            } else {
              const lifeRatio = Math.max(0.01, p.life / p.maxLife);
              p.velocity.y -= p.gravity * dt;
              if (p.isDust) {
                p.velocity.multiplyScalar(Math.exp(-4.0 * dt));
                p.mesh.scale.setScalar(p.baseScale * lifeRatio);
                p.mat.opacity = lifeRatio * 0.25;
              } else {
                p.mesh.scale.setScalar(p.baseScale * lifeRatio);
                p.mat.opacity = lifeRatio * 0.32;
              }
              p.mesh.position.addScaledVector(p.velocity, dt);
            }
          }
        }

        // Advance subtle wet-paint trails
        for (const tr of paintTrails) {
          if (tr.life > 0) {
            tr.life -= dt;
            if (tr.life <= 0) {
              tr.mesh.visible = false;
            } else {
              const progress = 1 - tr.life / tr.maxLife;
              const spreadScale = tr.startScale * (1.0 + progress * 0.15);
              tr.mesh.scale.setScalar(spreadScale);
              tr.mat.opacity = (1 - progress) * 0.16;
            }
          }
        }

        renderer.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      }

      tick();

      return () => {
        isDisposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        domElem.removeEventListener("contextmenu", onContextMenu);
        domElem.removeEventListener("pointerdown", onPointerDown, { capture: true });
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", stopPaintingStroke);
        window.removeEventListener("pointercancel", stopPaintingStroke);
        window.removeEventListener("resize", onResize);
        controls.dispose();
        if (currentStatue) currentStatue.dispose();
        studioFloorGeo.dispose();
        studioFloorMat.dispose();
        contactShadowGeo.dispose();
        contactShadowMat.dispose();
        shadowTex.dispose();
        potGeo.dispose();
        ringGeo.dispose();
        ringMat.dispose();
        tipGeo.dispose();
        tipMat.dispose();
        ferruleGeo.dispose();
        ferruleMat.dispose();
        handleGeo.dispose();
        handleMat.dispose();
        dropletGeo.dispose();
        dustGeo.dispose();
        trailGeo.dispose();
        trailTex.dispose();
        particles.forEach((p) => p.mat.dispose());
        paintTrails.forEach((t) => t.mat.dispose());
        renderer.dispose();
      };
    }, []);

    return (
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        aria-label="Không gian tô tượng 3D"
      />
    );
  }
);
