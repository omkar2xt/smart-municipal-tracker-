"""
Optimized File Cleanup Script
Automatically deletes files older than 3 months from a specified directory.

Features:
- Uses os.scandir() for efficient file iteration
- Non-recursive (only deletes from target directory)
- Skips directories (only deletes files)
- Comprehensive error handling
- Timestamps every action in log file
- Progress tracking
"""

import os
import sys
import getpass
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Tuple

# ============================================================================
# CONFIGURATION
# ============================================================================

DAYS_OLD_THRESHOLD = 90  # 3 months = ~90 days
LOG_FILE = "file_cleanup.log"
BATCH_SIZE = 100  # Process files in batches for memory efficiency

# ============================================================================
# LOGGING SETUP
# ============================================================================

def setup_logging(log_file: str) -> logging.Logger:
    """
    Configure logging to file and console.
    
    Args:
        log_file: Path to log file
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger("FileCleanup")
    logger.setLevel(logging.DEBUG)
    if logger.handlers:
        logger.handlers.clear()
    
    # File handler (all messages)
    file_handler = logging.FileHandler(log_file, mode='a', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    
    # Console handler (info and above)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(levelname)-8s | %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger


# ============================================================================
# FILE DELETION LOGIC
# ============================================================================

def get_file_age_days(file_path: Path) -> float:
    """
    Calculate file age in days based on modification time.
    
    Args:
        file_path: Path to file
        
    Returns:
        Age in days (float)
    """
    try:
        mod_time = os.path.getmtime(file_path)
        mod_datetime = datetime.fromtimestamp(mod_time)
        age = datetime.now() - mod_datetime
        return age.total_seconds() / (24 * 3600)  # Convert seconds to days
    except OSError as e:
        raise Exception(f"Cannot read modification time: {e}")


def is_file_old_enough(file_path: Path, days_threshold: int) -> bool:
    """
    Check if file is older than threshold.
    
    Args:
        file_path: Path to file
        days_threshold: Age threshold in days
        
    Returns:
        True if file is old enough to delete
    """
    age = get_file_age_days(file_path)
    return age >= days_threshold


def safe_delete_file(file_path: Path, logger: logging.Logger) -> bool:
    """
    Safely delete a file with comprehensive error handling.
    
    Args:
        file_path: Path to file
        logger: Logger instance
        
    Returns:
        True if deletion successful, False otherwise
    """
    try:
        # Double-check it's still a file (not deleted by another process)
        if not file_path.is_file():
            logger.warning(f"File no longer exists (concurrent deletion?): {file_path}")
            return False
        
        # Get file info before deletion
        size_bytes = file_path.stat().st_size
        mod_time = datetime.fromtimestamp(file_path.stat().st_mtime)
        
        # Attempt deletion
        os.remove(file_path)
        
        # Log successful deletion
        size_mb = size_bytes / (1024 * 1024)
        logger.info(
            f"✓ DELETED | {file_path.name} | "
            f"Modified: {mod_time.strftime('%Y-%m-%d %H:%M:%S')} | "
            f"Size: {size_mb:.2f} MB"
        )
        
        return True
        
    except PermissionError:
        logger.error(f"✗ PERMISSION DENIED: {file_path}")
        return False
    except FileNotFoundError:
        logger.warning(f"✗ FILE NOT FOUND (concurrent deletion?): {file_path}")
        return False
    except OSError as e:
        logger.error(f"✗ OS ERROR deleting {file_path}: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ UNEXPECTED ERROR deleting {file_path}: {e}")
        return False


# ============================================================================
# MAIN CLEANUP FUNCTION
# ============================================================================

def cleanup_old_files(
    directory: str,
    days_threshold: int = DAYS_OLD_THRESHOLD,
    dry_run: bool = False,
    logger: Optional[logging.Logger] = None
) -> Tuple[int, int, int]:
    """
    Scan directory and delete old files efficiently.
    
    Uses os.scandir() for O(n) iteration performance on large directories.
    Processes files in batches to manage memory usage.
    
    Args:
        directory: Target directory path
        days_threshold: Delete files older than this many days
        dry_run: If True, only simulate deletion (don't actually delete)
        logger: Logger instance
        
    Returns:
        Tuple of (files_deleted, files_skipped, errors_encountered)
    """
    
    if logger is None:
        logger = logging.getLogger("FileCleanup")
    
    # ========== INPUT VALIDATION ==========
    dir_path = Path(directory)
    
    if not dir_path.exists():
        logger.error(f"Directory does not exist: {directory}")
        return 0, 0, 1
    
    if not dir_path.is_dir():
        logger.error(f"Path is not a directory: {directory}")
        return 0, 0, 1
    
    if not os.access(dir_path, os.R_OK):
        logger.error(f"No read permission for directory: {directory}")
        return 0, 0, 1
    
    # ========== CLEANUP EXECUTION ==========
    deleted = 0
    skipped = 0
    errors = 0
    batch_count = 0
    
    logger.info("=" * 70)
    logger.info(f"Starting cleanup: {dir_path.absolute()}")
    logger.info(f"Delete threshold: {days_threshold} days old")
    logger.info(f"Dry run: {dry_run}")
    logger.info("=" * 70)
    
    try:
        # Use os.scandir() for efficient directory iteration
        # This is faster than os.listdir() for large directories
        with os.scandir(dir_path) as entries:
            for entry in entries:
                try:
                    # Skip directories (only delete files)
                    if entry.is_dir(follow_symlinks=False):
                        logger.debug(f"SKIP (dir): {entry.name}")
                        skipped += 1
                        continue
                    
                    # Skip symbolic links (optional - change if needed)
                    if entry.is_symlink():
                        logger.debug(f"SKIP (symlink): {entry.name}")
                        skipped += 1
                        continue
                    
                    # Check if file is old enough
                    file_path = Path(entry.path)
                    try:
                        if not is_file_old_enough(file_path, days_threshold):
                            logger.debug(
                                f"SKIP (not old enough): {entry.name} "
                                f"({get_file_age_days(file_path):.1f} days old)"
                            )
                            skipped += 1
                            continue
                    except Exception as e:
                        logger.error(f"Error checking file age for {file_path}: {e}")
                        errors += 1
                        continue
                    
                    # Delete the file (or simulate)
                    if dry_run:
                        age = get_file_age_days(file_path)
                        logger.info(
                            f"[DRY RUN] Would delete: {entry.name} "
                            f"({age:.1f} days old)"
                        )
                        deleted += 1
                    else:
                        if safe_delete_file(file_path, logger):
                            deleted += 1
                        else:
                            errors += 1
                    
                    # Batch processing (progress indication for large dirs)
                    batch_count += 1
                    if batch_count % BATCH_SIZE == 0:
                        logger.info(
                            f"Progress: {deleted} deleted, "
                            f"{skipped} skipped, "
                            f"{errors} errors"
                        )
                
                except Exception as e:
                    logger.error(f"Error processing {entry.name}: {e}")
                    errors += 1
                    continue
    
    except PermissionError:
        logger.error(f"Permission denied accessing directory: {directory}")
        return deleted, skipped, errors + 1
    except OSError as e:
        logger.error(f"OS error scanning directory: {e}")
        return deleted, skipped, errors + 1
    except Exception as e:
        logger.error(f"Unexpected error during cleanup: {e}")
        return deleted, skipped, errors + 1
    
    # ========== SUMMARY ==========
    logger.info("=" * 70)
    logger.info(f"Cleanup Summary:")
    logger.info(f"  ✓ Files deleted:  {deleted}")
    logger.info(f"  ⊘ Files skipped:  {skipped}")
    logger.info(f"  ✗ Errors:         {errors}")
    logger.info(f"  Overall status:   {'SUCCESS' if errors == 0 else 'COMPLETED WITH ERRORS'}")
    logger.info("=" * 70)
    
    return deleted, skipped, errors


# ============================================================================
# COMMAND-LINE INTERFACE
# ============================================================================

def main():
    """
    Command-line interface for file cleanup script.
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Delete files older than a specified number of days",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Delete files older than 90 days from current directory
  python cleanup.py .
  
  # Delete files older than 180 days from specific directory (dry run)
  python cleanup.py /path/to/directory --days 180 --dry-run
  
  # Delete files older than 30 days (verbose logging)
  python cleanup.py /path/to/directory --days 30 --log cleanup.log
        """
    )
    
    parser.add_argument(
        "directory",
        help="Target directory to scan (use '.' for current directory)"
    )
    
    parser.add_argument(
        "--days",
        type=int,
        default=DAYS_OLD_THRESHOLD,
        help=f"Delete files older than this many days (default: {DAYS_OLD_THRESHOLD})"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate deletion without actually deleting files"
    )
    
    parser.add_argument(
        "--log",
        type=str,
        default=LOG_FILE,
        help=f"Log file path (default: {LOG_FILE})"
    )
    
    args = parser.parse_args()

    if args.days <= 0:
        parser.error("days must be a positive integer")
    
    # Setup logging
    logger = setup_logging(args.log)
    
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Script started by user: {getpass.getuser()}")
    
    # Run cleanup
    deleted, skipped, errors = cleanup_old_files(
        directory=args.directory,
        days_threshold=args.days,
        dry_run=args.dry_run,
        logger=logger
    )
    
    # Exit with appropriate code
    sys.exit(0 if errors == 0 else 1)


if __name__ == "__main__":
    main()
