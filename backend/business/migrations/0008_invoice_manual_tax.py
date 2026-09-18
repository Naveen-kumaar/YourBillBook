from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("business", "0007_repair_attendance_columns"),
    ]

    operations = [
        migrations.AddField(
            model_name="invoice",
            name="cgst_rate",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name="invoice",
            name="sgst_rate",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name="invoice",
            name="cgst",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="invoice",
            name="sgst",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]