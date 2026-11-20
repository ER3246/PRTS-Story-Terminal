#!/usr/bin/env python3
"""
PRTS Archive - Full Image Batch Optimizer
-----------------------------------------
Converts all raster images (.png, .jpg, .jpeg) across BOTH tracked public/images/
and local-only local_assets/ directories to size-optimized WebP files.

Skips PWA manifest icons (public/icons/*.png) and raw editing masters
(src/assets/character_masters/*.png) by design.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import os
import sys
from pathlib import Path
from typing import List, Tuple

from image_optimizer import infer_kind_from_path, optimize_file_to_webp

ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_SCAN_DIRS = [
    ROOT_DIR / "public" / "images",
    ROOT_DIR / "local_assets",
]
RASTER_EXTS = {".png", ".jpg", ".jpeg"}


def collect_targets(scan_dirs: List[Path]) -> List[Path]:
    targets: List[Path] = []
    for base in scan_dirs:
        if not base.exists():
            continue
        for root, _, files in os.walk(base):
            for fn in files:
                p = Path(root) / fn
                if p.name.startswith(".__tmp_"):
                    continue
                if p.suffix.lower() in RASTER_EXTS:
                    targets.append(p)
    return sorted(targets)


def process_one(src: Path, dry_run: bool = False) -> Tuple[str, int, int, str]:
    kind = infer_kind_from_path(src)
    dst = src.with_suffix(".webp")
    src_size = src.stat().st_size

    if dry_run:
        return ("DRY", src_size, src_size, str(src.relative_to(ROOT_DIR)))

    try:
        # If target .webp already exists alongside legacy .png, re-optimize from .png only if .webp is missing
        if dst.exists() and dst.stat().st_size > 0:
            # Remove redundant legacy source since .webp already exists
            src.unlink()
            return ("DEDUP", src_size, dst.stat().st_size, str(dst.relative_to(ROOT_DIR)))

        before, after, out = optimize_file_to_webp(
            src,
            dst,
            kind=kind,
            delete_source=True,
        )
        return ("OK", before, after, str(out.relative_to(ROOT_DIR)))
    except Exception as exc:
        return ("ERR", src_size, src_size, f"{src.relative_to(ROOT_DIR)}: {exc}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch convert PRTS images to optimized WebP.")
    parser.add_argument("--dry-run", action="store_true", help="List files without modifying disk")
    parser.add_argument("--workers", type=int, default=min(8, (os.cpu_count() or 4)))
    parser.add_argument("--only-public", action="store_true", help="Only process public/images")
    args = parser.parse_args()

    scan_dirs = [ROOT_DIR / "public" / "images"] if args.only_public else DEFAULT_SCAN_DIRS
    targets = collect_targets(scan_dirs)
    if not targets:
        print("[PRTS Image Optimizer] 변환할 PNG/JPG 이미지가 없습니다 (이미 최신 WebP 상태).")
        return 0

    print(f"[PRTS Image Optimizer] 대상 파일 {len(targets):,}개 처리 시작 (workers={args.workers})...", flush=True)

    total_before = 0
    total_after = 0
    ok_count = 0
    dedup_count = 0
    err_list: List[str] = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(process_one, p, args.dry_run) for p in targets]
        for idx, fut in enumerate(concurrent.futures.as_completed(futures), 1):
            status, before, after, msg = fut.result()
            total_before += before
            total_after += after
            if status == "OK":
                ok_count += 1
            elif status == "DEDUP":
                dedup_count += 1
            elif status == "ERR":
                err_list.append(msg)
            if idx % 500 == 0 or idx == len(targets):
                print(f"  진행률: {idx:,}/{len(targets):,}", flush=True)

    saved_mb = (total_before - total_after) / (1024 * 1024)
    pct = ((total_before - total_after) / total_before * 100.0) if total_before > 0 else 0.0
    print("\n" + "=" * 72)
    print(f"변환 완료: 신규 WebP {ok_count:,}개 | 중복 정리 {dedup_count:,}개 | 오류 {len(err_list)}건")
    print(
        f"용량 변화: {total_before / (1024 * 1024):,.2f} MB -> "
        f"{total_after / (1024 * 1024):,.2f} MB (절감: {saved_mb:,.2f} MB / -{pct:.1f}%)"
    )
    print("=" * 72)

    if err_list:
        for e in err_list[:20]:
            print(f"  [ERROR] {e}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
