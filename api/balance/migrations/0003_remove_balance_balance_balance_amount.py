# Generated by Django 4.1.1 on 2022-10-17 01:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("balance", "0002_transaction_balance_transactions"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="balance",
            name="balance",
        ),
        migrations.AddField(
            model_name="balance",
            name="amount",
            field=models.BigIntegerField(default=0),
        ),
    ]
