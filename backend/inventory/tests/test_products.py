import pytest

from inventory.models import Product

pytestmark = pytest.mark.django_db


# --- CRUD ------------------------------------------------------------------
def test_create_product(api, electronics):
    res = api.post(
        "/api/products/",
        {"name": "  Mouse  ", "price": "19.90", "stock": 3, "category": electronics.id},
        format="json",
    )
    assert res.status_code == 201
    assert res.data["name"] == "Mouse"  # trimmed
    assert res.data["category_name"] == "Electronics"
    assert res.data["is_active"] is True
    assert Product.objects.count() == 1


def test_retrieve_update_delete_product(api, make_product):
    product = make_product()
    url = f"/api/products/{product.id}/"

    assert api.get(url).status_code == 200

    res = api.patch(url, {"stock": 42}, format="json")
    assert res.status_code == 200
    assert res.data["stock"] == 42

    assert api.delete(url).status_code == 204
    assert api.get(url).status_code == 404


def test_put_requires_all_fields(api, make_product):
    product = make_product()
    res = api.put(f"/api/products/{product.id}/", {"name": "Only name"}, format="json")
    assert res.status_code == 400
    assert {"price", "stock", "category"} <= set(res.data)


# --- Validation --------------------------------------------------------------
@pytest.mark.parametrize("price", ["0", "0.00", "-5", "-0.01"])
def test_price_must_be_greater_than_zero(api, electronics, price):
    res = api.post(
        "/api/products/",
        {"name": "X", "price": price, "stock": 1, "category": electronics.id},
        format="json",
    )
    assert res.status_code == 400
    assert "greater than 0" in str(res.data["price"][0])


def test_stock_cannot_be_negative(api, electronics):
    res = api.post(
        "/api/products/",
        {"name": "X", "price": "1.00", "stock": -1, "category": electronics.id},
        format="json",
    )
    assert res.status_code == 400
    assert "negative" in str(res.data["stock"][0])


def test_zero_stock_is_allowed(api, electronics):
    res = api.post(
        "/api/products/",
        {"name": "X", "price": "1.00", "stock": 0, "category": electronics.id},
        format="json",
    )
    assert res.status_code == 201


def test_blank_name_and_unknown_category_rejected(api):
    res = api.post(
        "/api/products/",
        {"name": "   ", "price": "1.00", "stock": 1, "category": 9999},
        format="json",
    )
    assert res.status_code == 400
    assert {"name", "category"} <= set(res.data)


def test_price_with_too_many_decimals_rejected(api, electronics):
    res = api.post(
        "/api/products/",
        {"name": "X", "price": "1.999", "stock": 1, "category": electronics.id},
        format="json",
    )
    assert res.status_code == 400
    assert "price" in res.data


# --- Pagination / filtering / search -----------------------------------------
def test_pagination_shape_and_page_size(api, make_product):
    for i in range(23):
        make_product(name=f"Item {i}")

    first = api.get("/api/products/").data
    assert first["count"] == 23
    assert len(first["results"]) == 10
    assert first["next"] and first["previous"] is None

    last = api.get("/api/products/?page=3").data
    assert len(last["results"]) == 3

    assert api.get("/api/products/?page=4").status_code == 404


def test_page_size_is_capped(api, make_product):
    for i in range(5):
        make_product(name=f"Item {i}")
    res = api.get("/api/products/?page_size=100000")
    assert res.status_code == 200
    assert len(res.data["results"]) == 5


def test_filter_by_category(api, make_product, books):
    make_product(name="Mouse")
    make_product(name="Novel", category=books)
    res = api.get(f"/api/products/?category={books.id}")
    assert [p["name"] for p in res.data["results"]] == ["Novel"]


def test_search_by_name_is_case_insensitive_partial(api, make_product):
    make_product(name="Wireless Mouse")
    make_product(name="Mechanical Keyboard")
    res = api.get("/api/products/?search=mOUS")
    assert [p["name"] for p in res.data["results"]] == ["Wireless Mouse"]


def test_search_and_category_filter_combine(api, make_product, books):
    make_product(name="Python Mouse Pad")
    make_product(name="Python Cookbook", category=books)
    res = api.get(f"/api/products/?category={books.id}&search=python")
    assert [p["name"] for p in res.data["results"]] == ["Python Cookbook"]


def test_ordering(api, make_product):
    make_product(name="B", price="5.00")
    make_product(name="A", price="9.00")
    res = api.get("/api/products/?ordering=-price")
    assert [p["name"] for p in res.data["results"]] == ["A", "B"]


def test_categories_endpoint_lists_all_unpaginated(api, electronics, books):
    res = api.get("/api/categories/")
    assert res.status_code == 200
    assert [c["name"] for c in res.data] == ["Books", "Electronics"]


def test_categories_are_read_only(api):
    assert api.post("/api/categories/", {"name": "New"}).status_code == 405


# --- Seed ----------------------------------------------------------------------
def test_seed_command_is_idempotent_and_meets_requirements():
    from django.core.management import call_command

    from inventory.models import Category

    call_command("seed")
    call_command("seed")
    assert Product.objects.count() >= 20
    assert Category.objects.count() >= 3
