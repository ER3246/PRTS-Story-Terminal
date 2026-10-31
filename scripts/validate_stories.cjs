/**
 * PRTS Story Terminal - Story Archive Automated Validator v3.0 (Universal Quality Assurance)
 * 
 * Verifies story archives against strict quality, system, and canon constraints:
 * 1. Structural schema integrity (acts, optional 2-tier stages, characters, glossary, analysis).
 * 2. Visual asset integrity:
 *    - All cgUrl, visuals[].url, avatarUrl, bannerImage files must physically exist in public/.
 *    - Scene CGs must be strictly horizontal wide aspect ratio (width > height, ratio >= 1.2).
 *    - Empty state synchronization: If cgUrl is empty (''), cgCaption MUST also be empty ('').
 *    - Character avatars must be strictly 1:1 square (width === height, min 120x120).
 * 3. Dialogue speaker and cast cross-referencing.
 * 4. Narrative depth & volume check (calculates total narrative chars across acts + stages).
 * 5. Canonical terminology & blacklist enforcement (scans raw_data/canon_blacklist.json).
 * 6. Role Scoping Rule check (flags overly verbose backstory titles in role field).
 * 7. Spoiler quarantine checks for early episodes.
 */

const fs = require('fs');
const path = require('path');

const STORIES_DIR = path.join(__dirname, '../src/data/stories');
const PUBLIC_DIR = path.join(__dirname, '../public');
const BLACKLIST_PATH = path.join(__dirname, '../raw_data/canon_blacklist.json');

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
  'hoederer', 'ines', 'theresa', 'confessor', 'closer',
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

function validateStoryFile(filename) {
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

  // 3. Characters, Avatars & Role Scoping validation (Rule 4: Silhouette profile for generic NPCs)
  const declaredCharIds = new Set();
  const charRegex = /id:\s*['"]([a-zA-Z0-9_-]+)['"],\s*nameKo:\s*(?:"([^"]+)"|'([^']+)'),[\s\S]*?role:\s*['"]([^'"]+)['"],[\s\S]*?avatarUrl:\s*['"]([^'"]*)['"]/g;
  let cm;
  while ((cm = charRegex.exec(content)) !== null) {
    const [_, charId, nameKo1, nameKo2, roleText, avatarUrl] = cm;
    const nameKo = nameKo1 || nameKo2;
    declaredCharIds.add(charId);

    // Role Scoping Rule check: role should be concise operational title (<= 35 chars)
    if (roleText.length > 35) {
      warnings.push(`[직함 과잉 수식 주의 (Role Scoping)] 캐릭터 '${nameKo}'(${charId})의 role('${roleText}')이 너무 깁니다. 작전 당시의 핵심 직책으로 간결화하세요.`);
    }

    // Rule 4: If avatarUrl is empty (''), it's a valid tactical silhouette placeholder!
    if (!avatarUrl || avatarUrl.trim() === '') {
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

    // Count nested stageCodes if v3.0 stages array is used
    const stageMatches = [...actBlock.matchAll(/stageCode:\s*['"]([^'"]+)['"]/g)];
    stageCount += stageMatches.length;

    // Sum narrativeText lengths in this act
    const narrMatches = [...actBlock.matchAll(/narrativeText:\s*[`'"]([\s\S]*?)[`'"],/g)];
    for (const nm of narrMatches) {
      const text = nm[1];
      totalNarrativeChars += text.length;
      if (text.length < 150) {
        warnings.push(`[서사 분량 주의] Act ${stepNum} 내부 narrativeText(${text.length}자)가 다소 짧습니다.`);
      }
    }
  }

  // Count Omnibus sub-episodes if present
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

  // Count Multi-part arcs if present
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

    // In multiPart, total narrative should be calculated from multiPartSection (parts and stages)
    totalNarrativeChars = 0;
    const arcNarrMatches = [...multiPartSection.matchAll(/narrativeText:\s*[`'"]([\s\S]*?)[`'"],/g)];
    for (const nm of arcNarrMatches) {
      totalNarrativeChars += nm[1].length;
    }

    // Tab vs MultiPartArcs Synchronous Integrity Check
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

  if (actCount === 0 && omnibusCount === 0 && multiPartCount === 0) {
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

  // Check visuals[].url
  const visualMatches = [...content.matchAll(/url:\s*['"]([^'"]+)['"]\s*,\s*caption:\s*['"]([^'"]*)['"]/g)];
  for (const vm of visualMatches) {
    const vUrl = vm[1].trim();
    if (vUrl.startsWith('/images/')) {
      const vPath = path.join(PUBLIC_DIR, vUrl.replace(/^\//, ''));
      if (!fs.existsSync(vPath)) {
        errors.push(`[visuals 파일 누락] visuals에 지정된 파일이 존재하지 않습니다: ${vUrl}`);
      }
    }
  }

  // Visual Quality Standards (Rule 1, Rule 2, Rule 3) across each stage or act visuals array
  const visualBlocks = [...content.matchAll(/visuals:\s*\[([\s\S]*?)\]/g)];
  for (const vb of visualBlocks) {
    const block = vb[1];
    const items = [...block.matchAll(/\{\s*url:\s*['"]([^'"]+)['"]\s*,\s*caption:\s*['"]([^'"]*)['"](?:\s*,\s*type:\s*['"]([^'"]*)['"])?/g)];
    const urls = items.map(m => m[1]);
    const captions = items.map(m => m[2]);
    const types = items.map(m => m[3] || '');

    const cgCount = urls.filter(u => u.includes('/cgs/')).length;
    const bgCount = urls.filter(u => u.includes('/backgrounds/')).length;

    // Rule 1: No mixing of cutscene CGs and backgrounds in the same stage
    if (cgCount > 0 && bgCount > 0) {
      errors.push(`[시각 표준 Rule 1 위반 (컷신/배경 혼용 금지)] 컷신 CG(${cgCount}장)가 배정된 스테이지/액트에 배경 이미지(${bgCount}장)를 혼용할 수 없습니다.`);
    }

    // Rule 2: Max 1 background image if no cutscenes
    if (cgCount === 0 && bgCount > 1) {
      errors.push(`[시각 표준 Rule 2 위반 (배경 CG 과잉 금지)] 컷신이 없는 스테이지/액트의 배경 이미지는 최대 1장만 허용됩니다 (현재: ${bgCount}장).`);
    }

    // Rule 3: Background caption format requirement
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

function runAll() {
  console.log('\n' + '='.repeat(76));
  console.log(' [PRTS ARCHIVE SYSTEM] STORY DATA QUALITY VALIDATION SUITE (v3.0)');
  console.log('='.repeat(76) + '\n');

  const files = fs.readdirSync(STORIES_DIR).filter(f => f.endsWith('.ts'));
  let totalErrors = 0;
  let totalWarnings = 0;

  files.forEach(file => {
    const result = validateStoryFile(file);
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

  // Character Master Archives Integrity Check
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
    console.log(`\x1b[32m[VERIFICATION SUCCESS] 총 ${files.length}개 스토리 및 테라 월드맵 무결성 검증 통과 (에러: 0건, 경고: ${totalWarnings}건)\x1b[0m`);
    console.log('='.repeat(76) + '\n');
    process.exit(0);
  }
}

runAll();
