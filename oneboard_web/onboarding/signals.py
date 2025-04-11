from django.db.models.signals import pre_delete
from django.dispatch import receiver
from .models import Course
import os

@receiver(pre_delete, sender=Course)
def delete_course_files(sender, instance, **kwargs):
    """
    Удаляет файлы, связанные с курсом при его удалении
    """
    try:
        # Удаление изображения курса
        if instance.image:
            if os.path.isfile(instance.image.path):
                os.remove(instance.image.path)
            
        # Здесь можно добавить удаление других файлов, 
        # связанных с курсом, если они есть
        
    except Exception as e:
        print(f"Error deleting course files: {e}") 