import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  terraHexCells,
  cellIndex,
  neighborKeys,
  HEX_PITCH,
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
export const WATER_LEVEL = 1.95;

export type TerraMapLens = 'tactical' | 'chronicle' | 'blueprint';

export const BIOME_CODE: Record<CellType, number> = {
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

const REGION_BADGE_MAP = new Map<string, string>();
terraRegions.forEach((r) => {
  if (r.badgeColor) REGION_BADGE_MAP.set(r.id, r.badgeColor);
});

const ANODIZED_HEX_CACHE = new Map<string, string>();
const _tmpSlate = new THREE.Color('#1e2430');
const _tmpBadge = new THREE.Color();

function getAnodizedRegionHex(regionId: string | null): string {
  if (!regionId) return '#212630';
  const cached = ANODIZED_HEX_CACHE.get(regionId);
  if (cached) return cached;

  const badge = REGION_BADGE_MAP.get(regionId) || '#4b5563';
  _tmpBadge.set(badge);
  // Subtle cool titanium slate blend (~15%) for precision anodized finish
  _tmpBadge.lerp(_tmpSlate, 0.15);
  const out = `#${_tmpBadge.getHexString()}`;
  ANODIZED_HEX_CACHE.set(regionId, out);
  return out;
}

export function getBaseTileColorHex(cell: HexCell): string {
  switch (cell.type) {
    case 'void':
    case 'deep':
      return '#0c131d';
    case 'shallow':
      return '#122030';
    case 'crater':
      return '#0c1220';
    case 'land':
      return '#212630';
    case 'frontier':
      return '#29303c';
    case 'icefield':
      return '#cfd8e3';
    case 'foehn_hotlands':
      return '#251c1a';
    default:
      return getAnodizedRegionHex(cell.regionId);
  }
}

export function isWaterCellType(type: CellType): boolean {
  return type === 'void' || type === 'deep' || type === 'shallow' || type === 'crater';
}

function quantizeStep(val: number, step = 0.75): number {
  return Math.round(val / step) * step;
}

function tagPartKind(geo: THREE.BufferGeometry, kind: number): void {
  const count = geo.attributes.position.count;
  const arr = new Float32Array(count);
  arr.fill(kind);
  geo.setAttribute('aPartKind', new THREE.BufferAttribute(arr, 1));
}

/**
 * Top-anchored precision 2-tier machined hex monolith (top crown at y = 0).
 * Translation in Y keeps the 45-degree chamfer bevel physically constant across elevations.
 */
export function buildMachinedHexGeometry(): THREE.BufferGeometry {
  const shaft = new THREE.CylinderGeometry(
    HEX_RADIUS * 0.945,
    HEX_RADIUS * 0.958,
    27.48,
    6,
    1,
    true
  ).toNonIndexed();
  shaft.translate(0, -0.52 - 13.74, 0);
  tagPartKind(shaft, 0);

  const bevel = new THREE.CylinderGeometry(
    HEX_RADIUS * 0.855,
    HEX_RADIUS * 0.945,
    0.505,
    6,
    1,
    true
  ).toNonIndexed();
  bevel.translate(0, -0.015 - 0.2525, 0);
  tagPartKind(bevel, 1);

  const topDeck = new THREE.CylinderGeometry(
    HEX_RADIUS * 0.855,
    HEX_RADIUS * 0.855,
    0.015,
    6,
    1,
    false
  ).toNonIndexed();
  topDeck.translate(0, -0.0075, 0);
  tagPartKind(topDeck, 2);

  const merged = mergeGeometries([shaft, bevel, topDeck], false);
  shaft.dispose();
  bevel.dispose();
  topDeck.dispose();

  if (!merged) {
    throw new Error('Failed to merge machined hex monolith geometry');
  }

  merged.scale(1, 1, HEX_V_STRETCH);

  const posAttr = merged.attributes.position;
  const localXZ = new Float32Array(posAttr.count * 2);
  for (let i = 0; i < posAttr.count; i++) {
    localXZ[i * 2 + 0] = posAttr.getX(i);
    localXZ[i * 2 + 1] = posAttr.getZ(i) / HEX_V_STRETCH;
  }
  merged.setAttribute('aLocalXZ', new THREE.BufferAttribute(localXZ, 2));
  merged.computeVertexNormals();
  return merged;
}

const REGION_STEP_HEIGHT: Record<string, number> = {
  bolivar: 4.3,
  iberia: 4.3,
  siesta: 5.05,
  victoria: 5.8,
  columbia: 5.8,
  kazimierz: 5.8,
  rim_billiton: 5.8,
  minos: 5.8,
  sargon: 5.8,
  siracusa: 5.8,
  laterano: 6.55,
  kazdel: 5.8,
  higashi: 5.8,
  leithanien: 7.3,
  yan: 7.3,
  ursus: 7.3,
  sami: 8.05,
  foehn_hotlands: 7.3,
  infy_icefield: 8.8,
  kjerag: 8.8,
};

const REGION_CENTROID_MAP = new Map<string, { x: number; y: number }>();
terraRegions.forEach((r) => {
  REGION_CENTROID_MAP.set(r.id, r.emblemPixelCoords);
});

export interface TerraHexAssets {
  hexGeo: THREE.BufferGeometry;
  baseHeights: Float32Array;
  bootDelays: Float32Array;
  regionRadialDelays: Float32Array;
  baseColors: Float32Array;
  biomeCodes: Float32Array;
  regionMaxRadii: Map<string, number>;
  regionBordersData: Map<string, { positions: Float32Array; defaultColor: THREE.Color }>;
  findClosestHexIndex: (px: number, py: number) => number;
  dispose: () => void;
}

export function buildTerraHexAssets(): TerraHexAssets {
  const hexGeo = buildMachinedHexGeometry();
  const count = terraHexCells.length;

  const baseHeights = new Float32Array(count);
  const bootDelays = new Float32Array(count);
  const regionRadialDelays = new Float32Array(count);
  const baseColors = new Float32Array(count * 3);
  const biomeCodes = new Float32Array(count);

  // Measure each region's max radius for uniform 0..0.28s outward spring-cascade wave
  const regionMaxRadii = new Map<string, number>();
  terraHexCells.forEach((cell) => {
    if (!cell.regionId) return;
    const center = REGION_CENTROID_MAP.get(cell.regionId);
    if (!center) return;
    const d = Math.hypot(cell.x - center.x, cell.y - center.y);
    const prev = regionMaxRadii.get(cell.regionId) ?? 1;
    if (d > prev) regionMaxRadii.set(cell.regionId, d);
  });

  const cTmp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const cell = terraHexCells[i];
    const bCode = BIOME_CODE[cell.type] ?? 4;
    biomeCodes[i] = bCode;

    // Color in working Linear-sRGB space for MeshStandardMaterial
    cTmp.set(getBaseTileColorHex(cell));
    baseColors[i * 3 + 0] = cTmp.r;
    baseColors[i * 3 + 1] = cTmp.g;
    baseColors[i * 3 + 2] = cTmp.b;

    // Boot-up cascade delay emanating from Rhodes Island flagship (~585, 580)
    const distFromRhodes = Math.hypot(cell.x - 585, cell.y - 580);
    bootDelays[i] = Math.min(1.1, (distFromRhodes / 740) * 1.1);

    // Region hover/select radial wave delay (0..0.28s)
    if (cell.regionId) {
      const center = REGION_CENTROID_MAP.get(cell.regionId);
      const maxR = Math.max(12, regionMaxRadii.get(cell.regionId) ?? 40);
      regionRadialDelays[i] = center
        ? Math.min(0.28, (Math.hypot(cell.x - center.x, cell.y - center.y) / maxR) * 0.28)
        : 0;
    }

    // Count neighbor water & same-region cells for crisp architectural stepped terracing
    const nKeys = neighborKeys(cell.row, cell.col);
    let waterNeighbors = 0;
    let sameNeighbors = 0;
    for (let k = 0; k < 6; k++) {
      const nc = cellIndex.get(nKeys[k]);
      if (!nc || isWaterCellType(nc.type)) {
        waterNeighbors++;
      }
      if (nc && nc.regionId === cell.regionId && nc.type === cell.type) {
        sameNeighbors++;
      }
    }

    if (cell.type === 'void' || cell.type === 'deep') {
      baseHeights[i] = -1.8;
    } else if (cell.type === 'shallow') {
      baseHeights[i] = 0.35;
    } else if (cell.type === 'crater') {
      const dCrater = Math.hypot(cell.x - 320, cell.y - 138);
      baseHeights[i] = dCrater < 30 ? -1.4 : dCrater < 50 ? 0.2 : 1.1;
    } else if (cell.type === 'land') {
      baseHeights[i] = waterNeighbors > 0 ? 2.8 : sameNeighbors === 6 ? 3.55 : 2.8;
    } else if (cell.type === 'frontier') {
      baseHeights[i] = waterNeighbors > 0 ? 2.8 : 3.55;
    } else if (cell.type === 'kjerag') {
      // 3-tier stepped Alpine citadel centered on Mount Karlan (318, 510)
      const dKarlan = Math.hypot(cell.x - 318, cell.y - 510);
      if (dKarlan < 15) baseHeights[i] = 14.65;
      else if (dKarlan < 28) baseHeights[i] = 11.65;
      else baseHeights[i] = 8.65;
    } else if (cell.type === 'icefield') {
      const tier = waterNeighbors > 0 ? 7.9 : sameNeighbors === 6 ? 10.9 : 9.4;
      const deepIce = cell.y < 230 && waterNeighbors === 0 ? 0.75 : 0;
      baseHeights[i] = tier + deepIce;
    } else if (cell.type === 'foehn_hotlands') {
      const dFoehn = Math.hypot(cell.x - 225, cell.y - 744);
      if (dFoehn < 38 && waterNeighbors === 0) baseHeights[i] = 10.15;
      else if (waterNeighbors > 0) baseHeights[i] = 7.15;
      else baseHeights[i] = 8.65;
    } else {
      const rid = cell.regionId || '';
      let h = REGION_STEP_HEIGHT[rid] ?? 5.8;

      if (waterNeighbors > 0) {
        h = Math.max(4.3, h - 0.75);
      } else {
        const regCenter = REGION_CENTROID_MAP.get(rid);
        if (sameNeighbors === 6 && regCenter && Math.hypot(cell.x - regCenter.x, cell.y - regCenter.y) < 36) {
          h += 0.75;
        }
        // Ursus & Yan regional stepped highland ridges
        if (rid === 'ursus' && Math.hypot(cell.x - 458, cell.y - 392) < 62) {
          h += 1.5;
        } else if (rid === 'yan' && Math.hypot(cell.x - 592, cell.y - 448) < 52) {
          h += 1.5;
        }
      }
      baseHeights[i] = quantizeStep(h, 0.75) + 0.05;
    }
  }

  // Exact nation outer perimeters stretched identically with HEX_V_STRETCH
  const r = HEX_RADIUS * 1.002;
  const regionBordersMap = new Map<string, number[]>();

  terraHexCells.forEach((cell, idx) => {
    if (!cell.regionId) return;
    let list = regionBordersMap.get(cell.regionId);
    if (!list) {
      list = [];
      regionBordersMap.set(cell.regionId, list);
    }

    const nKeys = neighborKeys(cell.row, cell.col);
    const cx = cell.x - MAP_CENTER_X;
    const cz = cell.y - MAP_CENTER_Y;
    const borderY = Math.max(WATER_LEVEL + 0.16, baseHeights[idx] + 0.14);

    for (let edge = 0; edge < 6; edge++) {
      const nc = cellIndex.get(nKeys[edge]);
      if (!nc || nc.regionId !== cell.regionId) {
        const rad1 = ((60 * edge - 30) * Math.PI) / 180;
        const rad2 = ((60 * ((edge + 1) % 6) - 30) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(rad1);
        const z1 = cz + r * HEX_V_STRETCH * Math.sin(rad1);
        const x2 = cx + r * Math.cos(rad2);
        const z2 = cz + r * HEX_V_STRETCH * Math.sin(rad2);
        list.push(x1, borderY, z1, x2, borderY, z2);
      }
    }
  });

  const regionBordersData = new Map<string, { positions: Float32Array; defaultColor: THREE.Color }>();
  regionBordersMap.forEach((coords, regionId) => {
    const reg = terraRegions.find((rg) => rg.id === regionId);
    const defCol = new THREE.Color(reg?.badgeColor || '#7084a4').lerp(
      new THREE.Color('#cbd5e1'),
      0.34
    );
    regionBordersData.set(regionId, {
      positions: new Float32Array(coords),
      defaultColor: defCol,
    });
  });

  const findClosestHexIndex = (px: number, py: number): number => {
    let bestIdx = 0;
    let bestDistSq = Infinity;
    for (let i = 0; i < count; i++) {
      const c = terraHexCells[i];
      const dx = c.x - px;
      const dy = (c.y - py) / HEX_V_STRETCH;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  return {
    hexGeo,
    baseHeights,
    bootDelays,
    regionRadialDelays,
    baseColors,
    biomeCodes,
    regionMaxRadii,
    regionBordersData,
    findClosestHexIndex,
    dispose: () => {
      hexGeo.dispose();
    },
  };
}

export interface MachinedHexUniforms {
  uTime: { value: number };
  uBlueprintMix: { value: number };
  uShowEngraving: { value: number };
}

/**
 * Anodized metallic PBR material with custom onBeforeCompile injection:
 * - Precision CNC inner hex groove + brushed top deck
 * - 45-degree specular chamfer rim highlight
 * - Architectural shaft AO + subtle horizontal strata ticks
 * - Trench illumination + Foehn molten seams + Polar pulse
 */
export function createMachinedHexMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.48,
    roughness: 0.36,
    envMapIntensity: 1.35,
  });

  const shaderUniforms: MachinedHexUniforms = {
    uTime: { value: 0 },
    uBlueprintMix: { value: 0 },
    uShowEngraving: { value: 1 },
  };
  mat.userData.shaderUniforms = shaderUniforms;
  mat.customProgramCacheKey = () => 'prts-machined-hex-v1';

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shaderUniforms.uTime;
    shader.uniforms.uBlueprintMix = shaderUniforms.uBlueprintMix;
    shader.uniforms.uShowEngraving = shaderUniforms.uShowEngraving;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aPartKind;
attribute vec2 aLocalXZ;
attribute vec3 aTileBaseColor;
attribute vec4 aTileState;
varying float vPartKind;
varying vec2 vLocalXZ;
varying float vLocalPosY;
varying vec3 vWorldPos;
varying vec3 vTileBaseColor;
varying vec4 vTileState;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vPartKind = aPartKind;
vLocalXZ = aLocalXZ;
vTileBaseColor = aTileBaseColor;
vTileState = aTileState;
vec4 prts_wpLocal = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  if (position.y < -10.0) {
    transformed.y = max(position.y, -3.4 - instanceMatrix[3][1]);
    prts_wpLocal.y = transformed.y;
  }
  prts_wpLocal = instanceMatrix * prts_wpLocal;
#endif
vLocalPosY = transformed.y;
vWorldPos = (modelMatrix * prts_wpLocal).xyz;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uTime;
uniform float uBlueprintMix;
uniform float uShowEngraving;
varying float vPartKind;
varying vec2 vLocalXZ;
varying float vLocalPosY;
varying vec3 vWorldPos;
varying vec3 vTileBaseColor;
varying vec4 vTileState;`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float prts_focus = vTileState.x;
float prts_dim = vTileState.y;
float prts_biome = vTileState.z;

vec2 prts_lp = abs(vLocalXZ);
float prts_hDist = max(prts_lp.x, dot(prts_lp, vec2(0.5, 0.8660254))) / ${(0.5 * HEX_PITCH * 0.855).toFixed(4)};
float prts_groove = 1.0 - smoothstep(0.0, max(fwidth(prts_hDist) * 1.35, 0.025), abs(prts_hDist - 0.78));

vec3 prts_col = vTileBaseColor;
// Spotlight dim in Linear-sRGB toward dark gunmetal slate
prts_col = mix(prts_col, vec3(0.008, 0.011, 0.016), prts_dim * 0.78);

// Blueprint dark slate transition
vec3 prts_bpCol = mix(vec3(0.004, 0.008, 0.018), vTileBaseColor * 0.36, 1.0 - prts_dim * 0.65);
prts_col = mix(prts_col, prts_bpCol, uBlueprintMix);

if (vPartKind > 1.5) {
  // Precision Top Deck: CNC laser inner hex groove + subtle brushed satin sheen
  prts_col *= 1.0 - prts_groove * 0.24 * uShowEngraving;
  float prts_brush = sin(vLocalXZ.x * 18.0 + vLocalXZ.y * 9.0) * 0.012;
  prts_col *= 1.0 + prts_brush;
  // Kjerag alpine peak silver anodized crown highlight
  if (abs(prts_biome - 8.0) < 0.5 && vWorldPos.y > 11.2) {
    prts_col = mix(prts_col, vec3(0.42, 0.48, 0.58), 0.38 * (1.0 - uBlueprintMix));
  }
} else if (vPartKind > 0.5) {
  // 45-degree Machined Chamfer Bevel
  vec3 prts_chamfer = mix(prts_col * 1.32, vec3(0.90, 0.68, 0.02), prts_focus * 0.42);
  vec3 prts_bpChamfer = vec3(0.05, 0.40, 0.82);
  prts_col = mix(prts_chamfer, prts_bpChamfer, uBlueprintMix);
} else {
  // Vertical Side Shaft: architectural depth AO + CNC horizontal strata ticks
  float prts_depth = clamp(-vLocalPosY / 11.0, 0.0, 1.0);
  prts_col *= mix(0.84, 0.26, prts_depth);
  float prts_strata = 1.0 - smoothstep(0.0, 0.12, abs(fract(vWorldPos.y * 0.8) - 0.5));
  prts_col *= 1.0 - prts_strata * 0.10 * uShowEngraving;
}

diffuseColor.rgb *= prts_col;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
if (vPartKind > 0.5 && vPartKind < 1.5) {
  roughnessFactor = 0.18;
} else if (vPartKind > 1.5) {
  roughnessFactor = abs(prts_biome - 6.0) < 0.5 ? 0.22 : mix(0.36, 0.24, prts_focus);
} else {
  roughnessFactor = 0.48;
}
roughnessFactor = mix(roughnessFactor, 0.26, uBlueprintMix * 0.45);`
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `#include <metalnessmap_fragment>
if (vPartKind > 0.5 && vPartKind < 1.5) {
  metalnessFactor = 0.82;
} else if (vPartKind > 1.5) {
  metalnessFactor = abs(prts_biome - 6.0) < 0.5 ? 0.28 : 0.46;
} else {
  metalnessFactor = 0.58;
}`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
vec3 prts_emit = vec3(0.0);

// 1. Optical Trench Backlight along raised nation shafts near water/table datum
if (vPartKind < 0.5 && prts_focus > 0.02) {
  float prts_trenchBand = exp(-abs(vWorldPos.y - 2.35) * 0.75);
  prts_emit += mix(vTileBaseColor * 2.4, vec3(0.92, 0.70, 0.02), 0.55) * prts_trenchBand * prts_focus * 0.52;
}

// 2. Pinned Chamfer Optical Catchlight
if (vPartKind > 0.5 && vPartKind < 1.5 && prts_focus > 0.75) {
  prts_emit += vec3(0.92, 0.70, 0.02) * ((prts_focus - 0.75) / 0.25) * 0.55;
}

// 3. Foehn Hotlands Volcanic Basalt Molten Seams (strictly confined to hex groove & bevel)
if (abs(prts_biome - 7.0) < 0.5) {
  float prts_seamMask = (vPartKind > 1.5) ? prts_groove * uShowEngraving : (vPartKind > 0.5 ? 0.52 : 0.0);
  float prts_seamPulse = 0.65 + 0.35 * sin(uTime * 1.6 + vWorldPos.x * 0.04);
  prts_emit += vec3(1.18, 0.34, 0.06) * prts_seamMask * prts_seamPulse * (1.0 - prts_dim * 0.65);
}

// 4. Northern Polar Crater Concentric Ice-Cyan Pulse
if (abs(prts_biome - 3.0) < 0.5) {
  float prts_cDist = length(vWorldPos.xz - vec2(-90.5, -374.0));
  float prts_pulse = max(0.0, sin(prts_cDist * 0.42 - uTime * 1.8));
  float prts_ringMask = (vPartKind > 0.5 && vPartKind < 1.5) ? 0.82 : (vPartKind > 1.5 ? prts_groove : 0.14);
  prts_emit += vec3(0.18, 0.58, 1.05) * prts_pulse * smoothstep(52.0, 6.0, prts_cDist) * prts_ringMask;
}

// 5. Blueprint Mode Cyan Chamfer Edge
if (vPartKind > 0.5 && vPartKind < 1.5 && uBlueprintMix > 0.01) {
  prts_emit += vec3(0.10, 0.46, 0.86) * uBlueprintMix * (1.0 - prts_dim * 0.5) * 0.45;
}

totalEmissiveRadiance += prts_emit;`
      );
  };

  return mat;
}

/**
 * Smoked-glass tactical ocean plane revealing submerged coastal bathymetry hex tiles,
 * crisp 64u/256u drafting coordinates, tactical range rings, and a subtle optical sweep.
 */
export function createWarTableWaterMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBlueprintMix: { value: 0.0 },
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
      uniform float uBlueprintMix;
      varying vec3 vWorldPos;

      void main() {
        float r = length(vWorldPos.xz);
        float horizonFade = 1.0 - smoothstep(420.0, 650.0, r);

        float swell1 = sin(vWorldPos.x * 0.022 + uTime * 0.36) * cos(vWorldPos.z * 0.022 - uTime * 0.28);
        vec3 baseDeep = mix(vec3(0.020, 0.030, 0.048), vec3(0.018, 0.032, 0.056), uBlueprintMix);
        vec3 crestTint = mix(vec3(0.038, 0.058, 0.090), vec3(0.034, 0.064, 0.102), uBlueprintMix);
        vec3 col = mix(baseDeep, crestTint, 0.44 + 0.22 * swell1);

        // Crisp 64u / 256u War-Table coordinate grid
        vec2 c1 = vWorldPos.xz / 64.0;
        vec2 g1 = abs(fract(c1 - 0.5) - 0.5) / max(fwidth(c1), vec2(0.0005));
        float l1 = 1.0 - min(min(g1.x, g1.y), 1.0);

        vec2 c2 = vWorldPos.xz / 256.0;
        vec2 g2 = abs(fract(c2 - 0.5) - 0.5) / max(fwidth(c2), vec2(0.0005));
        float l2 = 1.0 - min(min(g2.x, g2.y), 1.0);

        col = mix(col, vec3(0.14, 0.22, 0.32), l1 * 0.28 * horizonFade);
        col = mix(col, vec3(0.24, 0.36, 0.48), l2 * 0.46 * horizonFade);

        // Tactical distance rings (220u, 360u, 475u)
        float ring1 = 1.0 - smoothstep(0.0, 1.1, abs(r - 220.0));
        float ring2 = 1.0 - smoothstep(0.0, 1.2, abs(r - 360.0));
        float ringOuter = 1.0 - smoothstep(0.0, 1.5, abs(r - 475.0));
        col = mix(col, vec3(0.26, 0.36, 0.48), (ring1 + ring2) * 0.36 * horizonFade);
        col = mix(col, vec3(0.95, 0.82, 0.12), ringOuter * 0.22 * horizonFade);

        // Ultra-subtle optical radar sweep (strictly 0.03 sheen)
        float angle = atan(vWorldPos.z, vWorldPos.x);
        float sweepAngle = mod(uTime * 0.22, 6.2831853);
        float diff = mod(sweepAngle - angle + 6.2831853, 6.2831853);
        float sweep = exp(-diff * 4.5) * smoothstep(475.0, 90.0, r) * step(40.0, r);
        col += vec3(0.18, 0.38, 0.56) * sweep * 0.032 * horizonFade;

        vec3 bgHorizon = vec3(0.028, 0.035, 0.052);
        col = mix(bgHorizon, col, horizonFade);

        // Translucent smoked glass near continent (0.60) -> opaque horizon (0.94)
        float alpha = mix(0.94, 0.60, horizonFade);
        gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(2.2)), alpha);
      }
    `,
  });
}

/**
 * Physical titanium console bezel framing Terra at r=478..502 with 5-deg minor & 45-deg major degree ticks.
 */
export function createWarTableBezelGroup(): THREE.Group {
  const group = new THREE.Group();

  const outerRingGeo = new THREE.RingGeometry(486, 502, 128);
  outerRingGeo.rotateX(-Math.PI / 2);
  const outerRingMat = new THREE.MeshStandardMaterial({
    color: 0x151922,
    metalness: 0.72,
    roughness: 0.34,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.position.y = WATER_LEVEL + 0.07;
  group.add(outerRing);

  const innerTrimGeo = new THREE.RingGeometry(477.5, 479.2, 128);
  innerTrimGeo.rotateX(-Math.PI / 2);
  const innerTrimMat = new THREE.MeshBasicMaterial({
    color: 0x384354,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const innerTrim = new THREE.Mesh(innerTrimGeo, innerTrimMat);
  innerTrim.position.y = WATER_LEVEL + 0.09;
  group.add(innerTrim);

  // Degree tick marks every 5 deg (minor) and 45 deg (major cardinal)
  const minorCoords: number[] = [];
  const majorCoords: number[] = [];
  const tickY = WATER_LEVEL + 0.11;

  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 45 === 0;
    const r0 = 478;
    const r1 = isMajor ? 491 : 484;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const target = isMajor ? majorCoords : minorCoords;
    target.push(r0 * cos, tickY, r0 * sin, r1 * cos, tickY, r1 * sin);
  }

  const minorGeo = new THREE.BufferGeometry();
  minorGeo.setAttribute('position', new THREE.Float32BufferAttribute(minorCoords, 3));
  const minorMat = new THREE.LineBasicMaterial({
    color: 0x475569,
    transparent: true,
    opacity: 0.55,
  });
  group.add(new THREE.LineSegments(minorGeo, minorMat));

  const majorGeo = new THREE.BufferGeometry();
  majorGeo.setAttribute('position', new THREE.Float32BufferAttribute(majorCoords, 3));
  const majorMat = new THREE.LineBasicMaterial({
    color: 0xf5dd1b,
    transparent: true,
    opacity: 0.65,
  });
  group.add(new THREE.LineSegments(majorGeo, majorMat));

  return group;
}
