#!/usr/bin/env python3
"""Test file to check langchain imports."""

print("Testing langchain imports...")

try:
    import langchain
    print("✓ langchain imported successfully")
except ImportError as e:
    print(f"✗ langchain import failed: {e}")

try:
    from langchain_core.documents import Document
    print("✓ langchain_core.documents imported successfully")
except ImportError as e:
    print(f"✗ langchain_core.documents import failed: {e}")

try:
    from langchain.schema import Document
    print("✓ langchain.schema.Document imported successfully")
except ImportError as e:
    print(f"✗ langchain.schema.Document import failed: {e}")

try:
    from langchain_core.messages import BaseMessage
    print("✓ langchain_core.messages imported successfully")
except ImportError as e:
    print(f"✗ langchain_core.messages import failed: {e}")

try:
    from langchain.schema.messages import BaseMessage
    print("✓ langchain.schema.messages imported successfully")
except ImportError as e:
    print(f"✗ langchain.schema.messages import failed: {e}")

print("\nTest completed.")