from django.db import models
from django.db.models import Q


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    # PROTECT: deleting a category that still has products should be an explicit decision.
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            # Defence in depth: the serializer validates too, but the DB is the last line.
            models.CheckConstraint(condition=Q(price__gt=0), name="product_price_gt_0"),
        ]
        indexes = [models.Index(fields=["name"])]

    def __str__(self) -> str:
        return self.name
