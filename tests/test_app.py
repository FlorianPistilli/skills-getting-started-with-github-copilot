import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_root_redirect():
    """Test that root endpoint redirects to static/index.html"""
    response = client.get("/")
    assert response.status_code == 200
    # Since it's a redirect response, but TestClient follows redirects by default
    # Actually, RedirectResponse returns 307, but TestClient might follow it
    # Let me check what happens
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities():
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "Programming Class" in data
    # Check structure of one activity
    chess_club = data["Chess Club"]
    assert "description" in chess_club
    assert "schedule" in chess_club
    assert "max_participants" in chess_club
    assert "participants" in chess_club
    assert isinstance(chess_club["participants"], list)


def test_signup_for_activity():
    """Test signing up for an activity"""
    # First, get initial participants count
    response = client.get("/activities")
    initial_data = response.json()
    initial_count = len(initial_data["Chess Club"]["participants"])

    # Sign up a new student
    response = client.post("/activities/Chess Club/signup?email=test@example.com")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "test@example.com" in data["message"]
    assert "Chess Club" in data["message"]

    # Verify the student was added
    response = client.get("/activities")
    updated_data = response.json()
    assert len(updated_data["Chess Club"]["participants"]) == initial_count + 1
    assert "test@example.com" in updated_data["Chess Club"]["participants"]


def test_signup_activity_not_found():
    """Test signing up for non-existent activity"""
    response = client.post("/activities/NonExistent/signup?email=test@example.com")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "Activity not found" in data["detail"]


def test_signup_already_signed_up():
    """Test signing up when already signed up"""
    # First sign up
    client.post("/activities/Programming Class/signup?email=duplicate@example.com")

    # Try to sign up again
    response = client.post("/activities/Programming Class/signup?email=duplicate@example.com")
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "already signed up" in data["detail"]


def test_unregister_from_activity():
    """Test unregistering from an activity"""
    # First sign up
    client.post("/activities/Tennis Club/signup?email=unregister@example.com")

    # Get count before unregister
    response = client.get("/activities")
    data = response.json()
    initial_count = len(data["Tennis Club"]["participants"])

    # Unregister
    response = client.delete("/activities/Tennis Club/unregister?email=unregister@example.com")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "unregister@example.com" in data["message"]
    assert "Tennis Club" in data["message"]

    # Verify removed
    response = client.get("/activities")
    data = response.json()
    assert len(data["Tennis Club"]["participants"]) == initial_count - 1
    assert "unregister@example.com" not in data["Tennis Club"]["participants"]


def test_unregister_activity_not_found():
    """Test unregistering from non-existent activity"""
    response = client.delete("/activities/NonExistent/unregister", params={"email": "test@example.com"})
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "Activity not found" in data["detail"]


def test_unregister_not_signed_up():
    """Test unregistering when not signed up"""
    response = client.delete("/activities/Gym Class/unregister", params={"email": "notsignedup@example.com"})
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "not signed up" in data["detail"]