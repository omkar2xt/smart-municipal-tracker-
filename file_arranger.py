"""
File Arranger
-------------
Organize files into a clean folder structure by file type.

Highlights:
- Fast scan using os.scandir
- Recursive scan support
- Dry-run mode (safe preview)
- Moves files only (never moves folders)
- Name collision handling
- Optional skip list for folders

Example:
    python file_arranger.py "E:/Downloads" --recursive --dry-run
    python file_arranger.py "E:/Downloads" --recursive
"""

from __future__ import annotations

import argparse
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Set, Tuple


CATEGORY_MAP: Dict[str, str] = {
    # Documents
    ".pdf": "Documents",
    ".doc": "Documents",
    ".docx": "Documents",
    ".txt": "Documents",
    ".rtf": "Documents",
    ".md": "Documents",
    ".csv": "Documents",
    ".xls": "Documents",
    ".xlsx": "Documents",
    ".ppt": "Documents",
    ".pptx": "Documents",

    # Images
    ".jpg": "Images",
    ".jpeg": "Images",
    ".png": "Images",
    ".gif": "Images",
    ".bmp": "Images",
    ".webp": "Images",
    ".svg": "Images",
    ".heic": "Images",

    # Audio
    ".mp3": "Audio",
    ".wav": "Audio",
    ".m4a": "Audio",
    ".aac": "Audio",
    ".flac": "Audio",
    ".ogg": "Audio",

    # Video
    ".mp4": "Videos",
    ".mkv": "Videos",
    ".avi": "Videos",
    ".mov": "Videos",
    ".wmv": "Videos",
    ".webm": "Videos",

    # Archives
    ".zip": "Archives",
    ".rar": "Archives",
    ".7z": "Archives",
    ".tar": "Archives",
    ".gz": "Archives",

    # Code
    ".py": "Code",
    ".js": "Code",
    ".ts": "Code",
    ".jsx": "Code",
    ".tsx": "Code",
    ".java": "Code",
    ".c": "Code",
    ".cpp": "Code",
    ".cs": "Code",
    ".go": "Code",
    ".php": "Code",
    ".html": "Code",
    ".css": "Code",
    ".json": "Code",
    ".xml": "Code",
    ".yml": "Code",
    ".yaml": "Code",

    # Executables / installers
    ".exe": "Programs",
    ".msi": "Programs",
    ".apk": "Programs",
}

CATEGORY_NAMES = set(CATEGORY_MAP.values()) | {"Others"}


def timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log(message: str) -> None:
    print(f"[{timestamp()}] {message}")


def resolve_destination(dest_file: Path) -> Path:
    """Avoid overwriting existing files by appending (_1), (_2), ..."""
    if not dest_file.exists():
        return dest_file

    stem = dest_file.stem
    suffix = dest_file.suffix
    parent = dest_file.parent
    index = 1

    while True:
        candidate = parent / f"{stem}_{index}{suffix}"
        if not candidate.exists():
            return candidate
        index += 1


def category_for(file_path: Path) -> str:
    ext = file_path.suffix.lower()
    return CATEGORY_MAP.get(ext, "Others")


def should_skip(path: Path, skip_dirs: Set[str]) -> bool:
    """Skip directory if any path part matches configured skip names."""
    parts = {part.lower() for part in path.parts}
    return any(name in parts for name in skip_dirs)


def iter_files(root: Path, recursive: bool, skip_dirs: Set[str]) -> Iterable[Path]:
    """
    Iterate files using os.scandir for better performance on large folders.
    Yields file paths only.
    """
    if recursive:
        stack: List[Path] = [root]
        while stack:
            current = stack.pop()
            try:
                with os.scandir(current) as entries:
                    for entry in entries:
                        entry_path = Path(entry.path)
                        if entry.is_dir(follow_symlinks=False):
                            if not should_skip(entry_path, skip_dirs):
                                stack.append(entry_path)
                            continue
                        if entry.is_file(follow_symlinks=False):
                            yield entry_path
            except PermissionError:
                log(f"WARN  Permission denied: {current}")
            except OSError as err:
                log(f"WARN  Failed to scan {current}: {err}")
    else:
        try:
            with os.scandir(root) as entries:
                for entry in entries:
                    if entry.is_file(follow_symlinks=False):
                        yield Path(entry.path)
        except PermissionError:
            log(f"ERROR Permission denied: {root}")
        except OSError as err:
            log(f"ERROR Failed to scan {root}: {err}")


def arrange_files(
    source: Path,
    recursive: bool,
    dry_run: bool,
    skip_dirs: Set[str],
) -> Tuple[int, int, int]:
    """
    Arrange files into category folders under source directory.

    Returns:
        moved_count, skipped_count, error_count
    """
    moved = 0
    skipped = 0
    errors = 0

    for file_path in iter_files(source, recursive=recursive, skip_dirs=skip_dirs):
        # Skip files already inside a managed category folder.
        if file_path.parent.name in CATEGORY_NAMES:
            skipped += 1
            continue

        category = category_for(file_path)
        category_dir = source / category
        target_file = resolve_destination(category_dir / file_path.name)

        # No-op check
        if file_path.resolve() == target_file.resolve():
            skipped += 1
            continue

        try:
            if dry_run:
                log(f"DRY   {file_path} -> {target_file}")
                moved += 1
                continue

            category_dir.mkdir(parents=True, exist_ok=True)
            shutil.move(str(file_path), str(target_file))
            log(f"MOVE  {file_path} -> {target_file}")
            moved += 1
        except PermissionError:
            log(f"ERROR Permission denied: {file_path}")
            errors += 1
        except FileNotFoundError:
            log(f"ERROR File not found (possibly moved externally): {file_path}")
            errors += 1
        except OSError as err:
            log(f"ERROR Failed to move {file_path}: {err}")
            errors += 1

    return moved, skipped, errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Arrange files into category folders (Documents, Images, Videos, etc.)."
    )
    parser.add_argument("source", help="Folder to arrange")
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="Scan subfolders recursively",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show planned moves without changing files",
    )
    parser.add_argument(
        "--skip",
        nargs="*",
        default=[".git", "node_modules", "venv", ".venv", "__pycache__"],
        help="Directory names to ignore when recursive scan is enabled",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = Path(args.source).expanduser().resolve()

    if not source.exists():
        log(f"ERROR Source folder does not exist: {source}")
        return 1
    if not source.is_dir():
        log(f"ERROR Source path is not a folder: {source}")
        return 1

    skip_dirs = {name.lower() for name in args.skip}

    log("Starting file arrangement")
    log(f"Source     : {source}")
    log(f"Recursive  : {args.recursive}")
    log(f"Dry-run    : {args.dry_run}")
    log(f"Skip dirs  : {sorted(skip_dirs)}")

    moved, skipped, errors = arrange_files(
        source=source,
        recursive=args.recursive,
        dry_run=args.dry_run,
        skip_dirs=skip_dirs,
    )

    log("----- Summary -----")
    log(f"Moved   : {moved}")
    log(f"Skipped : {skipped}")
    log(f"Errors  : {errors}")

    return 0 if errors == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
