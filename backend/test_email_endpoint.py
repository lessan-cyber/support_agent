#!/usr/bin/env python3
"""Test the email endpoint for escalated tickets."""

import asyncio
import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_email_endpoint():
    """Test the email collection endpoint."""
    print("Testing email collection endpoint...")

    # Create a test ticket ID
    test_ticket_id = "06939a76-c0f8-7b5a-8000-45df3b5a8a79"

    # Test the endpoint
    response = client.post(
        f"/api/v1/admin/tickets/{test_ticket_id}/email",
        json={"email": "user@example.com"},
    )

    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.json()}")

    if response.status_code == 200:
        print("✓ Email endpoint works correctly")
        return True
    else:
        print("✗ Email endpoint failed")
        return False


if __name__ == "__main__":
    result = test_email_endpoint()
    if result:
        print("\n🎉 Email endpoint test passed!")
    else:
        print("\n❌ Email endpoint test failed.")
