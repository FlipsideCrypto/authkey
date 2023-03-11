# Generated by Django 4.1.7 on 2023-03-11 03:00

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Badge",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("token_id", models.PositiveIntegerField(default=0)),
                ("name", models.CharField(blank=True, max_length=128, null=True)),
                ("description", models.TextField(blank=True, null=True)),
                ("image_hash", models.CharField(blank=True, max_length=256, null=True)),
                ("token_uri", models.CharField(blank=True, max_length=256, null=True)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("updated", models.DateTimeField(auto_now=True)),
                (
                    "delegates",
                    models.ManyToManyField(
                        blank=True,
                        related_name="delegates",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "users",
                    models.ManyToManyField(
                        blank=True, related_name="users", to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
            options={
                "ordering": ["-created"],
            },
        ),
    ]
