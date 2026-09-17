from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("business", "0002_attendance"),
    ]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="business_name",
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name="customer",
            name="gstin",
            field=models.CharField(blank=True, max_length=15),
        ),
    ]
