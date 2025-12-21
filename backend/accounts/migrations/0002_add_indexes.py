# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['email'], name='users_email_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role'], name='users_role_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['created_at'], name='users_created_idx'),
        ),
    ]