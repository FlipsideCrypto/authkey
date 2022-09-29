# Generated by Django 4.1.1 on 2022-09-29 21:09

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('badge', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Organization',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chain', models.CharField(blank=True, max_length=50, null=True)),
                ('name', models.CharField(max_length=128)),
                ('description', models.TextField(max_length=4000)),
                ('image_hash', models.CharField(blank=True, max_length=256, null=True)),
                ('contract_uri_hash', models.CharField(blank=True, max_length=256, null=True)),
                ('contract_address', models.CharField(blank=True, max_length=50, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('badges', models.ManyToManyField(blank=True, to='badge.badge')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
