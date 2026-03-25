# File Cleanup Script - Usage Guide

## Overview
This is an optimized Python script that automatically deletes old files from a directory. It uses `os.scandir()` for efficient high-performance file iteration, making it ideal for large directories with thousands of files.

**File**: `cleanup_old_files.py`

---

## Features

✅ **Fast Iteration**: Uses `os.scandir()` for O(n) performance  
✅ **Error Handling**: Comprehensive try-except blocks with detailed logging  
✅ **Smart Filtering**: Skips directories and symlinks, only deletes files  
✅ **Logging**: Timestamps every action with before/after file info  
✅ **Batch Processing**: Handles memory efficiently for large directories  
✅ **Dry-Run Mode**: Safely preview what will be deleted  
✅ **Progress Tracking**: Shows stats every 100 files processed  

---

## Installation

No external dependencies required! Just Python 3.7+

```bash
# Verify Python version
python --version  # Should be 3.7 or higher
```

---

## Usage

### Basic Usage (Delete files older than 3 months from current directory)
```bash
python cleanup_old_files.py .
```

### Delete from Specific Directory
```bash
python cleanup_old_files.py /path/to/directory
```

### Dry-Run Mode (Preview without deleting)
```bash
python cleanup_old_files.py /path/to/directory --dry-run
```

### Custom Age Threshold (e.g., 30 days instead of 90)
```bash
python cleanup_old_files.py /path/to/directory --days 30
```

### Custom Log File
```bash
python cleanup_old_files.py /path/to/directory --log my_cleanup.log
```

### Combine Options
```bash
# Delete files older than 180 days from Desktop, dry-run, custom log
python cleanup_old_files.py ~/Desktop --days 180 --dry-run --log cleanup.log
```

---

## Configuration

Edit these constants at the top of the script to change defaults:

```python
DAYS_OLD_THRESHOLD = 90      # 3 months = ~90 days
LOG_FILE = "file_cleanup.log"  # Log file name
BATCH_SIZE = 100             # Progress update every N files
```

---

## Output Examples

### Console Output
```
INFO     | ======================================================================
INFO     | Starting cleanup: /Users/admin/Downloads
INFO     | Delete threshold: 90 days old
INFO     | Dry run: False
INFO     | ======================================================================
INFO     | ✓ DELETED | old_backup.zip | Modified: 2023-12-15 10:45:22 | Size: 450.32 MB
INFO     | ✓ DELETED | report_2023.pdf | Modified: 2023-11-20 14:30:01 | Size: 2.15 MB
INFO     | Progress: 15 deleted, 42 skipped, 0 errors
INFO     | ✓ DELETED | cache_old.db | Modified: 2023-10-01 08:00:00 | Size: 1024.00 MB
INFO     | ======================================================================
INFO     | Cleanup Summary:
INFO     |   ✓ Files deleted:  87
INFO     |   ⊘ Files skipped:  234
INFO     |   ✗ Errors:         0
INFO     |   Overall status:   SUCCESS
INFO     | ======================================================================
```

### Log File Output
```
2024-01-15 10:30:45 | INFO     | Starting cleanup: /Users/admin/Downloads
2024-01-15 10:30:45 | INFO     | Delete threshold: 90 days old
2024-01-15 10:30:45 | DEBUG    | SKIP (dir): Archives
2024-01-15 10:30:46 | INFO     | ✓ DELETED | old_backup.zip | Modified: 2023-12-15 10:45:22 | Size: 450.32 MB
2024-01-15 10:30:46 | DEBUG    | SKIP (not old enough): recent_file.txt (15.3 days old)
2024-01-15 10:30:47 | INFO     | Progress: 50 deleted, 100 skipped, 0 errors
```

---

## Command-Line Arguments

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `directory` | string | (required) | Target directory (use `.` for current dir) |
| `--days` | integer | 90 | Delete files older than this many days |
| `--dry-run` | flag | False | Preview without actual deletion |
| `--log` | string | file_cleanup.log | Path to log file |
| `--help` | flag | - | Show help message |

---

## Error Handling

The script handles these errors gracefully:

| Error Type | Behavior |
|-----------|----------|
| **Directory not found** | Logs error, exits with status 1 |
| **Permission denied** | Logs error, continues with other files |
| **File in use** | Skips file, logs warning |
| **Concurrent deletion** | Detects and logs as info (not error) |
| **OS error** | Logs error, increments error counter |

---

## Performance Characteristics

### Time Complexity
- **Directory scan**: O(n) where n = number of files
- **Per-file check**: O(1) (just read modification time)
- **Overall**: O(n) linear time

### Space Complexity
- O(1) - Processes one file at a time (no loading all files into memory)

### Benchmark (Example)
```
Directory: /disk/archive (10,000 files, 500 GB total)
Scan time: ~3 seconds (O(n) iteration)
Delete time: ~5 seconds (50 files/second)
Total: ~8 seconds for 1000 old files
```

---

## Best Practices

### ✅ DO

- **Test with `--dry-run` first** before actual deletion
- **Check log file** after completion to verify results
- **Use specific dates** (e.g., `--days 90` not `--days 100`)
- **Schedule regularly** with cron/Task Scheduler
- **Monitor disk space** before and after

### ❌ DON'T

- **Don't run on critical directories** without testing first
- **Don't ignore errors** in the log file
- **Don't delete files you might need** (use conservative threshold)
- **Don't run multiple instances simultaneously** on same directory
- **Don't disable logging** - it's crucial for auditing

---

## Scheduling (Automation)

### Linux/macOS (Cron)
```bash
# Edit crontab
crontab -e

# Run cleanup every week (Sundays at 2 AM, 90 days threshold)
0 2 * * 0 python /path/to/cleanup_old_files.py /data/archives --days 90 --log /var/log/cleanup.log
```

### Windows (Task Scheduler)
```batch
# Create batch wrapper: cleanup.bat
@echo off
cd C:\scripts
python cleanup_old_files.py C:\data\archives --days 90 --log C:\logs\cleanup.log
```

Then schedule in Task Scheduler to run weekly.

---

## Advanced Usage

### Python API (Import as module)
```python
from cleanup_old_files import cleanup_old_files, setup_logging

# Setup logging
logger = setup_logging("my_log.log")

# Run cleanup programmatically
deleted, skipped, errors = cleanup_old_files(
    directory="/path/to/dir",
    days_threshold=90,
    dry_run=False,
    logger=logger
)

print(f"Deleted: {deleted}, Skipped: {skipped}, Errors: {errors}")
```

### Multiple Directories
```bash
# Create cleanup_multiple.py
import subprocess
import sys

directories = [
    "/data/archive1",
    "/data/archive2", 
    "/data/old_logs"
]

for directory in directories:
    print(f"\nCleaning {directory}...")
    result = subprocess.run(
        ["python", "cleanup_old_files.py", directory, "--days", "90"],
        capture_output=True
    )
    print(result.stdout.decode())
```

---

## Troubleshooting

### Files not being deleted
**Issue**: Files matching criteria aren't being deleted
```bash
# Solution: Use --dry-run to see what would be deleted
python cleanup_old_files.py /path --dry-run

# Check log file for errors
cat file_cleanup.log | grep ERROR
```

### Permission denied errors
**Issue**: Script can't delete some files
```
# Solution: Run with elevated privileges
sudo python cleanup_old_files.py /path --days 90

# Or check file permissions
ls -la /path/problematic_file
chmod u+w /path/problematic_file
```

### Very slow on large directories
**Issue**: Takes too long to scan directory with 100k+ files
```
# Solution: Increase batch size in code
BATCH_SIZE = 1000  # Instead of 100

# The script processes incrementally, so partial results are logged
```

### Log file growing too large
**Issue**: Log file keeps growing
```bash
# Solution: Archive old logs
mv file_cleanup.log file_cleanup.log.$(date +%Y%m%d)
gzip file_cleanup.log.*
```

---

## Security Considerations

⚠️ **Important**: Before running on production:

1. **Test on non-critical directory first**
   ```bash
   python cleanup_old_files.py /test/directory --dry-run
   ```

2. **Review log file carefully**
   ```bash
   cat file_cleanup.log
   ```

3. **Verify file counts match expectations**
   ```bash
   # Before cleanup
   find /path -type f -mtime +90 | wc -l
   
   # Should match "Files deleted" in summary
   ```

4. **Keep backup of log files**
   ```bash
   cp file_cleanup.log file_cleanup.log.backup
   ```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success (no errors) |
| `1` | One or more errors occurred |

---

## License & Attribution

Created: 2024
Optimized for: Production environments with large directories
Tested on: Python 3.7+, Linux, macOS, Windows

---

## Quick Start

```bash
# 1. Save script in your project
cp cleanup_old_files.py /your/project/

# 2. Test with dry-run first
python cleanup_old_files.py /path/to/directory --dry-run

# 3. Review the log file
cat file_cleanup.log

# 4. If satisfied, run for real
python cleanup_old_files.py /path/to/directory

# 5. Check results
grep "Summary" file_cleanup.log
```

---

**Need help?** Check the `file_cleanup.log` file - it logs everything with timestamps!
