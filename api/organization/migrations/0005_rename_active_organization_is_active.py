# Generated by Django 4.1.1 on 2022-10-03 05:41

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("organization", "0004_alter_organization_options_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="organization",
            old_name="active",
            new_name="is_active",
        ),
    ]