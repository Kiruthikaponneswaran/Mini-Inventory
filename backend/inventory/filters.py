import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    """?category=<id>&is_active=true  (name search is handled by DRF's SearchFilter: ?search=)"""

    class Meta:
        model = Product
        fields = ["category", "is_active"]
