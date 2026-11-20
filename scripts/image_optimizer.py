#!/usr/bin/env python3
"""
PRTS Archive - Shared WebP Image Optimization Engine
----------------------------------------------------
Provides consistent WebP conversion, proportional downscaling, alpha preservation,
and atomic write verification for both bulk optimization and ingestion pipelines.
"""

from __future__ import annotations

import argparse
import io
import os
import sys
from pathlib import Path
from typing import Dict, Optional, Tuple

from PIL import Image, ImageOps

KIND_PRESETS: Dict[str, Tuple[int, int]] = {
    # (max_dim_px, webp_quality)
    "cg": (1920, 84),
    "bg": (1920, 84),
    "banner": (1920, 84),
    "cover": (1600, 84),
    "map": (1600, 85),
    "logo": (1024, 90),
    "avatar": (320, 88),
    "illust": (1600, 85),
    "library": (1400, 80),
}


def infer_kind_from_path(path: Path) -> str:
    parts = [p.lower() for p in path.parts]
    if "cgs" in parts:
        return "cg"
    if "backgrounds" in parts:
        return "bg"
    if "banners" in parts:
        return "banner"
    if "story_covers" in parts or "stories_preview" in parts:
        return "cover"
    if "map" in parts:
        return "map"
    if "logos" in parts:
        return "logo"
    if "character_library" in parts or "library" in parts or "illust_legacy_backup" in parts:
        return "library"
    if "illust" in parts:
        return "illust"
    if "characters" in parts:
        return "avatar"
    return "cg"


def _normalize_mode(im: Image.Image) -> Image.Image:
    im = ImageOps.exif_transpose(im)
    has_alpha = (
        im.mode in ("RGBA", "LA", "PA")
        or (im.mode == "P" and "transparency" in im.info)
    )
    return im.convert("RGBA" if has_alpha else "RGB")


def _downscale_if_needed(im: Image.Image, max_dim: int) -> Image.Image:
    if max_dim <= 0:
        return im
    w, h = im.size
    if w <= max_dim and h <= max_dim:
        return im
    scale = min(max_dim / w, max_dim / h)
    new_w = max(1, round(w * scale))
    new_h = max(1, round(h * scale))
    return im.resize((new_w, new_h), Image.Resampling.LANCZOS)


def save_webp_image(
    im: Image.Image,
    dst_path: str | Path,
    kind: str = "cg",
    max_dim: Optional[int] = None,
    quality: Optional[int] = None,
    exact_size: Optional[Tuple[int, int]] = None,
) -> int:
    preset_dim, preset_q = KIND_PRESETS.get(kind, (1920, 84))
    eff_dim = max_dim if max_dim is not None else preset_dim
    eff_q = quality if quality is not None else preset_q

    dst = Path(dst_path)
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp_dst = dst.with_name(f".__tmp_{dst.name}")

    processed = _normalize_mode(im)
    if exact_size is not None:
        if processed.size != exact_size:
            processed = processed.resize(exact_size, Image.Resampling.LANCZOS)
    else:
        processed = _downscale_if_needed(processed, eff_dim)

    processed.save(tmp_dst, format="WEBP", quality=eff_q, method=6)

    # Verify readable WebP before replacing target
    with Image.open(tmp_dst) as verify_im:
        verify_im.load()

    os.replace(tmp_dst, dst)
    return dst.stat().st_size


def save_webp_bytes(
    raw_bytes: bytes,
    dst_path: str | Path,
    kind: str = "cg",
    max_dim: Optional[int] = None,
    quality: Optional[int] = None,
    exact_size: Optional[Tuple[int, int]] = None,
) -> int:
    with Image.open(io.BytesIO(raw_bytes)) as im:
        return save_webp_image(
            im,
            dst_path,
            kind=kind,
            max_dim=max_dim,
            quality=quality,
            exact_size=exact_size,
        )


def optimize_file_to_webp(
    src_path: str | Path,
    dst_path: Optional[str | Path] = None,
    kind: Optional[str] = None,
    max_dim: Optional[int] = None,
    quality: Optional[int] = None,
    exact_size: Optional[Tuple[int, int]] = None,
    delete_source: bool = False,
) -> Tuple[int, int, Path]:
    src = Path(src_path)
    eff_kind = kind or infer_kind_from_path(src)
    dst = Path(dst_path) if dst_path is not None else src.with_suffix(".webp")

    src_size = src.stat().st_size
    with Image.open(src) as im:
        new_size = save_webp_image(
            im,
            dst,
            kind=eff_kind,
            max_dim=max_dim,
            quality=quality,
            exact_size=exact_size,
        )

    if delete_source and src.resolve() != dst.resolve() and src.exists():
        src.unlink()

    return src_size, new_size, dst


def main() -> int:
    parser = argparse.ArgumentParser(description="Optimize image to WebP using PRTS presets.")
    parser.add_argument("src", help="Source image path")
    parser.add_argument("dst", nargs="?", help="Destination WebP path (defaults to src with .webp)")
    parser.add_argument("--kind", default=None, choices=sorted(KIND_PRESETS.keys()))
    parser.add_argument("--max-dim", type=int, default=None)
    parser.add_argument("--quality", type=int, default=None)
    parser.add_argument("--avatar-180", action="store_true", help="Resize output to exact 180x180")
    parser.add_argument("--delete-src", action="store_true", help="Delete original file after conversion")
    args = parser.parse_args()

    exact = (180, 180) if args.avatar_180 else None
    before, after, out = optimize_file_to_webp(
        args.src,
        args.dst,
        kind=args.kind,
        max_dim=args.max_dim,
        quality=args.quality,
        exact_size=exact,
        delete_source=args.delete_src,
    )
    pct = ((before - after) / before * 100.0) if before > 0 else 0.0
    print(f"OK {out} ({before} -> {after} bytes, -{pct:.1f}%)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
