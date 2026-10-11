"""Idempotent demo data: 6 categories, 24 products, and a demo login.

    python manage.py seed            # create / update
    python manage.py seed --reset    # wipe products & categories first
"""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from inventory.models import Category, Product

DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo12345"

# (name, price, stock, is_active)
SEED = {
    "Electronics": [
        ("Wireless Mouse", "24.99", 120, True),
        ("Mechanical Keyboard", "89.50", 45, True),
        ("USB-C Hub 7-in-1", "39.00", 8, True),
        ("27\" 4K Monitor", "329.99", 15, True),
        ("Noise-Cancelling Headphones", "199.00", 0, True),
    ],
    "Office Supplies": [
        ("A4 Copy Paper (500 sheets)", "6.49", 400, True),
        ("Gel Pens (12 pack)", "8.75", 210, True),
        ("Stapler Heavy Duty", "14.20", 3, True),
        ("Whiteboard Markers (8 pack)", "11.00", 75, True),
    ],
    "Furniture": [
        ("Ergonomic Office Chair", "249.00", 12, True),
        ("Standing Desk 140cm", "429.00", 6, True),
        ("Bookshelf 5-Tier", "89.90", 20, True),
        ("Filing Cabinet 3-Drawer", "119.00", 0, False),
    ],
    "Kitchen": [
        ("Electric Kettle 1.7L", "34.99", 60, True),
        ("Espresso Machine", "159.00", 9, True),
        ("Non-Stick Frying Pan 28cm", "27.50", 35, True),
        ("Chef's Knife 20cm", "49.00", 22, True),
    ],
    "Sports & Outdoors": [
        ("Yoga Mat 6mm", "19.99", 80, True),
        ("Adjustable Dumbbell Set", "139.00", 5, True),
        ("Insulated Water Bottle 1L", "22.00", 150, True),
        ("Camping Tent 2-Person", "119.50", 0, False),
    ],
    "Books": [
        ("Clean Code", "37.99", 18, True),
        ("The Pragmatic Programmer", "42.50", 25, True),
    ],
}


class Command(BaseCommand):
    help = "Load demo categories, products and a demo user."

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            Product.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write("Existing products and categories removed.")

        created = 0
        for category_name, products in SEED.items():
            category, _ = Category.objects.get_or_create(name=category_name)
            for name, price, stock, is_active in products:
                _, was_created = Product.objects.update_or_create(
                    name=name,
                    category=category,
                    defaults={"price": Decimal(price), "stock": stock, "is_active": is_active},
                )
                created += was_created

        user, user_created = get_user_model().objects.get_or_create(username=DEMO_USERNAME)
        user.set_password(DEMO_PASSWORD)
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {Category.objects.count()} categories, {Product.objects.count()} products "
                f"({created} new). Login: {DEMO_USERNAME} / {DEMO_PASSWORD}"
            )
        )

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete existing data first.")
