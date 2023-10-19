# Generated by Django 4.1.1 on 2022-10-04 01:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("job", "0004_contractlistener_cron_expression"),
    ]

    operations = [
        migrations.AddField(
            model_name="contractlistener",
            name="chain",
            field=models.CharField(
                choices=[
                    ("ethereum", "Ethereum"),
                    ("polygon", "Polygon"),
                    ("optimism", "Optimism"),
                ],
                default="ethereum",
                max_length=255,
            ),
        ),
        migrations.AlterField(
            model_name="contractlistener",
            name="event_abi",
            field=models.TextField(
                choices=[("FACTORY", "Factory"), ("ORGANIZATION", "Organization")],
                default="FACTORY",
            ),
        ),
    ]