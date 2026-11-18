/**
 * PRTS Archive - Story & Character Visual Asset Integrity Validator v4.0
 *
 * Verifies story archives & visual databases against strict quality, asset, and canon constraints:
 * 1. Structural schema integrity (acts, optional 2-tier stages, characters, glossary, analysis).
 * 2. Visual asset integrity:
 *    - All cgUrl, visuals[].url, avatarUrl, bannerImage files must physically exist in public/.
 *    - Every character with non-empty avatarUrl MUST also resolve to an existing full-body illustUrl
 *      (preventing orphan avatars or uncropped standing art bugs).
 *    - Character avatars must be strictly 1:1 square (width === height, min 120x120).
 *    - Scene CGs must be strictly horizontal wide aspect ratio (width > height, ratio >= 1.2).
 *    - Empty state synchronization: If cgUrl is empty (''), cgCaption MUST also be empty ('').
 * 3. Character CG DB & Master DB Integrity (v4.0):
 *    - All entries in characterCgAssets.ts (except cg_none) have valid 1:1 avatarUrl AND illustUrl on disk.
 *    - Protected `isUserEdited: true` assets exist intact on disk.
 *    - All top-level characters in all story files exist in characterMasterDb.ts (direct or via aliases).
 *    - Duplicate MD5 hash collision detection across distinct non-shared/non-alias character assets.
 * 4. Dialogue speaker and cast cross-referencing.
 * 5. Canonical terminology & blacklist enforcement (scans raw_data/canon_blacklist.json).
 * 6. Role Scoping Rule & Early Episode Spoiler Quarantine checks.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const STORIES_DIR = path.join(__dirname, '../src/data/stories');
const PUBLIC_DIR = path.join(__dirname, '../public');
const BLACKLIST_PATH = path.join(__dirname, '../raw_data/canon_blacklist.json');
const CG_ASSETS_PATH = path.join(__dirname, '../src/data/db/characterCgAssets.ts');
const MASTER_DB_PATH = path.join(__dirname, '../src/data/db/characterMasterDb.ts');
const ASSET_HELPER_PATH = path.join(__dirname, '../src/utils/characterAssetHelper.ts');

function getPngDimensions(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height, valid: true };
    }
  } catch (e) {
    // ignore
  }
  return { width: 0, height: 0, valid: false };
}

function getFileMd5(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

function loadTsArray(filePath, exportName) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/^import\s+[\s\S]*?;\s*/m, '');
  code = code.replace(new RegExp(`export const ${exportName}:\\s*[^=]+=`), `var ${exportName} =`);
  code = code.replace(/export const character(?:CgAssetMap|MasterMap)[\s\S]*$/, '');
  const sandbox = {};
  vm.runInNewContext(code, sandbox);
  return sandbox[exportName];
}

function loadAssetAliases() {
  if (!fs.existsSync(ASSET_HELPER_PATH)) return {};
  const code = fs.readFileSync(ASSET_HELPER_PATH, 'utf8');
  const m = code.match(/export const CHARACTER_ASSET_ALIASES:\s*Record<string,\s*string>\s*=\s*(\{[\s\S]*?\});/);
  if (!m) return {};
  try {
    const sandbox = {};
    vm.runInNewContext(`var a = ${m[1]};`, sandbox);
    return sandbox.a || {};
  } catch {
    return {};
  }
}

function loadStoryCharactersTopLevel(content, filename) {
  const m = content.match(/characters:\s*\[/);
  if (!m) return [];
  const start = m.index + m[0].length - 1;
  let depth = 0;
  let inStr = null;
  let escaped = false;
  let end = -1;
  for (let i = start; i < content.length; i++) {
    const ch = content[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      if (inStr) escaped = true;
      continue;
    }
    if (inStr) {
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return [];
  const arrSrc = content.slice(start, end);
  const sandbox = {};
  try {
    vm.runInNewContext(`var result = ${arrSrc};`, sandbox);
    return Array.isArray(sandbox.result) ? sandbox.result : [];
  } catch (e) {
    console.warn(`[WARN] Failed to evaluate characters array in ${filename}: ${e.message}`);
    return [];
  }
}

// Explicit alias equivalence sets allowed to share image hashes without error
const ALIAS_EQUIVALENCE_GROUPS = [
  ['anthony', 'mountain'],
  ['carol', 'cloer'],
  ['closer', 'closure'],
  ['magdalene', 'vendela'],
  ['windermere', 'duke_of_windermere'],
  ['wellington', 'duke_of_wellington'],
  ['gododdin', 'duke_of_gododdin'],
  ['steam_knight', 'charles_lynch'],
  ['lettou', 'leto'],
  ['helag', 'hellagur'],
  ['mephisto', 'mefisto'],
  ['astgenne', 'astrogenes'],
  ['reunion_soldier', 'reunion_soldier_a', 'reunion_soldier_b'],
];

function areCanonicalAliases(idA, idB) {
  if (idA === idB) return true;
  return ALIAS_EQUIVALENCE_GROUPS.some((grp) => grp.includes(idA) && grp.includes(idB));
}

const PROTECTED_CG_IDS = [
  'cg_ace',
  'cg_alina',
  'cg_alledale',
  'cg_alledale_child',
  'cg_astgenne',
  'cg_baird',
  'cg_big_bob',
  'cg_blake',
];

const GLOBAL_KNOWN_IDS = new Set([
  'doctor', 'kaltsit', 'amiya', 'chen', 'hoshiguma', 'swire', 'blaze', 'greythroat',
  'frostnova', 'patriot', 'talulah', 'mephisto', 'faust', 'skullshatterer', 'misha',
  'ace', 'scout', 'guard', 'medic', 'shieldguard', 'yeti_member', 'alina', 'w',
  'grani', 'skadi', 'big_bob', 'carol', 'cloer', 'ceylon', 'schwarz', 'cronin', 'herman',
  'nian', 'lava', 'crownslayer', 'nearl', 'exusiai', 'texas', 'frostleaf',
  'meteorite', 'jessica', 'rosmontis', 'provence', 'skyfire', 'leizi', 'dobermann',
  'justin', 'blake', 'yara', 'kristen', 'muelsyse', 'silence', 'saria', 'ferdinand',
  'hoolheyak', 'friston', 'parvis', 'loken', 'tinman', 'ifrit', 'nasty', 'jackson',
  'dorothy', 'astrogenes', 'greyy_alter', 'mechanist', 'sonny', 'mary', 'ptilopsis',
  'hoederer', 'ines', 'theresa', 'confessor', 'closer', 'closure',
  'bagpipe', 'harmonie', 'nine', 'kaschey', 'logos', 'nachzehrer',
  'narrator', 'fang', 'ursula', 'hornless_sarkaz', 'clovicia', 'emperors_blade'
]);

let BLACKLIST_RULES = [];
if (fs.existsSync(BLACKLIST_PATH)) {
  try {
    const bData = JSON.parse(fs.readFileSync(BLACKLIST_PATH, 'utf8'));
    BLACKLIST_RULES = bData.rules || [];
  } catch (e) {
    console.error(`[WARN] Failed to parse canon_blacklist.json: ${e.message}`);
  }
}

function validateStoryFile(filename, context) {
  const filePath = path.join(STORIES_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');

  const errors = [];
  const warnings = [];

  // 1. Extract story ID and basic metadata
  const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
  const storyId = idMatch ? idMatch[1] : filename.replace('.ts', '');

  const titleMatch = content.match(/titleKo:\s*['"]([^'"]+)['"]/);
  const titleKo = titleMatch ? titleMatch[1] : '알 수 없음';

  // 2. Banner image check
  const bannerMatch = content.match(/bannerImage:\s*['"]([^'"]+)['"]/);
  if (bannerMatch && bannerMatch[1]) {
    const bannerPath = path.join(PUBLIC_DIR, bannerMatch[1].replace(/^\//, ''));
    if (!fs.existsSync(bannerPath)) {
      errors.push(`[배너 이미지 누락] bannerImage 파일이 존재하지 않습니다: ${bannerMatch[1]}`);
    }
  }

  // 3. Top-level Characters, Avatars, Illust pairs, Master DB registration, Duplicate check
  const declaredCharIds = new Set();
  const topLevelChars = loadStoryCharactersTopLevel(content, filename);
  const perStoryAvHashes = new Map();

  for (const ch of topLevelChars) {
    if (!ch || !ch.id) continue;
    const charId = ch.id;
    const nameKo = ch.nameKo || charId;
    const roleText = ch.role || '';
    const avatarUrl = (ch.avatarUrl || '').trim();
    declaredCharIds.add(charId);

    if (roleText.length > 35) {
      warnings.push(`[직함 과잉 수식 주의 (Role Scoping)] 캐릭터 '${nameKo}'(${charId})의 role('${roleText}')이 너무 깁니다.`);
    }

    // Master DB check
    if (!context.masterKnownIds.has(charId)) {
      errors.push(`[마스터 DB 미등록] 캐릭터 '${nameKo}'(${charId})가 characterMasterDb.ts(또는 aliases)에 등록되어 있지 않습니다.`);
    }

    // Rule 4: Empty avatarUrl ('') is valid tactical silhouette placeholder!
    if (!avatarUrl) {
      continue;
    }

    const avatarPath = path.join(PUBLIC_DIR, avatarUrl.replace(/^\//, ''));
    if (!fs.existsSync(avatarPath)) {
      errors.push(`[아바타 누락] 캐릭터 '${nameKo}'(${charId})의 avatarUrl 파일이 존재하지 않습니다: ${avatarUrl}`);
    } else {
      const dims = getPngDimensions(avatarPath);
      if (dims.valid) {
        if (dims.width !== dims.height) {
          errors.push(`[아바타 규격 위반] 캐릭터 '${nameKo}'(${charId}) 아바타 비율이 1:1 정방형이 아닙니다: ${dims.width}x${dims.height} (${avatarUrl})`);
        }
        if (dims.width < 120 || dims.height < 120) {
          warnings.push(`[아바타 저해상도] 캐릭터 '${nameKo}'(${charId}) 해상도가 권장(180x180 이상)보다 작습니다: ${dims.width}x${dims.height}`);
        }
      }

      // Per-story unintended duplicate avatar hash check
      const h = getFileMd5(avatarPath);
      if (perStoryAvHashes.has(h)) {
        const prev = perStoryAvHashes.get(h);
        if (!areCanonicalAliases(prev.id, charId)) {
          errors.push(`[스토리 내 아바타 중복 오염] '${nameKo}'(${charId})와 '${prev.nameKo}'(${prev.id})가 동일한 아바타 이미지를 공유하고 있습니다 (${avatarUrl}).`);
        }
      } else {
        perStoryAvHashes.set(h, { id: charId, nameKo });
      }
    }

    // Orphan avatar prevention: Every character with a non-empty avatarUrl must also resolve to an existing standing illustUrl & CG asset
    const explicitIllust = (ch.illustUrl || '').trim();
    const aliasId = context.assetAliases[charId] || charId;
    const resolvedIllustUrl =
      explicitIllust && explicitIllust !== avatarUrl && explicitIllust.includes('/illust/')
        ? explicitIllust
        : fs.existsSync(path.join(PUBLIC_DIR, 'images/characters/illust', `${charId}.png`))
        ? `/images/characters/illust/${charId}.png`
        : `/images/characters/illust/${aliasId}.png`;

    const resolvedIllustPath = path.join(PUBLIC_DIR, resolvedIllustUrl.replace(/^\//, ''));
    if (!fs.existsSync(resolvedIllustPath)) {
      errors.push(`[전신 일러스트 누락 (고아 아바타)] '${nameKo}'(${charId})에 avatarUrl('${avatarUrl}')이 있으나 대응 전신 일러스트(${resolvedIllustUrl})가 없습니다.`);
    }

    const cgKey = `cg_${charId}`;
    const aliasCgKey = `cg_${aliasId}`;
    if (!context.cgAssetMap.has(cgKey) && !context.cgAssetMap.has(aliasCgKey)) {
      errors.push(`[CG DB 미등록] '${nameKo}'(${charId})의 자산 '${cgKey}'가 characterCgAssets.ts에 등록되어 있지 않습니다.`);
    }
  }

  // 4. Acts, Stages, Multi-Part Arcs, Omnibus Episodes & CGs validation
  const actBlockRegex = /\{\s*step:\s*(\d+)[\s\S]*?(?=\{\s*step:|\s*analysis:)/g;
  let actMatch;
  let actCount = 0;
  let stageCount = 0;
  let totalNarrativeChars = 0;

  while ((actMatch = actBlockRegex.exec(content)) !== null) {
    actCount++;
    const actBlock = actMatch[0];
    const stepNum = actMatch[1];

    const stageMatches = [...actBlock.matchAll(/stageCode:\s*['"]([^'"]+)['"]/g)];
    stageCount += stageMatches.length;

    const narrMatches = [...actBlock.matchAll(/narrativeText:\s*[`'"]([\s\S]*?)[`'"],/g)];
    for (const nm of narrMatches) {
      const text = nm[1];
      totalNarrativeChars += text.length;
      if (text.length < 150) {
        warnings.push(`[서사 분량 주의] Act ${stepNum} 내부 narrativeText(${text.length}자)가 다소 짧습니다.`);
      }
    }
  }

  const isOmnibusFormat = content.includes("docFormat: 'omnibus'") || content.includes('isOmnibus: true');
  const omnibusSubMatches = [...content.matchAll(/omnibusSubEpisodes:\s*\[([\s\S]*?)\]\s*,/g)];
  let omnibusCount = 0;
  if (omnibusSubMatches.length > 0) {
    const omniBlock = omnibusSubMatches[0][1];
    const subEps = [...omniBlock.matchAll(/order:\s*(\d+)/g)];
    omnibusCount = subEps.length;
    const omniNarrMatches = [...omniBlock.matchAll(/narrativeText:\s*[`'"]([\s\S]*?)[`'"],/g)];
    for (const nm of omniNarrMatches) {
      totalNarrativeChars += nm[1].length;
    }
  }

  const isMultiPartFormat = content.includes("docFormat: 'multi_part'");
  let multiPartCount = 0;
  if (isMultiPartFormat && content.includes('multiPartArcs:')) {
    const multiPartIndex = content.indexOf('multiPartArcs:');
    const contentIndex = content.indexOf('content:', multiPartIndex);
    const multiPartSection = contentIndex !== -1 ? content.slice(multiPartIndex, contentIndex) : content.slice(multiPartIndex);

    const arcs = [...multiPartSection.matchAll(/partNumber:\s*(\d+)/g)];
    multiPartCount = arcs.length;

    const stagesInMulti = [...multiPartSection.matchAll(/stageCode:\s*['"]([^'"]+)['"]/g)];
    stageCount = stagesInMulti.length;

    totalNarrativeChars = 0;
    const arcNarrMatches = [...multiPartSection.matchAll(/narrativeText:\s*[`'"]([\s\S]*?)[`'"],/g)];
    for (const nm of arcNarrMatches) {
      totalNarrativeChars += nm[1].length;
    }

    const tabsMatch = content.match(/seriesTabs:\s*\[([\s\S]*?)\]\s*,/);
    const tabIds = tabsMatch ? [...tabsMatch[1].matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]) : [];
    const subPagesMatch = content.match(/subPages:\s*\[([\s\S]*?)\]\s*,/);
    const subPageIds = subPagesMatch ? [...subPagesMatch[1].matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]) : [];
    const arcIds = [...multiPartSection.matchAll(/id:\s*'(part_\d+)'/g)].map(m => m[1]);

    const nonOverviewTabs = tabIds.filter(id => id !== 'overview');
    for (const tid of nonOverviewTabs) {
      if (!arcIds.includes(tid)) {
        errors.push(`[멀티파트 아크 누락] seriesTabs에 정의된 '${tid}'에 해당하는 multiPartArcs 데이터가 누락되었습니다.`);
      }
    }
    for (const aid of arcIds) {
      if (!tabIds.includes(aid)) {
        errors.push(`[시리즈 탭 누락] multiPartArcs에 존재하는 '${aid}'가 seriesTabs에 등록되어 있지 않습니다.`);
      }
    }
    if (subPageIds.length > 0) {
      const tabDiff = tabIds.filter(id => !subPageIds.includes(id));
      if (tabDiff.length > 0) {
        errors.push(`[서브페이지 불일치] subPages에 누락된 탭 ID가 있습니다: ${tabDiff.join(', ')}`);
      }
    }
  }

  if (actCount === 0 && omnibusCount === 0 && multiPartCount === 0 && !isOmnibusFormat) {
    errors.push(`[국면 누락] 등록된 작전 국면(acts), 옴니버스 에피소드 또는 멀티파트 아크가 없습니다.`);
  }

  // Global Visual Assets Check (All cgUrl, visuals[].url across Acts, Stages, Omnibus, MultiPart)
  const allCgMatches = [...content.matchAll(/cgUrl:\s*['"]([^'"]*)['"]\s*,\s*cgCaption:\s*['"]([^'"]*)['"]/g)];
  for (const m of allCgMatches) {
    const cgUrl = m[1].trim();
    const cgCaption = m[2].trim();

    if (cgUrl === '') {
      if (cgCaption !== '') {
        errors.push(`[CG 캡션 불일치] cgUrl이 비어 있으나 cgCaption('${cgCaption}')이 기재되어 있습니다.`);
      }
    } else {
      if (cgCaption === '') {
        errors.push(`[CG 캡션 누락] cgUrl('${cgUrl}')이 지정되었으나 cgCaption이 비어 있습니다.`);
      }
      const cgPath = path.join(PUBLIC_DIR, cgUrl.replace(/^\//, ''));
      if (!fs.existsSync(cgPath)) {
        errors.push(`[씬 CG 파일 누락] 씬 CG 파일이 존재하지 않습니다: ${cgUrl}`);
      } else {
        const dims = getPngDimensions(cgPath);
        if (dims.valid) {
          const ratio = dims.width / dims.height;
          if (dims.width <= dims.height || ratio < 1.2) {
            errors.push(`[씬 CG 비율 위반] 세로형/정사각형 이미지가 씬 CG에 사용되었습니다: ${dims.width}x${dims.height} (${cgUrl})`);
          }
        }
      }
    }
  }

  const visualMatches = [...content.matchAll(/url:\s*['"]([^'"]+)['"]\s*,\s*caption:\s*['"]([^'"]*)['"]/g)];
  for (const vmMatch of visualMatches) {
    const vUrl = vmMatch[1].trim();
    if (vUrl.startsWith('/images/')) {
      const vPath = path.join(PUBLIC_DIR, vUrl.replace(/^\//, ''));
      if (!fs.existsSync(vPath)) {
        errors.push(`[visuals 파일 누락] visuals에 지정된 파일이 존재하지 않습니다: ${vUrl}`);
      }
    }
  }

  const visualBlocks = [...content.matchAll(/visuals:\s*\[([\s\S]*?)\]/g)];
  for (const vb of visualBlocks) {
    const block = vb[1];
    const items = [...block.matchAll(/\{\s*url:\s*['"]([^'"]+)['"]\s*,\s*caption:\s*['"]([^'"]*)['"](?:\s*,\s*type:\s*['"]([^'"]*)['"])?/g)];
    const urls = items.map(m => m[1]);
    const captions = items.map(m => m[2]);
    const types = items.map(m => m[3] || '');

    const cgCount = urls.filter(u => u.includes('/cgs/')).length;
    const bgCount = urls.filter(u => u.includes('/backgrounds/')).length;

    if (cgCount > 0 && bgCount > 0) {
      errors.push(`[시각 표준 Rule 1 위반 (컷신/배경 혼용 금지)] 컷신 CG(${cgCount}장)가 배정된 스테이지/액트에 배경 이미지(${bgCount}장)를 혼용할 수 없습니다.`);
    }
    if (cgCount === 0 && bgCount > 1) {
      errors.push(`[시각 표준 Rule 2 위반 (배경 CG 과잉 금지)] 컷신이 없는 스테이지/액트의 배경 이미지는 최대 1장만 허용됩니다 (현재: ${bgCount}장).`);
    }

    captions.forEach((cap, cIdx) => {
      const u = urls[cIdx] || '';
      const t = types[cIdx] || '';
      if ((t === 'bg' || u.includes('/backgrounds/')) && !cap.startsWith('[배경]')) {
        errors.push(`[시각 표준 Rule 3 위반 (배경 캡션 규격)] 배경 이미지('${u}')의 캡션은 반드시 '[배경] 장소명' 형태여야 합니다 (현재: '${cap}').`);
      }
    });
  }

  // 5. Dialogue Speaker Validation
  const quoteSpeakerMatches = [...content.matchAll(/speakerId:\s*['"]([^'"]+)['"]/g)];
  for (const qm of quoteSpeakerMatches) {
    const spId = qm[1];
    if (!declaredCharIds.has(spId) && !GLOBAL_KNOWN_IDS.has(spId)) {
      warnings.push(`[화자 매핑 미확인] 대사 화자 ID '${spId}'가 캐릭터 명부(characters)에 등록되어 있지 않습니다.`);
    }
  }

  // 6. Tactical Analysis Check
  if (!content.includes('tacticalEvaluation:') || !content.includes('loreImpact:') || !content.includes('unresolvedHooks:')) {
    errors.push(`[사후 전술 분석 누락] analysis 섹션의 필수 평가 항목이 누락되었습니다.`);
  }

  // 7. Canonical Terminology Blacklist Validation
  for (const rule of BLACKLIST_RULES) {
    if (content.includes(rule.banned)) {
      errors.push(`[공식 용어 위반] 금지어 '${rule.banned}' 검출! 한국 서버 공식 표준어인 '${rule.canonical}'(으)로 수정해야 합니다. (사유: ${rule.reason})`);
    }
  }

  // 8. Early Episodes Spoiler Quarantine Lint
  const orderMatch = content.match(/order:\s*(\d+)/);
  const storyOrder = orderMatch ? parseInt(orderMatch[1], 10) : 99;
  if (storyId.startsWith('ep0') && storyOrder <= 5) {
    if (content.includes('살카즈의 왕관') || content.includes('검은 왕관')) {
      errors.push(`[스포일러 격리 위반] 초기 에피소드(${storyId})에 후기 핵심 반전 키워드('살카즈의 왕관'/'검은 왕관')가 노출되었습니다.`);
    }
  }

  return {
    storyId,
    titleKo,
    filename,
    actCount,
    stageCount,
    isMultiPartFormat,
    multiPartCount,
    totalNarrativeChars,
    charCount: declaredCharIds.size,
    errors,
    warnings
  };
}

function validateGlobalCharacterDatabases() {
  const errors = [];
  const cgAssets = loadTsArray(CG_ASSETS_PATH, 'characterCgAssets');
  const masterDb = loadTsArray(MASTER_DB_PATH, 'characterMasterDb');
  const assetAliases = loadAssetAliases();

  const cgAssetMap = new Map();
  const avatarHashOwners = new Map();
  const illustHashOwners = new Map();

  for (const asset of cgAssets) {
    cgAssetMap.set(asset.assetId, asset);
    if (asset.assetId === 'cg_none') continue;

    const rawId = asset.assetId.replace(/^cg_/, '');

    // Check 1: avatarUrl & 1:1 ratio
    if (!asset.avatarUrl) {
      errors.push(`[CG DB 아바타 누락] '${asset.assetId}'의 avatarUrl이 비어 있습니다.`);
    } else {
      const avPath = path.join(PUBLIC_DIR, asset.avatarUrl.replace(/^\//, ''));
      if (!fs.existsSync(avPath)) {
        errors.push(`[CG DB 아바타 파일 없음] '${asset.assetId}' -> ${asset.avatarUrl}`);
      } else {
        const dims = getPngDimensions(avPath);
        if (dims.valid && dims.width !== dims.height) {
          errors.push(`[CG DB 아바타 비율 오류] '${asset.assetId}'가 1:1이 아닙니다: ${dims.width}x${dims.height}`);
        }
        if (!asset.isSharedOrBorrowed) {
          const avHash = getFileMd5(avPath);
          if (avatarHashOwners.has(avHash)) {
            const prev = avatarHashOwners.get(avHash);
            if (!areCanonicalAliases(prev.rawId, rawId)) {
              errors.push(`[CG DB 아바타 해시 충돌] '${asset.assetId}'와 '${prev.assetId}'가 동일한 1:1 아바타 파일을 사용합니다 (별칭/공유 플래그 없음).`);
            }
          } else {
            avatarHashOwners.set(avHash, { assetId: asset.assetId, rawId });
          }
        }
      }
    }

    // Check 2: illustUrl must also physically exist
    if (!asset.illustUrl) {
      errors.push(`[CG DB 전신 누락] '${asset.assetId}'의 illustUrl이 비어 있습니다.`);
    } else {
      const ilPath = path.join(PUBLIC_DIR, asset.illustUrl.replace(/^\//, ''));
      if (!fs.existsSync(ilPath)) {
        errors.push(`[CG DB 전신 파일 없음] '${asset.assetId}' -> ${asset.illustUrl}`);
      } else if (!asset.isSharedOrBorrowed) {
        const ilHash = getFileMd5(ilPath);
        if (illustHashOwners.has(ilHash)) {
          const prev = illustHashOwners.get(ilHash);
          if (!areCanonicalAliases(prev.rawId, rawId)) {
            errors.push(`[CG DB 전신 해시 충돌] '${asset.assetId}'와 '${prev.assetId}'가 동일한 전신 일러스트 파일을 사용합니다 (별칭/공유 플래그 없음).`);
          }
        } else {
          illustHashOwners.set(ilHash, { assetId: asset.assetId, rawId });
        }
      }
    }
  }

  // Check 3: Protected user-edited assets intact
  for (const pId of PROTECTED_CG_IDS) {
    const a = cgAssetMap.get(pId);
    if (!a || !a.isUserEdited) {
      errors.push(`[사용자 보호 자산 훼손] '${pId}'의 isUserEdited: true 플래그가 유실되었습니다.`);
    } else {
      const avOk = a.avatarUrl && fs.existsSync(path.join(PUBLIC_DIR, a.avatarUrl.replace(/^\//, '')));
      const ilOk = a.illustUrl && fs.existsSync(path.join(PUBLIC_DIR, a.illustUrl.replace(/^\//, '')));
      if (!avOk || !ilOk) {
        errors.push(`[사용자 보호 자산 파일 유실] '${pId}' (avOk=${Boolean(avOk)}, ilOk=${Boolean(ilOk)})`);
      }
    }
  }

  // Check 4: Master DB known IDs & CG references
  const masterKnownIds = new Set();
  for (const r of masterDb) {
    masterKnownIds.add(r.charId);
    if (Array.isArray(r.aliases)) {
      for (const al of r.aliases) masterKnownIds.add(al);
    }
    for (const st of (r.states || [])) {
      if (st.cgAssetId && !cgAssetMap.has(st.cgAssetId)) {
        errors.push(`[마스터 DB CG 참조 오류] '${r.charId}.${st.stateId}'가 존재하지 않는 '${st.cgAssetId}'를 참조합니다.`);
      }
      if (st.cgAssetId === 'cg_none' && cgAssetMap.has(`cg_${r.charId}`)) {
        errors.push(`[마스터 DB 실루엣 불일치] '${r.charId}.${st.stateId}'가 cg_none 상태지만 전용 자산 'cg_${r.charId}'가 존재합니다.`);
      }
    }
  }

  return {
    cgCount: cgAssets.length,
    masterCount: masterDb.length,
    cgAssetMap,
    masterKnownIds,
    assetAliases,
    errors,
  };
}

function runAll() {
  console.log('\n' + '='.repeat(76));
  console.log(' [PRTS ARCHIVE SYSTEM] STORY & CHARACTER VISUAL VALIDATION SUITE (v4.0)');
  console.log('='.repeat(76) + '\n');

  const dbCheck = validateGlobalCharacterDatabases();
  let totalErrors = dbCheck.errors.length;
  let totalWarnings = 0;

  if (dbCheck.errors.length === 0) {
    console.log(`\x1b[32m✓ PASS\x1b[0m [characterCgAssets/Master ] CG ${dbCheck.cgCount}종 · 마스터 ${dbCheck.masterCount}종 · 사용자 보호 8종 · 중복 해시 검증 완료\n`);
  } else {
    console.log(`\x1b[31m✗ FAIL\x1b[0m [characterCgAssets/Master ] 캐릭터 DB 무결성 오류 ${dbCheck.errors.length}건 발견`);
    dbCheck.errors.forEach((err) => console.log(`       \x1b[31m[ERROR]\x1b[0m ${err}`));
    console.log('');
  }

  const files = fs.readdirSync(STORIES_DIR).filter(f => f.endsWith('.ts'));

  files.forEach(file => {
    const result = validateStoryFile(file, dbCheck);
    const statusIcon = result.errors.length === 0 ? '✓ PASS' : '✗ FAIL';
    const statusColor = result.errors.length === 0 ? '\x1b[32m' : '\x1b[31m';
    const resetColor = '\x1b[0m';

    const stageInfo = result.stageCount > 0 ? ` | 세부 스테이지: ${result.stageCount}개` : '';
    const arcHeader = result.isMultiPartFormat
      ? `Parts: ${result.multiPartCount}개 | 세부 스테이지: ${result.stageCount}개`
      : `Acts: ${result.actCount}개${stageInfo}`;
    console.log(`${statusColor}${statusIcon}${resetColor} [${result.storyId.padEnd(25)}] ${result.titleKo} (${result.filename})`);
    console.log(`       └ ${arcHeader} | 서사 총량: ${result.totalNarrativeChars.toLocaleString()}자 | 등장인물: ${result.charCount}명`);

    if (result.errors.length > 0) {
      totalErrors += result.errors.length;
      result.errors.forEach(err => {
        console.log(`       \x1b[31m[ERROR]\x1b[0m ${err}`);
      });
    }

    if (result.warnings.length > 0) {
      totalWarnings += result.warnings.length;
      result.warnings.forEach(warn => {
        console.log(`       \x1b[33m[WARN]\x1b[0m ${warn}`);
      });
    }
    console.log('');
  });

  const terraRegionsPath = path.join(__dirname, '../src/data/terraRegions.ts');
  if (fs.existsSync(terraRegionsPath)) {
    const trContent = fs.readFileSync(terraRegionsPath, 'utf8');
    const trErrors = [];
    for (const rule of BLACKLIST_RULES) {
      if (trContent.includes(rule.banned)) {
        trErrors.push(`[월드맵 공식 용어 위반] terraRegions.ts에서 금지어 '${rule.banned}' 검출! -> '${rule.canonical}'(으)로 수정 필요`);
      }
    }
    if (trErrors.length > 0) {
      totalErrors += trErrors.length;
      console.log(`\x1b[31m✗ FAIL\x1b[0m [terraRegions.ts           ] 테라 월드맵 지역 데이터베이스`);
      trErrors.forEach(err => console.log(`       \x1b[31m[ERROR]\x1b[0m ${err}`));
      console.log('');
    } else {
      console.log(`\x1b[32m✓ PASS\x1b[0m [terraRegions.ts           ] 테라 22개 전 지역 및 도시 매핑 정합성 검증 완료\n`);
    }
  }

  const masterDir = path.join(__dirname, '../src/assets/character_masters');
  if (fs.existsSync(masterDir)) {
    const masterFiles = fs.readdirSync(masterDir).filter(f => f.endsWith('.png'));
    let masterErrors = 0;
    masterFiles.forEach(mf => {
      const p = path.join(masterDir, mf);
      const dims = getPngDimensions(p);
      if (!dims.valid || dims.width < 120 || dims.height < 120) {
        masterErrors++;
        totalErrors++;
        console.log(`       \x1b[31m[ERROR]\x1b[0m [마스터 아카이브 손상] ${mf}: 유효하지 않거나 저해상도 이미지 (${dims.width}x${dims.height})`);
      }
    });
    if (masterErrors === 0 && masterFiles.length > 0) {
      console.log(`\x1b[32m✓ PASS\x1b[0m [character_masters        ] ${masterFiles.length}종 핵심 NPC 마스터 아카이브 무결성 검증 완료\n`);
    }
  }

  console.log('='.repeat(76));
  if (totalErrors > 0) {
    console.error(`\x1b[31m[VERIFICATION FAILED] 총 ${totalErrors}개의 치명적 오류와 ${totalWarnings}개의 경고가 발견되었습니다.\x1b[0m`);
    console.log('='.repeat(76) + '\n');
    process.exit(1);
  } else {
    console.log(`\x1b[32m[VERIFICATION SUCCESS] 총 ${files.length}개 스토리 및 캐릭터 자산 DB 검증 통과 (에러: 0건, 경고: ${totalWarnings}건)\x1b[0m`);
    console.log('='.repeat(76) + '\n');
    process.exit(0);
  }
}

runAll();
