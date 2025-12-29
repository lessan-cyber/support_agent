#!/usr/bin/env python3
"""Test the main.py file imports."""

print("Testing main.py imports...")

try:
    import app.main
    print("✓ Main application imported successfully")
except ImportError as e:
    print(f"✗ Main application import failed: {e}")
    import traceback
    traceback.print_exc()

print("\nTest completed.")