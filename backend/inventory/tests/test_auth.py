import pytest

pytestmark = pytest.mark.django_db


def test_products_require_authentication(anon):
    assert anon.get("/api/products/").status_code == 401


def test_login_returns_tokens_and_token_grants_access(anon, user):
    res = anon.post("/api/auth/token/", {"username": "tester", "password": "s3cret-pass"})
    assert res.status_code == 200
    assert {"access", "refresh"} <= set(res.data)

    anon.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    assert anon.get("/api/products/").status_code == 200


def test_login_with_wrong_password_is_rejected(anon, user):
    res = anon.post("/api/auth/token/", {"username": "tester", "password": "nope"})
    assert res.status_code == 401


def test_refresh_token_issues_new_access_token(anon, user):
    tokens = anon.post("/api/auth/token/", {"username": "tester", "password": "s3cret-pass"}).data
    res = anon.post("/api/auth/token/refresh/", {"refresh": tokens["refresh"]})
    assert res.status_code == 200
    assert "access" in res.data


def test_login_is_rate_limited(anon, user):
    statuses = [
        anon.post("/api/auth/token/", {"username": "tester", "password": "bad"}).status_code
        for _ in range(12)
    ]
    assert statuses[-1] == 429
