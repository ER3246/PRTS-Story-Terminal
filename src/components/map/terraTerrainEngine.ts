import * as THREE from 'three';
import {
  terraHexCells,
  cellIndex,
  neighborKeys,
  HEX_META,
  HEX_PITCH,
  HEX_ROW_PITCH,
  HEX_RADIUS,
  HEX_V_STRETCH,
  type CellType,
  type HexCell,
} from '../../data/terraHexGrid';
import { terraRegions } from '../../data/terraRegions';

export const MAP_W = 821;
export const MAP_H = 1024;
export const MAP_CENTER_X = 410.5;
export const MAP_CENTER_Y = 512.0;
export const GRID_W = 256;
export const GRID_H = 320;

export type TerraMapLens = 'relief' | 'chronicle' | 'blueprint';

const regionIndexMap = new Map<string, number>();
terraRegions.forEach((r, idx) => {
  regionIndexMap.set(r.id, idx + 1); // 1-based; 0 = neutral / water
});

export function getRegionPaletteIndex(regionId: string | null | undefined): number {
  if (!regionId) return 0;
  return regionIndexMap.get(regionId) ?? 0;
}

const REGION_PALETTE_HEX: string[] = [
  '#262b36', // index 0: neutral land
  ...terraRegions.map((r) => r.badgeColor || '#4b5563'),
];

const BIOME_CODE: Record<CellType, number> = {
  void: 0,
  deep: 1,
  shallow: 2,
  crater: 3,
  land: 4,
  frontier: 5,
  icefield: 6,
  foehn_hotlands: 7,
  kjerag: 8,
  ursus: 9,
  kazimierz: 9,
  columbia: 9,
  bolivar: 9,
  yan: 9,
  sargon: 9,
  minos: 9,
  victoria: 9,
  leithanien: 9,
  higashi: 9,
  sami: 9,
  siracusa: 9,
  laterano: 9,
  rim_billiton: 9,
  iberia: 9,
  kazdel: 9,
  siesta: 9,
};

const TARGET_HEIGHT: Record<CellType, number> = {
  void: -2.4,
  deep: -1.8,
  shallow: 0.35,
  crater: -4.8,
  land: 5.0,
  frontier: 5.9,
  bolivar: 6.4,
  iberia: 6.5,
  siesta: 6.4,
  rim_billiton: 7.4,
  minos: 7.4,
  kazimierz: 7.9,
  sargon: 8.2,
  columbia: 8.4,
  laterano: 8.4,
  kazdel: 8.5,
  siracusa: 8.5,
  higashi: 8.6,
  victoria: 9.2,
  leithanien: 10.0,
  yan: 9.6,
  ursus: 10.6,
  sami: 11.2,
  icefield: 13.0,
  foehn_hotlands: 14.2,
  kjerag: 20.5,
};

export function findNearestHexCell(px: number, py: number): HexCell | null {
  const approxRow = Math.round((py - HEX_META.y0) / HEX_META.rowPitch);
  let bestCell: HexCell | null = null;
  let bestDistSq = (HEX_RADIUS * 1.18) ** 2;

  for (let dr = -1; dr <= 1; dr++) {
    const r = approxRow + dr;
    if (r < 0) continue;
    const shiftX = r % 2 === 1 ? HEX_META.pitch * 0.5 : 0;
    const approxCol = Math.round((px - HEX_META.x0 - shiftX) / HEX_META.pitch);

    for (let dc = -1; dc <= 1; dc++) {
      const c = approxCol + dc;
      if (c < 0) continue;
      const cell = cellIndex.get(r * 1000 + c);
      if (!cell) continue;
      const dx = cell.x - px;
      const dy = (cell.y - py) / HEX_V_STRETCH;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestCell = cell;
      }
    }
  }
  return bestCell;
}

// Deterministic multi-octave FBM mountain relief noise (zero randomness between renders)
function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbmRidge(x: number, y: number): number {
  let sum = 0;
  let amp = 0.55;
  let freq = 1.0;
  for (let i = 0; i < 4; i++) {
    const n = valueNoise(x * freq, y * freq);
    const r = 1.0 - Math.abs(n * 2.0 - 1.0);
    sum += r * r * amp;
    freq *= 2.05;
    amp *= 0.48;
  }
  return sum;
}

function gaussianBlurField(src: Float32Array, w: number, h: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const dst = new Float32Array(w * h);

  // Horizontal pass [0.22, 0.56, 0.22]
  for (let y = 0; y < h; y++) {
    const rowOff = y * w;
    for (let x = 0; x < w; x++) {
      const xm = x > 0 ? x - 1 : 0;
      const xp = x < w - 1 ? x + 1 : w - 1;
      tmp[rowOff + x] =
        src[rowOff + xm] * 0.22 + src[rowOff + x] * 0.56 + src[rowOff + xp] * 0.22;
    }
  }

  // Vertical pass [0.22, 0.56, 0.22]
  for (let y = 0; y < h; y++) {
    const ym = y > 0 ? y - 1 : 0;
    const yp = y < h - 1 ? y + 1 : h - 1;
    const r0 = ym * w;
    const r1 = y * w;
    const r2 = yp * w;
    for (let x = 0; x < w; x++) {
      dst[r1 + x] = tmp[r0 + x] * 0.22 + tmp[r1 + x] * 0.56 + tmp[r2 + x] * 0.22;
    }
  }

  return dst;
}

export interface TerraTerrainAssets {
  hexCellTex: THREE.DataTexture;
  terrainMaskTex: THREE.DataTexture;
  paletteTex: THREE.DataTexture;
  paletteData: Uint8Array;
  terrainGeo: THREE.PlaneGeometry;
  borderPositions: Float32Array;
  regionBorderData: Map<string, { positions: Float32Array; defaultColor: THREE.Color }>;
  sampleHeightAtPixel: (px: number, py: number) => number;
  sampleHeightAtWorld: (wx: number, wz: number) => number;
  dispose: () => void;
}

export function buildTerraTerrainAssets(): TerraTerrainAssets {
  const total = GRID_W * GRID_H;
  const rawHeights = new Float32Array(total);
  const rawLand = new Float32Array(total);
  const terrainMaskBytes = new Uint8Array(total * 4);
  const rawBiomes = new Uint8Array(total);

  for (let ty = 0; ty < GRID_H; ty++) {
    const py = ((ty + 0.5) / GRID_H) * MAP_H;
    for (let tx = 0; tx < GRID_W; tx++) {
      const px = ((tx + 0.5) / GRID_W) * MAP_W;
      const idx = ty * GRID_W + tx;
      const cell = findNearestHexCell(px, py);

      if (!cell) {
        rawHeights[idx] = -2.2;
        rawLand[idx] = 0;
        rawBiomes[idx] = 0;
        continue;
      }

      const bCode = BIOME_CODE[cell.type] ?? 4;
      const isWater = bCode <= 3;
      rawHeights[idx] = TARGET_HEIGHT[cell.type] ?? 5.0;
      rawLand[idx] = isWater ? 0.0 : 1.0;
      rawBiomes[idx] = bCode;
    }
  }

  // Smooth raw heightfield & land mask in 3 separable Gaussian passes
  let smoothHeights: Float32Array = rawHeights;
  let smoothLand: Float32Array = rawLand;
  for (let p = 0; p < 3; p++) {
    smoothHeights = gaussianBlurField(smoothHeights, GRID_W, GRID_H);
    smoothLand = gaussianBlurField(smoothLand, GRID_W, GRID_H);
  }

  // Sculpt realistic mountain ridges (Karlan, Ursus Urals, Yan Sui, Foehn, Infy cliffs)
  for (let ty = 0; ty < GRID_H; ty++) {
    const py = ((ty + 0.5) / GRID_H) * MAP_H;
    for (let tx = 0; tx < GRID_W; tx++) {
      const px = ((tx + 0.5) / GRID_W) * MAP_W;
      const idx = ty * GRID_W + tx;

      const landW = smoothLand[idx];
      const shoreBand = Math.max(0, 1.0 - Math.abs(landW - 0.5) * 3.2);
      terrainMaskBytes[idx * 4 + 0] = Math.round(Math.min(1, Math.max(0, landW)) * 255);
      terrainMaskBytes[idx * 4 + 1] = Math.round(Math.min(1, Math.max(0, shoreBand)) * 255);
      terrainMaskBytes[idx * 4 + 2] = 0;
      terrainMaskBytes[idx * 4 + 3] = 255;

      const ridge = fbmRidge(px * 0.022 + 3.1, py * 0.022 - 1.7);
      const distKjerag = Math.hypot(px - 318, py - 510);
      const distUrsusSpine = Math.hypot(px - 458, py - 392);
      const distYanWest = Math.hypot(px - 592, py - 448);
      const distFoehnCore = Math.hypot(px - 225, py - 744);
      const distCrater = Math.hypot(px - 320, py - 138);

      let sculpted = smoothHeights[idx];

      if (landW > 0.25) {
        const landStrength = Math.min(1, (landW - 0.25) / 0.55);
        sculpted += (ridge - 0.36) * 5.2 * landStrength;

        // Mount Karlan alpine spire
        if (distKjerag < 36) {
          const spire = Math.pow(1 - distKjerag / 36, 1.8) * 11.5;
          sculpted += spire + ridge * 3.0;
        }
        // Ursus central spine
        if (distUrsusSpine < 88) {
          sculpted += Math.pow(1 - distUrsusSpine / 88, 1.5) * 3.4;
        }
        // Yan Sui peaks
        if (distYanWest < 70) {
          sculpted += Math.pow(1 - distYanWest / 70, 1.5) * 3.2;
        }
        // Foehn volcanic massif
        if (distFoehnCore < 92) {
          sculpted += Math.sin(distFoehnCore * 0.14) * 1.4 + ridge * 2.2;
        }
      }

      // Preserve deep sunken crater caldera for Northern ??? Anomaly
      if (rawBiomes[idx] === 3 || distCrater < 58) {
        const rimFactor = Math.max(0, 1 - Math.abs(distCrater - 58) / 14);
        sculpted += rimFactor * 2.6;
        if (distCrater < 46) {
          const pitDepth = Math.pow(1 - distCrater / 46, 1.35) * 5.6;
          sculpted = Math.min(sculpted, -1.8 - pitDepth);
        }
      }

      smoothHeights[idx] = sculpted;
    }
  }

  const sampleHeightAtPixel = (px: number, py: number): number => {
    const gx = Math.min(GRID_W - 1.001, Math.max(0, (px / MAP_W) * GRID_W - 0.5));
    const gy = Math.min(GRID_H - 1.001, Math.max(0, (py / MAP_H) * GRID_H - 0.5));
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;

    const h00 = smoothHeights[y0 * GRID_W + x0];
    const h10 = smoothHeights[y0 * GRID_W + Math.min(GRID_W - 1, x0 + 1)];
    const h01 = smoothHeights[Math.min(GRID_H - 1, y0 + 1) * GRID_W + x0];
    const h11 = smoothHeights[Math.min(GRID_H - 1, y0 + 1) * GRID_W + Math.min(GRID_W - 1, x0 + 1)];

    return (
      h00 * (1 - fx) * (1 - fy) +
      h10 * fx * (1 - fy) +
      h01 * (1 - fx) * fy +
      h11 * fx * fy
    );
  };

  const sampleHeightAtWorld = (wx: number, wz: number): number =>
    sampleHeightAtPixel(wx + MAP_CENTER_X, wz + MAP_CENTER_Y);

  // Exact Hex Cell Lookup DataTexture (128 x 128 NearestFilter, col=X / row=Y -> zero stair-stepping)
  const hexCellBytes = new Uint8Array(128 * 128 * 4);
  terraHexCells.forEach((cell) => {
    if (cell.row < 0 || cell.row >= 128 || cell.col < 0 || cell.col >= 128) return;
    const bCode = BIOME_CODE[cell.type] ?? 4;
    const isWater = bCode <= 3;
    const off = (cell.row * 128 + cell.col) * 4;
    hexCellBytes[off + 0] = getRegionPaletteIndex(cell.regionId);
    hexCellBytes[off + 1] = bCode;
    hexCellBytes[off + 2] = isWater ? 0 : 255;
    hexCellBytes[off + 3] = 255;
  });
  const hexCellTex = new THREE.DataTexture(
    hexCellBytes,
    128,
    128,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  hexCellTex.minFilter = THREE.NearestFilter;
  hexCellTex.magFilter = THREE.NearestFilter;
  hexCellTex.flipY = false;
  hexCellTex.generateMipmaps = false;
  hexCellTex.needsUpdate = true;

  // Smooth Coastline & Shoreline DataTexture (LinearFilter for smooth organic land gradient)
  const terrainMaskTex = new THREE.DataTexture(
    terrainMaskBytes,
    GRID_W,
    GRID_H,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  terrainMaskTex.minFilter = THREE.LinearFilter;
  terrainMaskTex.magFilter = THREE.LinearFilter;
  terrainMaskTex.flipY = false;
  terrainMaskTex.generateMipmaps = false;
  terrainMaskTex.needsUpdate = true;

  // Region Palette DataTexture (32 x 1 RGBA sRGB bytes: RGB = faction color, A = Era active mask weight 0..255)
  const paletteData = new Uint8Array(32 * 4);
  for (let i = 0; i < 32; i++) {
    const hex = (REGION_PALETTE_HEX[i] || '#262b36').replace('#', '');
    paletteData[i * 4 + 0] = parseInt(hex.slice(0, 2), 16) || 38;
    paletteData[i * 4 + 1] = parseInt(hex.slice(2, 4), 16) || 43;
    paletteData[i * 4 + 2] = parseInt(hex.slice(4, 6), 16) || 54;
    paletteData[i * 4 + 3] = 255;
  }
  const paletteTex = new THREE.DataTexture(
    paletteData,
    32,
    1,
    THREE.RGBAFormat,
    THREE.UnsignedByteType
  );
  paletteTex.minFilter = THREE.NearestFilter;
  paletteTex.magFilter = THREE.NearestFilter;
  paletteTex.flipY = false;
  paletteTex.generateMipmaps = false;
  paletteTex.needsUpdate = true;

  // High-resolution continuous sculpted continental relief geometry
  const terrainGeo = new THREE.PlaneGeometry(MAP_W, MAP_H, 224, 280);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const h = sampleHeightAtWorld(vx, vz);
    posAttr.setY(i, h);
  }
  posAttr.needsUpdate = true;
  terrainGeo.computeVertexNormals();

  // Build draped perimeter border segments using exact Terra hex neighbor boundaries
  const r = HEX_RADIUS * 1.005;
  const regionBordersMap = new Map<string, number[]>();
  const allBorderCoords: number[] = [];

  terraHexCells.forEach((cell) => {
    if (!cell.regionId) return;
    let list = regionBordersMap.get(cell.regionId);
    if (!list) {
      list = [];
      regionBordersMap.set(cell.regionId, list);
    }

    const nKeys = neighborKeys(cell.row, cell.col);
    const cx = cell.x - MAP_CENTER_X;
    const cz = cell.y - MAP_CENTER_Y;

    for (let i = 0; i < 6; i++) {
      const nc = cellIndex.get(nKeys[i]);
      if (!nc || nc.regionId !== cell.regionId) {
        const rad1 = ((60 * i - 30) * Math.PI) / 180;
        const rad2 = ((60 * ((i + 1) % 6) - 30) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(rad1);
        const z1 = cz + r * HEX_V_STRETCH * Math.sin(rad1);
        const x2 = cx + r * Math.cos(rad2);
        const z2 = cz + r * HEX_V_STRETCH * Math.sin(rad2);
        const y1 = Math.max(0.8, sampleHeightAtWorld(x1, z1)) + 0.36;
        const y2 = Math.max(0.8, sampleHeightAtWorld(x2, z2)) + 0.36;

        list.push(x1, y1, z1, x2, y2, z2);
        allBorderCoords.push(x1, y1, z1, x2, y2, z2);
      }
    }
  });

  const regionBorderData = new Map<string, { positions: Float32Array; defaultColor: THREE.Color }>();
  regionBordersMap.forEach((coords, regionId) => {
    const reg = terraRegions.find((rg) => rg.id === regionId);
    const defCol = new THREE.Color(reg?.badgeColor || '#7084a4').lerp(
      new THREE.Color('#cbd5e1'),
      0.32
    );
    regionBorderData.set(regionId, {
      positions: new Float32Array(coords),
      defaultColor: defCol,
    });
  });

  return {
    hexCellTex,
    terrainMaskTex,
    paletteTex,
    paletteData,
    terrainGeo,
    borderPositions: new Float32Array(allBorderCoords),
    regionBorderData,
    sampleHeightAtPixel,
    sampleHeightAtWorld,
    dispose: () => {
      hexCellTex.dispose();
      terrainMaskTex.dispose();
      paletteTex.dispose();
      terrainGeo.dispose();
    },
  };
}

export function createTerrainShaderMaterial(assets: TerraTerrainAssets): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uHexCellTex: { value: assets.hexCellTex },
      uTerrainMaskTex: { value: assets.terrainMaskTex },
      uPaletteTex: { value: assets.paletteTex },
      uTime: { value: 0 },
      uElevScale: { value: 1.0 },
      uLensMode: { value: 0.0 }, // 0=relief, 1=chronicle, 2=blueprint
      uGridOpacity: { value: 0.24 },
      uHoveredRegionIdx: { value: 0 },
      uPinnedRegionIdx: { value: 0 },
      uScanOrigin: { value: new THREE.Vector2(0, 0) },
      uScanProgress: { value: 1.0 },
      uHexPitch: { value: HEX_PITCH },
      uHexRowPitch: { value: HEX_ROW_PITCH },
      uHexX0: { value: HEX_META.x0 },
      uHexY0: { value: HEX_META.y0 },
      uHexVStretch: { value: HEX_V_STRETCH },
      uSunDir: { value: new THREE.Vector3(0.56, 0.72, 0.42).normalize() },
    },
    vertexShader: `
      uniform float uElevScale;
      varying vec3 vWorldPos;
      varying vec3 vScaledNormal;
      varying float vBaseElev;

      void main() {
        vBaseElev = position.y;
        vec3 displaced = position;
        displaced.y *= uElevScale;
        vScaledNormal = normalize(vec3(
          normal.x * max(0.08, uElevScale),
          max(0.18, normal.y),
          normal.z * max(0.08, uElevScale)
        ));
        vec4 wp = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform sampler2D uHexCellTex;
      uniform sampler2D uTerrainMaskTex;
      uniform sampler2D uPaletteTex;
      uniform float uTime;
      uniform float uElevScale;
      uniform float uLensMode;
      uniform float uGridOpacity;
      uniform float uHoveredRegionIdx;
      uniform float uPinnedRegionIdx;
      uniform vec2 uScanOrigin;
      uniform float uScanProgress;
      uniform float uHexPitch;
      uniform float uHexRowPitch;
      uniform float uHexX0;
      uniform float uHexY0;
      uniform float uHexVStretch;
      uniform vec3 uSunDir;

      varying vec3 vWorldPos;
      varying vec3 vScaledNormal;
      varying float vBaseElev;

      // Exact Terra 3.0 odd-r pointy-top hex lattice: returns (edgeDist, cellCol, cellRow)
      vec3 hexLatticeInfo(vec2 px) {
        vec2 origin = vec2(uHexX0, uHexY0);
        vec2 rel = px - origin;
        vec2 cellSize = vec2(uHexPitch, 2.0 * uHexRowPitch);

        vec2 idxA = floor(rel / cellSize + 0.5);
        vec2 centerA = origin + idxA * cellSize;
        vec2 da = px - centerA;

        vec2 originB = origin + vec2(uHexPitch * 0.5, uHexRowPitch);
        vec2 relB = px - originB;
        vec2 idxB = floor(relB / cellSize + 0.5);
        vec2 centerB = originB + idxB * cellSize;
        vec2 db = px - centerB;

        vec2 daS = vec2(da.x, da.y / uHexVStretch);
        vec2 dbS = vec2(db.x, db.y / uHexVStretch);

        bool useA = dot(daS, daS) < dot(dbS, dbS);
        vec2 chosenD = useA ? daS : dbS;
        float cellCol = useA ? idxA.x : idxB.x;
        float cellRow = useA ? (idxA.y * 2.0) : (idxB.y * 2.0 + 1.0);

        vec2 p = abs(chosenD);
        float d = max(p.x, dot(p, vec2(0.5, 0.8660254)));
        float edgeDist = (0.5 * uHexPitch) - d;
        return vec3(edgeDist, cellCol, cellRow);
      }

      void main() {
        vec2 mapPx = vec2(vWorldPos.x + 410.5, vWorldPos.z + 512.0);
        vec2 mapUv = mapPx / vec2(821.0, 1024.0);

        vec3 hexInfo = hexLatticeInfo(mapPx);
        float dEdge = hexInfo.x;
        float cellCol = hexInfo.y;
        float cellRow = hexInfo.z;

        vec4 cellInfo = vec4(0.0);
        if (cellCol >= 0.0 && cellCol < 127.5 && cellRow >= 0.0 && cellRow < 127.5) {
          cellInfo = texture2D(uHexCellTex, (vec2(cellCol, cellRow) + 0.5) / 128.0);
        }
        float rid = floor(cellInfo.r * 255.0 + 0.5);
        float biome = floor(cellInfo.g * 255.0 + 0.5);
        float isLandHex = cellInfo.b;
        float isValidHex = cellInfo.a;

        vec4 maskInfo = texture2D(uTerrainMaskTex, mapUv);
        float landMask = maskInfo.r;
        float shoreProx = maskInfo.g;

        vec4 pal = texture2D(uPaletteTex, vec2((rid + 0.5) / 32.0, 0.5));
        vec3 factionCol = pal.rgb;
        float eraWeight = pal.a;

        // 1. Directional sculpted studio illumination + valley AO
        vec3 n = normalize(vScaledNormal);
        float ndl = clamp(dot(n, uSunDir), 0.0, 1.0);
        float fill = clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 viewVec = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(0.0, dot(n, viewVec)), 2.6);

        float valleyAO = smoothstep(-2.0, 11.5, vBaseElev);
        float lightScalar = mix(0.45 + 0.40 * fill + 0.42 * ndl, 1.0, 1.0 - uElevScale * 0.85)
          * mix(0.72, 1.05, valleyAO);

        // 2. Sculpted Biome Material Palette
        vec3 deepBed = vec3(0.028, 0.036, 0.054);
        vec3 shelfBed = vec3(0.045, 0.068, 0.095);
        vec3 slateLand = vec3(0.088, 0.096, 0.114);
        vec3 highLand = vec3(0.145, 0.158, 0.182);

        vec3 baseCol = mix(deepBed, shelfBed, smoothstep(0.0, 0.45, landMask));
        baseCol = mix(baseCol, mix(slateLand, highLand, smoothstep(4.5, 16.0, vBaseElev)), smoothstep(0.28, 0.72, landMask));

        // Alpine peaks & frost snow (Kjerag / Icefield / Sami high elevation)
        float snowMask = smoothstep(13.5, 20.5, vBaseElev) * smoothstep(0.4, 0.9, landMask);
        if (abs(biome - 6.0) < 0.5) {
          snowMask = max(snowMask, 0.62 * smoothstep(0.45, 0.85, landMask));
        }
        baseCol = mix(baseCol, vec3(0.56, 0.62, 0.70), snowMask * 0.78);

        // Foehn Hotlands volcanic fissures
        float emberGlow = 0.0;
        if (abs(biome - 7.0) < 0.5 && isLandHex > 0.5) {
          float crack = 1.0 - smoothstep(0.0, 0.28, abs(fract(vBaseElev * 0.65) - 0.5));
          emberGlow = crack * (0.55 + 0.45 * sin(uTime * 1.4 + vBaseElev)) * 0.65;
          baseCol = mix(baseCol, vec3(0.26, 0.11, 0.07), 0.55);
          baseCol += vec3(0.95, 0.34, 0.09) * emberGlow * 0.75;
        }

        // Northern Polar Anomaly (???) sunken crater core
        if (abs(biome - 3.0) < 0.5) {
          float cDist = length(vWorldPos.xz - vec2(-90.5, -374.0));
          float ringWave = 0.5 + 0.5 * sin(cDist * 0.38 - uTime * 1.6);
          vec3 abyssVoid = vec3(0.015, 0.020, 0.036);
          baseCol = abyssVoid + vec3(0.22, 0.42, 0.78) * ringWave * smoothstep(46.0, 6.0, cDist) * 0.55;
        }

        // 3. Exact Mathematical Hex Nation Territory Blend + Spotlight + Radial Scan Pulse
        bool hasPin = uPinnedRegionIdx > 0.5;
        bool isPinned = abs(rid - uPinnedRegionIdx) < 0.4 && rid > 0.5;
        bool isHovered = abs(rid - uHoveredRegionIdx) < 0.4 && rid > 0.5;
        bool isNationHex = rid > 0.5 && abs(biome - 3.0) > 0.5;

        if (uLensMode < 0.5) {
          // Lens 0: Tactile Topographical Relief
          if (isNationHex) {
            float nationBlend = hasPin ? (isPinned ? 0.68 : 0.09) : (isHovered ? 0.62 : 0.40);
            baseCol = mix(baseCol, factionCol, nationBlend);
            if (isPinned || isHovered) {
              float distToScan = length(vWorldPos.xz - uScanOrigin);
              float ringR = uScanProgress * 195.0;
              float scanFront = 1.0 - smoothstep(0.0, 14.0, abs(distToScan - ringR));
              baseCol += mix(factionCol, vec3(0.96, 0.87, 0.11), 0.55) * scanFront * (1.0 - uScanProgress) * 0.9;
            }
          }
          baseCol *= lightScalar;
          baseCol += vec3(0.18, 0.24, 0.32) * fresnel * 0.22 * smoothstep(0.4, 0.9, landMask);
        } else if (uLensMode < 1.5) {
          // Lens 1: Chronicle Playback (monochrome topography + highlighted Era sectors)
          float mono = dot(baseCol, vec3(0.299, 0.587, 0.114));
          vec3 slateTopo = vec3(mono * 0.92, mono * 0.98, mono * 1.08);
          baseCol = slateTopo * lightScalar;
          if (isNationHex) {
            float eraPulse = 0.78 + 0.22 * sin(uTime * 2.2);
            float activeBlend = eraWeight * (isPinned ? 0.82 : 0.62) * eraPulse;
            baseCol = mix(baseCol, factionCol * 1.15, activeBlend);
          }
        } else {
          // Lens 2: Blueprint Architectural Drafting
          vec3 bpDark = vec3(0.025, 0.039, 0.062);
          vec3 bpShelf = vec3(0.055, 0.092, 0.145);
          baseCol = mix(bpDark, bpShelf, smoothstep(0.25, 0.85, landMask));
          if (isNationHex) {
            float bpMix = hasPin ? (isPinned ? 0.52 : 0.08) : (isHovered ? 0.48 : 0.26);
            baseCol = mix(baseCol, factionCol, bpMix);
          }
        }

        // 4. Analytical Topographical Contour Lines (sharp 1px at all zoom distances)
        if (landMask > 0.35) {
          float minorStep = vBaseElev / 1.8;
          float fMin = abs(fract(minorStep - 0.5) - 0.5) / max(fwidth(minorStep), 0.002);
          float cMin = 1.0 - clamp(fMin, 0.0, 1.0);

          float majorStep = vBaseElev / 7.2;
          float fMaj = abs(fract(majorStep - 0.5) - 0.5) / max(fwidth(majorStep), 0.002);
          float cMaj = 1.0 - clamp(fMaj, 0.0, 1.0);

          vec3 contourCol = uLensMode > 1.5 ? vec3(0.32, 0.66, 0.88) : vec3(0.45, 0.55, 0.68);
          float cStrength = uLensMode > 1.5 ? 0.34 : 0.14;
          baseCol = mix(baseCol, contourCol, cMin * cStrength * smoothstep(0.35, 0.7, landMask));
          baseCol = mix(baseCol, contourCol * 1.25, cMaj * (cStrength * 1.7) * smoothstep(0.35, 0.7, landMask));
        }

        // 5. Crisp Shoreline Rim Accent
        float shoreContour = shoreProx * smoothstep(0.18, 0.55, landMask);
        vec3 shoreTint = uLensMode > 1.5 ? vec3(0.48, 0.82, 0.98) : vec3(0.36, 0.54, 0.68);
        baseCol = mix(baseCol, shoreTint, shoreContour * 0.26);

        // 6. Exact Official Terra 3.0 Thin Engraved Hex Grid Lattice (Zero Z-fighting!)
        if (uGridOpacity > 0.01) {
          float fw = max(fwidth(dEdge), 0.01);
          float lineAlpha = 1.0 - smoothstep(0.0, fw * 1.25 + 0.05, dEdge);
          float landGridMask = isValidHex * mix(0.32, 1.0, isLandHex);
          float emphasis = (isPinned || isHovered) ? 1.85 : (hasPin && rid > 0.5 ? 0.45 : 1.0);
          vec3 gridTint = isPinned
            ? vec3(0.96, 0.87, 0.11)
            : (uLensMode > 1.5 ? vec3(0.40, 0.74, 0.94) : vec3(0.62, 0.72, 0.84));
          baseCol = mix(baseCol, gridTint, clamp(lineAlpha * uGridOpacity * landGridMask * emphasis, 0.0, 0.75));
        }

        // 7. Horizon Fog Vignette Fade into #080a0f & Linear Output for EffectComposer OutputPass
        float distFromCenter = length(vWorldPos.xz);
        float edgeFade = smoothstep(430.0, 620.0, distFromCenter);
        vec3 bgFog = vec3(0.031, 0.039, 0.059);
        baseCol = mix(baseCol, bgFog, edgeFade);

        // Linearize sRGB surface + add selective HDR emission for UnrealBloomPass (threshold ~0.78)
        vec3 linearSurface = pow(max(baseCol, vec3(0.0)), vec3(2.2));
        vec3 hdrBoost = vec3(0.95, 0.30, 0.08) * emberGlow * 1.15;
        if (abs(biome - 3.0) < 0.5) {
          float cDist2 = length(vWorldPos.xz - vec2(-90.5, -374.0));
          float ringPulse2 = 0.5 + 0.5 * sin(cDist2 * 0.38 - uTime * 1.6);
          hdrBoost += vec3(0.28, 0.56, 1.05) * ringPulse2 * smoothstep(32.0, 5.0, cDist2) * 0.65;
        }
        gl_FragColor = vec4(linearSurface + hdrBoost * (1.0 - edgeFade), 1.0);
      }
    `,
  });
}

export function createWaterShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLensMode: { value: 0.0 },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uLensMode;
      varying vec3 vWorldPos;

      void main() {
        float r = length(vWorldPos.xz);
        float horizonFade = 1.0 - smoothstep(420.0, 650.0, r);

        float swell1 = sin(vWorldPos.x * 0.022 + uTime * 0.42) * cos(vWorldPos.z * 0.022 - uTime * 0.30);
        float swell2 = sin((vWorldPos.x - vWorldPos.z) * 0.015 + uTime * 0.24);
        vec3 deepWater = uLensMode > 1.5 ? vec3(0.020, 0.035, 0.058) : vec3(0.024, 0.036, 0.058);
        vec3 crestWater = uLensMode > 1.5 ? vec3(0.035, 0.062, 0.095) : vec3(0.044, 0.072, 0.110);
        vec3 col = mix(deepWater, crestWater, 0.46 + 0.24 * swell1 + 0.12 * swell2);

        // Cartography drafting datum grid (64u minor & 256u major)
        vec2 c1 = vWorldPos.xz / 64.0;
        vec2 g1 = abs(fract(c1 - 0.5) - 0.5) / max(fwidth(c1), vec2(0.0005));
        float l1 = 1.0 - min(min(g1.x, g1.y), 1.0);

        vec2 c2 = vWorldPos.xz / 256.0;
        vec2 g2 = abs(fract(c2 - 0.5) - 0.5) / max(fwidth(c2), vec2(0.0005));
        float l2 = 1.0 - min(min(g2.x, g2.y), 1.0);

        col = mix(col, vec3(0.14, 0.22, 0.32), l1 * 0.28 * horizonFade);
        col = mix(col, vec3(0.24, 0.35, 0.48), l2 * 0.45 * horizonFade);

        // Concentric tactical distance rings (220u, 360u, 468u)
        float ring1 = 1.0 - smoothstep(0.0, 1.2, abs(r - 220.0));
        float ring2 = 1.0 - smoothstep(0.0, 1.3, abs(r - 360.0));
        float outerRing = 1.0 - smoothstep(0.0, 1.8, abs(r - 468.0));
        col = mix(col, vec3(0.24, 0.34, 0.46), (ring1 + ring2) * 0.36 * horizonFade);
        col = mix(col, vec3(0.96, 0.87, 0.11), outerRing * 0.16 * horizonFade);

        // Soft fade out to seamless background fog
        vec3 horizonBg = vec3(0.031, 0.039, 0.059);
        col = mix(horizonBg, col, horizonFade);

        float alpha = mix(0.94, 0.66, horizonFade);
        gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(2.2)), alpha);
      }
    `,
  });
}
