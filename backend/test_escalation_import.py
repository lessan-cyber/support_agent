#!/usr/bin/env python3
"""Test the escalation.py file imports."""

print("Testing escalation.py imports...")

try:
    from app.agent.nodes.escalation import escalate_to_human
    print("✓ escalate_to_human imported successfully")
except ImportError as e:
    print(f"✗ escalate_to_human import failed: {e}")
    import traceback
    traceback.print_exc()

print("\nTest completed.")