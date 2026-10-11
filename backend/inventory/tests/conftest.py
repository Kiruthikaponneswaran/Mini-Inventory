import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient

from inventory.models import Category, Product


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def user(db):
    return get_user_model().objects.create_user("tester", password="s3cret-pass")


@pytest.fixture
def api(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.fixture
def anon():
    return APIClient()


@pytest.fixture
def electronics(db):
    return Category.objects.create(name="Electronics")


@pytest.fixture
def books(db):
    return Category.objects.create(name="Books")


@pytest.fixture
def make_product(electronics):
    def _make(**kwargs):
        defaults = {"name": "Widget", "price": "9.99", "stock": 5, "category": electronics}
        return Product.objects.create(**{**defaults, **kwargs})

    return _make
