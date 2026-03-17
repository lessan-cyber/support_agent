#!/usr/bin/env python3
"""Test the state.py file imports."""

print("Testing state.py imports...")

try:
    from app.agent.state import AgentState
    print("✓ AgentState imported successfully")
except ImportError as e:
    print(f"✗ AgentState import failed: {e}")
    import traceback
    traceback.print_exc()

print("\nTest completed.")