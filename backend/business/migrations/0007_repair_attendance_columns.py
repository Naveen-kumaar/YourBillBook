from django.db import migrations


def add_missing_attendance_columns(apps, schema_editor):
    attendance = apps.get_model("business", "Attendance")
    connection = schema_editor.connection
    table_name = attendance._meta.db_table
    existing_columns = {
        column.name
        for column in connection.introspection.get_table_description(
            connection.cursor(), table_name
        )
    }

    for field_name in ("department", "check_in", "check_out"):
        field = attendance._meta.get_field(field_name)
        if field.column not in existing_columns:
            schema_editor.add_field(attendance, field)


class Migration(migrations.Migration):

    dependencies = [
        ("business", "0006_attendance_work_details"),
    ]

    operations = [
        migrations.RunPython(add_missing_attendance_columns, migrations.RunPython.noop),
    ]
