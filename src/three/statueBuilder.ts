import * as THREE from "three";
import { AnimalId, BrushToolId } from "../data/statuesData";

export interface PaintableMeshData {
  mesh: THREE.Mesh;
  partId: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  material: THREE.MeshStandardMaterial;
  basePlasterType: "white" | "eye" | "detail";
}

export interface BuiltStatue {
  group: THREE.Group;
  turntable: THREE.Group;
  paintableMeshes: PaintableMeshData[];
  partMeshesMap: Map<string, PaintableMeshData[]>;
  dispose: () => void;
}

// Ensure every BufferGeometry has normalized [0.05..0.95] UVs so 3D brush raycast hit.uv always maps cleanly onto the 512x512 canvas
function ensureNormalizedUVs(geometry: THREE.BufferGeometry) {
  const uvAttr = geometry.attributes.uv;
  if (!uvAttr) {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);
    const pos = geometry.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const u = Math.atan2(x, z) / (Math.PI * 2) + 0.5;
      const v = size.y > 0.001 ? (y - box.min.y) / size.y : 0.5;
      uvs[i * 2] = THREE.MathUtils.clamp(u, 0.02, 0.98);
      uvs[i * 2 + 1] = THREE.MathUtils.clamp(v, 0.02, 0.98);
    }
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return;
  }

  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;

  for (let i = 0; i < uvAttr.count; i++) {
    const u = uvAttr.getX(i);
    const v = uvAttr.getY(i);
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }

  // If UVs exceed [0, 1] (like ExtrudeGeometry), normalize them into [0.05, 0.95]
  if (minU < -0.01 || maxU > 1.01 || minV < -0.01 || maxV > 1.01) {
    const rangeU = Math.max(0.0001, maxU - minU);
    const rangeV = Math.max(0.0001, maxV - minV);
    for (let i = 0; i < uvAttr.count; i++) {
      const u = 0.05 + ((uvAttr.getX(i) - minU) / rangeU) * 0.9;
      const v = 0.05 + ((uvAttr.getY(i) - minV) / rangeV) * 0.9;
      uvAttr.setXY(i, u, v);
    }
    uvAttr.needsUpdate = true;
  }
}

// Create shared subtle plaster bump texture
let sharedPlasterBump: THREE.CanvasTexture | null = null;
function getPlasterBumpTexture(): THREE.CanvasTexture {
  if (sharedPlasterBump) return sharedPlasterBump;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 115 + Math.floor(Math.random() * 26);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  sharedPlasterBump = tex;
  return tex;
}

export function resetCanvasToPlaster(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseType: "white" | "eye" | "detail" = "white"
) {
  // Base warm ceramic white plaster
  ctx.fillStyle = "#FAF8F5";
  ctx.fillRect(0, 0, width, height);

  // Subtle gypsum plaster speckles so the unpainted white statue looks tactile
  ctx.fillStyle = "rgba(226, 222, 214, 0.38)";
  for (let i = 0; i < 360; i++) {
    const x = (i * 73) % width;
    const y = (i * 137) % height;
    ctx.fillRect(x, y, 2.5, 2.5);
  }

  if (baseType === "eye") {
    // Draw a subtle friendly graphite sketch outline & shine on unpainted eyes so the plaster statue has a cute expression
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(width * 0.35, height * 0.35, width * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function fillCanvasWithColor(
  data: PaintableMeshData,
  hexColor: string
) {
  const { ctx, canvas, texture } = data;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, w, h);

  // Add subtle hand-painted ceramic brush sheen
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(0, i * (h / 12), w, 6);
  }

  if (data.basePlasterType === "eye") {
    // Keep cute eye catchlight sparkle!
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.32, w * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }

  texture.needsUpdate = true;
}

export function paintBrushStrokeOnCanvas(
  data: PaintableMeshData,
  uv: THREE.Vector2,
  prevUv: THREE.Vector2 | null,
  hexColor: string,
  tool: BrushToolId,
  radiusPx: number
) {
  if (tool === "fill") {
    fillCanvasWithColor(data, hexColor);
    return;
  }

  if (tool === "erase_part") {
    resetCanvasToPlaster(data.ctx, data.canvas.width, data.canvas.height, data.basePlasterType);
    data.texture.needsUpdate = true;
    return;
  }

  const { ctx, canvas, texture } = data;
  const w = canvas.width;
  const h = canvas.height;
  const x = uv.x * w;
  const y = (1 - uv.y) * h;

  const hasValidPrev = prevUv && prevUv.distanceTo(uv) < 0.35;
  const startX = hasValidPrev ? prevUv!.x * w : x;
  const startY = hasValidPrev ? (1 - prevUv!.y) * h : y;

  // Scale radius to 1024x1024 HD texture space while keeping 1px-4px ultra-fine for meticulous details
  const hdScale = w / 512;
  const effectiveRadius = Math.max(1.1, radiusPx * hdScale * 0.85);

  if (tool === "smooth") {
    // High-Definition crisp continuous vector stroke + round caps for ultra-sharp fine lines
    ctx.save();
    ctx.strokeStyle = hexColor;
    ctx.fillStyle = hexColor;
    ctx.lineWidth = effectiveRadius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Ensure single-click dot is also drawn crisply
    if (!hasValidPrev) {
      ctx.beginPath();
      ctx.arc(x, y, effectiveRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle wet-paint sheen along larger strokes without messy edge dots
    if (radiusPx >= 10) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = Math.max(1.0, effectiveRadius * 0.35);
      ctx.beginPath();
      ctx.moveTo(startX - effectiveRadius * 0.18, startY - effectiveRadius * 0.18);
      ctx.lineTo(x - effectiveRadius * 0.18, y - effectiveRadius * 0.18);
      ctx.stroke();
    }

    ctx.restore();
    texture.needsUpdate = true;
    return;
  }

  const dist = Math.hypot(x - startX, y - startY);
  const steps = Math.max(1, Math.ceil(dist / Math.max(0.75, effectiveRadius * 0.16)));

  for (let s = 0; s <= steps; s++) {
    const t = steps === 0 ? 1 : s / steps;
    const cx = startX + (x - startX) * t;
    const cy = startY + (y - startY) * t;

    if (tool === "eraser") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveRadius, 0, Math.PI * 2);
      ctx.fillStyle = data.basePlasterType === "eye" ? "#475569" : "#FAF8F5";
      ctx.fill();

      // Restore subtle plaster grain speckles on erased area
      if (data.basePlasterType !== "eye" && effectiveRadius >= 4) {
        ctx.fillStyle = "rgba(226, 222, 214, 0.38)";
        const speckleCount = Math.max(2, Math.floor(effectiveRadius * 0.25));
        for (let i = 0; i < speckleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * effectiveRadius * 0.85;
          ctx.fillRect(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 2, 2);
        }
      }
      ctx.restore();
    } else if (tool === "crayon") {
      ctx.save();
      ctx.fillStyle = hexColor;
      // Base soft core
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      // Crayon wax grain dots
      ctx.globalAlpha = 0.95;
      const grainCount = Math.max(4, Math.floor(effectiveRadius * 1.4));
      const maxDot = Math.min(4.5, Math.max(1.0, effectiveRadius * 0.22));
      for (let i = 0; i < grainCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * effectiveRadius * 1.02;
        const gx = cx + Math.cos(angle) * r;
        const gy = cy + Math.sin(angle) * r;
        const dotSize = 0.9 + Math.random() * maxDot;
        ctx.fillRect(gx - dotSize * 0.5, gy - dotSize * 0.5, dotSize, dotSize);
      }
      ctx.restore();
    } else if (tool === "spray") {
      ctx.save();
      const grad = ctx.createRadialGradient(
        cx,
        cy,
        Math.max(0.8, effectiveRadius * 0.1),
        cx,
        cy,
        effectiveRadius * 1.3
      );
      grad.addColorStop(0, hexColor);
      grad.addColorStop(0.6, hexColor + "99");
      grad.addColorStop(1, hexColor + "00");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveRadius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Fine airbrush mist droplets scaled to radius
      ctx.fillStyle = hexColor;
      const dropCount = Math.max(5, Math.floor(effectiveRadius * 0.55));
      const dropSize = Math.max(1.0, Math.min(2.4, effectiveRadius * 0.11));
      for (let i = 0; i < dropCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * effectiveRadius * 1.35;
        ctx.fillRect(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, dropSize, dropSize);
      }
      ctx.restore();
    } else if (tool === "star") {
      ctx.save();
      ctx.fillStyle = hexColor;
      ctx.beginPath();
      ctx.arc(cx, cy, effectiveRadius * 0.9, 0, Math.PI * 2);
      ctx.fill();

      if (s === steps) {
        drawStarStamp(
          ctx,
          cx,
          cy,
          5,
          Math.max(2.5, effectiveRadius * 0.6),
          Math.max(1.2, effectiveRadius * 0.28),
          "#FFFDF7"
        );
      }
      ctx.restore();
    }
  }

  texture.needsUpdate = true;
}

function drawStarStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fillStyle: string
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

export function buildAnimalStatue(
  animalId: AnimalId,
  maxAnisotropy: number
): BuiltStatue {
  const rootGroup = new THREE.Group();
  const turntable = new THREE.Group();
  const statueGroup = new THREE.Group();

  const paintableMeshes: PaintableMeshData[] = [];
  const partMeshesMap = new Map<string, PaintableMeshData[]>();
  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];
  const texturesToDispose: THREE.Texture[] = [];

  // Build Painter's Wooden Turntable Pedestal (Bàn xoay tô tượng thạch cao)
  const baseGeo = new THREE.CylinderGeometry(2.15, 2.35, 0.28, 48);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xe6d5b8,
    roughness: 0.45,
    metalness: 0.05,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -0.14;
  baseMesh.receiveShadow = true;
  baseMesh.castShadow = true;
  turntable.add(baseMesh);

  const rimGeo = new THREE.TorusGeometry(2.12, 0.055, 16, 64);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4a373,
    roughness: 0.35,
    metalness: 0.15,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = 0.0;
  turntable.add(rimMesh);

  geometriesToDispose.push(baseGeo, rimGeo);
  materialsToDispose.push(baseMat, rimMat);

  const bumpTex = getPlasterBumpTexture();

  // Helper to create a paintable plaster mesh and register it to a partId
  const addPartMesh = (
    partId: string,
    geometry: THREE.BufferGeometry,
    position: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1],
    roughness: number = 0.58,
    basePlasterType: "white" | "eye" | "detail" = "white"
  ): THREE.Mesh => {
    ensureNormalizedUVs(geometry);
    geometriesToDispose.push(geometry);

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    resetCanvasToPlaster(ctx, 1024, 1024, basePlasterType);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = maxAnisotropy;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texturesToDispose.push(texture);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: bumpTex,
      bumpScale: 0.008,
      roughness: basePlasterType === "eye" ? 0.18 : roughness,
      metalness: basePlasterType === "eye" ? 0.12 : 0.04,
    });
    materialsToDispose.push(material);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.partId = partId;

    statueGroup.add(mesh);

    const item: PaintableMeshData = {
      mesh,
      partId,
      canvas,
      ctx,
      texture,
      material,
      basePlasterType,
    };
    paintableMeshes.push(item);

    const list = partMeshesMap.get(partId) || [];
    list.push(item);
    partMeshesMap.set(partId, list);

    return mesh;
  };

  if (animalId === "duck") {
    // 1. Plump Duck Body using LatheGeometry
    const bodyPoints = [
      new THREE.Vector2(0.01, 0.18),
      new THREE.Vector2(0.75, 0.22),
      new THREE.Vector2(1.08, 0.58),
      new THREE.Vector2(1.02, 1.05),
      new THREE.Vector2(0.68, 1.38),
      new THREE.Vector2(0.01, 1.45),
    ];
    addPartMesh("body", new THREE.LatheGeometry(bodyPoints, 36), [0, 0, 0], [0, 0, 0], [1, 1, 1.12], 0.55);

    // 2. Front Belly Patch
    addPartMesh("belly", new THREE.SphereGeometry(0.72, 32, 24), [0, 0.76, 0.52], [0.12, 0, 0], [0.92, 0.82, 0.52], 0.62);

    // 3. Round Duck Head
    addPartMesh("head", new THREE.SphereGeometry(0.82, 36, 28), [0, 1.98, 0.15], [0, 0, 0], [1.02, 0.96, 1.0], 0.52);

    // 4. Cute Top Hair Tuft (part of head)
    addPartMesh("head", new THREE.ConeGeometry(0.18, 0.38, 20), [0, 2.82, 0.12], [-0.25, 0, 0], [1, 1, 0.7], 0.52);

    // 5. Duck Beak (Upper + Lower lip)
    addPartMesh("beak", new THREE.SphereGeometry(0.42, 28, 20), [0, 1.92, 0.92], [0.1, 0, 0], [1.15, 0.42, 0.88], 0.38);
    addPartMesh("beak", new THREE.SphereGeometry(0.34, 24, 18), [0, 1.81, 0.86], [0.22, 0, 0], [0.95, 0.32, 0.75], 0.38);

    // 6. Rosy Cheeks
    addPartMesh("cheeks", new THREE.SphereGeometry(0.19, 20, 16), [-0.52, 1.84, 0.72], [0, -0.4, 0], [1.1, 0.8, 0.5], 0.45);
    addPartMesh("cheeks", new THREE.SphereGeometry(0.19, 20, 16), [0.52, 1.84, 0.72], [0, 0.4, 0], [1.1, 0.8, 0.5], 0.45);

    // 7. Expressive Eyes
    addPartMesh("eyes", new THREE.SphereGeometry(0.15, 24, 20), [-0.34, 2.12, 0.84], [0, 0, 0], [1, 1.15, 0.65], 0.18, "eye");
    addPartMesh("eyes", new THREE.SphereGeometry(0.15, 24, 20), [0.34, 2.12, 0.84], [0, 0, 0], [1, 1.15, 0.65], 0.18, "eye");

    // 8. Left & Right Wings
    addPartMesh("wings", new THREE.SphereGeometry(0.48, 28, 20), [-1.02, 0.92, 0.0], [0.2, 0.15, 0.38], [0.38, 0.95, 0.68], 0.58);
    addPartMesh("wings", new THREE.SphereGeometry(0.48, 28, 20), [1.02, 0.92, 0.0], [0.2, -0.15, -0.38], [0.38, 0.95, 0.68], 0.58);

    // 9. Cute Bowtie on Neck
    addPartMesh("bowtie", new THREE.ConeGeometry(0.24, 0.38, 20), [-0.2, 1.34, 0.88], [0, 0, -Math.PI / 2], [1, 1, 0.55], 0.35);
    addPartMesh("bowtie", new THREE.ConeGeometry(0.24, 0.38, 20), [0.2, 1.34, 0.88], [0, 0, Math.PI / 2], [1, 1, 0.55], 0.35);
    addPartMesh("bowtie", new THREE.SphereGeometry(0.12, 16, 16), [0, 1.34, 0.92], [0, 0, 0], [1, 1, 0.8], 0.35);

    // 10. Perky Tail
    addPartMesh("tail", new THREE.ConeGeometry(0.32, 0.58, 24), [0, 0.88, -1.12], [-0.85, 0, 0], [1.1, 1, 0.75], 0.58);

    // 11. Webbed Feet
    addPartMesh("feet", new THREE.CylinderGeometry(0.32, 0.38, 0.18, 24), [-0.46, 0.09, 0.35], [0, 0.18, 0], [1.1, 1, 1.45], 0.45);
    addPartMesh("feet", new THREE.CylinderGeometry(0.32, 0.38, 0.18, 24), [0.46, 0.09, 0.35], [0, -0.18, 0], [1.1, 1, 1.45], 0.45);
  } else if (animalId === "bear") {
    // 1. Teddy Bear Body
    addPartMesh("body", new THREE.SphereGeometry(0.96, 36, 28), [0, 0.95, 0], [0, 0, 0], [1.02, 1.08, 0.92], 0.65);

    // 2. Round Tummy Patch
    addPartMesh("belly", new THREE.SphereGeometry(0.68, 32, 24), [0, 0.92, 0.45], [0, 0, 0], [0.95, 0.98, 0.58], 0.52);

    // 3. Teddy Head
    addPartMesh("head", new THREE.SphereGeometry(0.86, 36, 28), [0, 2.18, 0.06], [0, 0, 0], [1.06, 0.96, 0.96], 0.62);

    // 4. Outer Round Ears
    addPartMesh("ears_outer", new THREE.SphereGeometry(0.34, 24, 20), [-0.68, 2.82, 0.02], [0, 0, 0], [1, 1, 0.55], 0.65);
    addPartMesh("ears_outer", new THREE.SphereGeometry(0.34, 24, 20), [0.68, 2.82, 0.02], [0, 0, 0], [1, 1, 0.55], 0.65);

    // 5. Inner Ears
    addPartMesh("ears_inner", new THREE.SphereGeometry(0.21, 20, 16), [-0.68, 2.82, 0.14], [0, 0, 0], [1, 1, 0.4], 0.48);
    addPartMesh("ears_inner", new THREE.SphereGeometry(0.21, 20, 16), [0.68, 2.82, 0.14], [0, 0, 0], [1, 1, 0.4], 0.48);

    // 6. Snout
    addPartMesh("snout", new THREE.SphereGeometry(0.38, 28, 20), [0, 2.02, 0.78], [0, 0, 0], [1.18, 0.85, 0.72], 0.48);

    // 7. Cute Button Nose
    addPartMesh("nose", new THREE.SphereGeometry(0.15, 20, 16), [0, 2.14, 1.05], [0, 0, 0], [1.25, 0.85, 0.75], 0.28);

    // 8. Eyes
    addPartMesh("eyes", new THREE.SphereGeometry(0.14, 24, 20), [-0.34, 2.3, 0.8], [0, 0, 0], [1, 1.1, 0.65], 0.18, "eye");
    addPartMesh("eyes", new THREE.SphereGeometry(0.14, 24, 20), [0.34, 2.3, 0.8], [0, 0, 0], [1, 1.1, 0.65], 0.18, "eye");

    // 9. Cuddly Arms
    addPartMesh("arms", new THREE.CapsuleGeometry(0.28, 0.55, 16, 24), [-0.98, 1.12, 0.26], [0.45, 0, 0.42], [1, 1, 1], 0.65);
    addPartMesh("arms", new THREE.CapsuleGeometry(0.28, 0.55, 16, 24), [0.98, 1.12, 0.26], [0.45, 0, -0.42], [1, 1, 1], 0.65);

    // 10. Sitting Legs
    addPartMesh("legs", new THREE.CapsuleGeometry(0.32, 0.52, 16, 24), [-0.55, 0.32, 0.58], [Math.PI / 2.2, 0.2, 0], [1, 1, 1], 0.65);
    addPartMesh("legs", new THREE.CapsuleGeometry(0.32, 0.52, 16, 24), [0.55, 0.32, 0.58], [Math.PI / 2.2, -0.2, 0], [1, 1, 1], 0.65);

    // 11. Mini Honey Pot next to the bear
    const potPoints = [
      new THREE.Vector2(0.01, 0.0),
      new THREE.Vector2(0.32, 0.02),
      new THREE.Vector2(0.44, 0.28),
      new THREE.Vector2(0.36, 0.52),
      new THREE.Vector2(0.4, 0.62),
      new THREE.Vector2(0.01, 0.64),
    ];
    addPartMesh("honeypot", new THREE.LatheGeometry(potPoints, 28), [1.15, 0.02, 0.65], [0, 0, 0], [1, 1, 1], 0.32);
  } else if (animalId === "rabbit") {
    // 1. Bunny Body
    addPartMesh("body", new THREE.SphereGeometry(0.88, 36, 28), [0, 0.9, 0], [0, 0, 0], [0.96, 1.12, 0.92], 0.58);

    // 2. Bunny Belly
    addPartMesh("belly", new THREE.SphereGeometry(0.62, 28, 22), [0, 0.88, 0.44], [0, 0, 0], [0.88, 1.02, 0.55], 0.48);

    // 3. Bunny Head
    addPartMesh("head", new THREE.SphereGeometry(0.82, 36, 28), [0, 2.08, 0.08], [0, 0, 0], [1.05, 0.95, 0.96], 0.55);

    // 4. Long Upright Bunny Ears
    addPartMesh("ears_outer", new THREE.CapsuleGeometry(0.24, 0.92, 16, 24), [-0.38, 3.12, -0.02], [0.08, 0, 0.14], [1, 1, 0.52], 0.58);
    addPartMesh("ears_outer", new THREE.CapsuleGeometry(0.24, 0.92, 16, 24), [0.38, 3.12, -0.02], [0.08, 0, -0.14], [1, 1, 0.52], 0.58);

    // 5. Pink Inner Ears
    addPartMesh("ears_inner", new THREE.CapsuleGeometry(0.14, 0.72, 12, 20), [-0.38, 3.1, 0.09], [0.08, 0, 0.14], [1, 1, 0.35], 0.45);
    addPartMesh("ears_inner", new THREE.CapsuleGeometry(0.14, 0.72, 12, 20), [0.38, 3.1, 0.09], [0.08, 0, -0.14], [1, 1, 0.35], 0.45);

    // 6. Cute Twitching Nose
    addPartMesh("nose", new THREE.SphereGeometry(0.13, 20, 16), [0, 2.04, 0.88], [0, 0, 0], [1.2, 0.85, 0.8], 0.3);

    // 7. Rosy Cheeks
    addPartMesh("cheeks", new THREE.SphereGeometry(0.2, 20, 16), [-0.48, 1.94, 0.68], [0, -0.35, 0], [1.15, 0.82, 0.48], 0.48);
    addPartMesh("cheeks", new THREE.SphereGeometry(0.2, 20, 16), [0.48, 1.94, 0.68], [0, 0.35, 0], [1.15, 0.82, 0.48], 0.48);

    // 8. Eyes
    addPartMesh("eyes", new THREE.SphereGeometry(0.15, 24, 20), [-0.33, 2.2, 0.78], [0, 0, 0], [1, 1.15, 0.65], 0.18, "eye");
    addPartMesh("eyes", new THREE.SphereGeometry(0.15, 24, 20), [0.33, 2.2, 0.78], [0, 0, 0], [1, 1.15, 0.65], 0.18, "eye");

    // 9. Paws
    addPartMesh("arms", new THREE.CapsuleGeometry(0.22, 0.48, 16, 20), [-0.82, 1.08, 0.32], [0.5, 0, 0.35], [1, 1, 1], 0.58);
    addPartMesh("arms", new THREE.CapsuleGeometry(0.22, 0.48, 16, 20), [0.82, 1.08, 0.32], [0.5, 0, -0.35], [1, 1, 1], 0.58);

    // 10. Hopper Feet
    addPartMesh("feet", new THREE.CapsuleGeometry(0.26, 0.48, 16, 20), [-0.48, 0.24, 0.45], [Math.PI / 2, 0.15, 0], [1.1, 1, 0.85], 0.58);
    addPartMesh("feet", new THREE.CapsuleGeometry(0.26, 0.48, 16, 20), [0.48, 0.24, 0.45], [Math.PI / 2, -0.15, 0], [1.1, 1, 0.85], 0.58);

    // 11. Fluffy Cotton Tail
    addPartMesh("tail", new THREE.SphereGeometry(0.32, 24, 20), [0, 0.52, -0.88], [0, 0, 0], [1, 1, 1], 0.72);

    // 12. Crunchy Carrot Prop
    addPartMesh("carrot", new THREE.ConeGeometry(0.26, 0.95, 24), [1.05, 0.48, 0.68], [0.3, 0, -2.4], [1, 1, 1], 0.42);
  } else if (animalId === "cat") {
    // 1. Kitten Body
    addPartMesh("body", new THREE.SphereGeometry(0.84, 36, 28), [0, 0.86, 0], [0, 0, 0], [0.95, 1.1, 0.9], 0.55);

    // 2. Soft Chest Tuft
    addPartMesh("chest", new THREE.SphereGeometry(0.56, 28, 22), [0, 0.98, 0.46], [0, 0, 0], [0.88, 0.95, 0.55], 0.62);

    // 3. Kitten Head
    addPartMesh("head", new THREE.SphereGeometry(0.84, 36, 28), [0, 2.04, 0.1], [0, 0, 0], [1.08, 0.94, 0.96], 0.55);

    // 4. Pointed Cat Ears
    addPartMesh("ears_outer", new THREE.ConeGeometry(0.36, 0.68, 24), [-0.56, 2.74, 0.04], [0, 0, 0.36], [1, 1, 0.62], 0.55);
    addPartMesh("ears_outer", new THREE.ConeGeometry(0.36, 0.68, 24), [0.56, 2.74, 0.04], [0, 0, -0.36], [1, 1, 0.62], 0.55);

    // 5. Inner Cat Ears
    addPartMesh("ears_inner", new THREE.ConeGeometry(0.22, 0.46, 20), [-0.55, 2.7, 0.14], [0, 0, 0.36], [1, 1, 0.4], 0.45);
    addPartMesh("ears_inner", new THREE.ConeGeometry(0.22, 0.46, 20), [0.55, 2.7, 0.14], [0, 0, -0.36], [1, 1, 0.4], 0.45);

    // 6. Pink Cat Nose
    addPartMesh("nose", new THREE.SphereGeometry(0.12, 20, 16), [0, 1.98, 0.9], [0, 0, 0], [1.25, 0.85, 0.75], 0.32);

    // 7. Eyes
    addPartMesh("eyes", new THREE.SphereGeometry(0.15, 24, 20), [-0.35, 2.12, 0.82], [0, 0, 0], [1.05, 1.12, 0.65], 0.18, "eye");
    addPartMesh("eyes", new THREE.SphereGeometry(0.15, 24, 20), [0.35, 2.12, 0.82], [0, 0, 0], [1.05, 1.12, 0.65], 0.18, "eye");

    // 8. Collar & Golden Bell
    addPartMesh("collar", new THREE.TorusGeometry(0.58, 0.085, 16, 40), [0, 1.48, 0.08], [Math.PI / 2 + 0.08, 0, 0], [1.05, 1, 1], 0.38);
    addPartMesh("bell", new THREE.SphereGeometry(0.18, 24, 20), [0, 1.38, 0.72], [0, 0, 0], [1, 1, 1], 0.22);

    // 9. Front Paws
    addPartMesh("paws_front", new THREE.CapsuleGeometry(0.21, 0.62, 16, 20), [-0.38, 0.48, 0.56], [0.18, 0, 0], [1, 1, 1], 0.58);
    addPartMesh("paws_front", new THREE.CapsuleGeometry(0.21, 0.62, 16, 20), [0.38, 0.48, 0.56], [0.18, 0, 0], [1, 1, 1], 0.58);

    // 10. Back Paws
    addPartMesh("paws_back", new THREE.SphereGeometry(0.32, 24, 20), [-0.66, 0.28, 0.12], [0, 0, 0], [0.85, 0.9, 1.25], 0.58);
    addPartMesh("paws_back", new THREE.SphereGeometry(0.32, 24, 20), [0.66, 0.28, 0.12], [0, 0, 0], [0.85, 0.9, 1.25], 0.58);

    // 11. Graceful Curved Tail using TubeGeometry
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.42, -0.75),
      new THREE.Vector3(0.35, 0.68, -1.15),
      new THREE.Vector3(0.62, 1.25, -1.05),
      new THREE.Vector3(0.45, 1.72, -0.85),
    ]);
    addPartMesh("tail", new THREE.TubeGeometry(tailCurve, 28, 0.15, 16, false), [0, 0, 0], [0, 0, 0], [1, 1, 1], 0.58);
  } else if (animalId === "elephant") {
    // 1. Baby Elephant Body
    addPartMesh("body", new THREE.SphereGeometry(0.98, 36, 28), [0, 0.96, 0], [0, 0, 0], [1.08, 1.05, 0.98], 0.58);

    // 2. Belly Patch
    addPartMesh("belly", new THREE.SphereGeometry(0.68, 28, 22), [0, 0.92, 0.48], [0, 0, 0], [0.95, 0.96, 0.58], 0.52);

    // 3. Elephant Head
    addPartMesh("head", new THREE.SphereGeometry(0.88, 36, 28), [0, 2.12, 0.12], [0, 0, 0], [1.06, 0.98, 0.98], 0.56);

    // 4. Curved Happy Trunk using TubeGeometry
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.02, 0.85),
      new THREE.Vector3(0, 1.78, 1.22),
      new THREE.Vector3(0, 1.68, 1.48),
      new THREE.Vector3(0, 1.96, 1.62),
    ]);
    addPartMesh("trunk", new THREE.TubeGeometry(trunkCurve, 28, 0.21, 18, false), [0, 0, 0], [0, 0, 0], [1, 1, 1], 0.54);

    // 5. Big Floppy Ears
    addPartMesh("ears_outer", new THREE.SphereGeometry(0.68, 28, 24), [-1.05, 2.14, 0.0], [0, 0.25, 0.15], [0.85, 1.12, 0.28], 0.58);
    addPartMesh("ears_outer", new THREE.SphereGeometry(0.68, 28, 24), [1.05, 2.14, 0.0], [0, -0.25, -0.15], [0.85, 1.12, 0.28], 0.58);

    // 6. Inner Ears
    addPartMesh("ears_inner", new THREE.SphereGeometry(0.48, 24, 20), [-1.02, 2.12, 0.12], [0, 0.25, 0.15], [0.82, 1.05, 0.22], 0.48);
    addPartMesh("ears_inner", new THREE.SphereGeometry(0.48, 24, 20), [1.02, 2.12, 0.12], [0, -0.25, -0.15], [0.82, 1.05, 0.22], 0.48);

    // 7. Cute Mini Tusks
    addPartMesh("tusks", new THREE.ConeGeometry(0.11, 0.38, 18), [-0.32, 1.82, 0.98], [0.95, -0.2, 0], [1, 1, 1], 0.25);
    addPartMesh("tusks", new THREE.ConeGeometry(0.11, 0.38, 18), [0.32, 1.82, 0.98], [0.95, 0.2, 0], [1, 1, 1], 0.25);

    // 8. Mini Golden Crown on Head
    addPartMesh("crown", new THREE.CylinderGeometry(0.32, 0.26, 0.28, 16), [0, 2.98, 0.12], [0, 0, 0], [1, 1, 1], 0.28);

    // 9. Eyes
    addPartMesh("eyes", new THREE.SphereGeometry(0.14, 24, 20), [-0.36, 2.26, 0.85], [0, 0, 0], [1, 1.1, 0.65], 0.18, "eye");
    addPartMesh("eyes", new THREE.SphereGeometry(0.14, 24, 20), [0.36, 2.26, 0.85], [0, 0, 0], [1, 1.1, 0.65], 0.18, "eye");

    // 10. Four Sturdy Legs
    addPartMesh("legs", new THREE.CylinderGeometry(0.28, 0.32, 0.62, 24), [-0.52, 0.31, 0.48], [0, 0, 0], [1, 1, 1], 0.58);
    addPartMesh("legs", new THREE.CylinderGeometry(0.28, 0.32, 0.62, 24), [0.52, 0.31, 0.48], [0, 0, 0], [1, 1, 1], 0.58);
    addPartMesh("legs", new THREE.CylinderGeometry(0.28, 0.32, 0.62, 24), [-0.52, 0.31, -0.42], [0, 0, 0], [1, 1, 1], 0.58);
    addPartMesh("legs", new THREE.CylinderGeometry(0.28, 0.32, 0.62, 24), [0.52, 0.31, -0.42], [0, 0, 0], [1, 1, 1], 0.58);

    // 11. Little Tail
    addPartMesh("tail", new THREE.ConeGeometry(0.14, 0.48, 18), [0, 0.72, -1.02], [-0.75, 0, 0], [1, 1, 1], 0.58);
  }

  turntable.add(statueGroup);
  rootGroup.add(turntable);

  return {
    group: rootGroup,
    turntable,
    paintableMeshes,
    partMeshesMap,
    dispose: () => {
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
      texturesToDispose.forEach((t) => t.dispose());
    },
  };
}
