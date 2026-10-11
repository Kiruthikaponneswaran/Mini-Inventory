from rest_framework import viewsets
from rest_framework_simplejwt.views import TokenObtainPairView

from .filters import ProductFilter
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    """Full CRUD for products. Supports ?search=, ?category=, ?is_active=, ?ordering=, ?page=."""

    # select_related avoids an N+1 query on category_name for every row.
    queryset = Product.objects.select_related("category")
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    search_fields = ["name"]
    ordering_fields = ["name", "price", "stock", "created_at"]


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only and unpaginated: it only feeds the filter / form dropdowns."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None
    filter_backends: list = []


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """JWT login with a per-IP rate limit to slow down password guessing."""

    throttle_scope = "login"
