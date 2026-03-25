#!/usr/bin/env python3
import traceback
import sys

try:
    import main
    print("✓ Import successful!")
except Exception as e:
    print(f"Error type: {type(e).__name__}")
    print(f"Error: {e}")
    traceback.print_exc()
    sys.exit(1)
