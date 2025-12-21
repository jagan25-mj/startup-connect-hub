# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('startups', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='startup',
            index=models.Index(fields=['owner'], name='startups_owner_idx'),
        ),
        migrations.AddIndex(
            model_name='startup',
            index=models.Index(fields=['industry'], name='startups_industry_idx'),
        ),
        migrations.AddIndex(
            model_name='startup',
            index=models.Index(fields=['stage'], name='startups_stage_idx'),
        ),
        migrations.AddIndex(
            model_name='startup',
            index=models.Index(fields=['created_at'], name='startups_created_idx'),
        ),
    ]