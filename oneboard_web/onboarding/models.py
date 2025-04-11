from django.db import models
from users.models import User

class Course(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Черновик'),
        ('published', 'Опубликован'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to='courses/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_courses')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class CourseProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    progress = models.IntegerField(default=0)  # процент выполнения
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'course']

class CourseElement(models.Model):
    ELEMENT_TYPES = (
        ('text', 'Текстовый материал'),
        ('video', 'Видеоматериал'),
        ('test', 'Тестовое задание'),
        ('task', 'Практическое задание'),
    )

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='elements')
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=ELEMENT_TYPES)
    order = models.IntegerField(default=0)  # для сортировки элементов
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

class TextElement(models.Model):
    element = models.OneToOneField(CourseElement, on_delete=models.CASCADE, related_name='text_content')
    content = models.TextField()

class VideoElement(models.Model):
    element = models.OneToOneField(CourseElement, on_delete=models.CASCADE, related_name='video_content')
    video_url = models.URLField()
    description = models.TextField(blank=True)

class TestElement(models.Model):
    element = models.OneToOneField(CourseElement, on_delete=models.CASCADE, related_name='test_content')
    description = models.TextField()
    pass_threshold = models.IntegerField(default=70)  # процент для прохождения

class TestQuestion(models.Model):
    test = models.ForeignKey(TestElement, on_delete=models.CASCADE, related_name='questions')
    question = models.TextField()

class TestAnswer(models.Model):
    question = models.ForeignKey(TestQuestion, on_delete=models.CASCADE, related_name='answers')
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

class TaskElement(models.Model):
    element = models.OneToOneField(CourseElement, on_delete=models.CASCADE, related_name='task_content')
    description = models.TextField()
    deadline = models.IntegerField(default=7)  # дней на выполнение

# New model to track test results
class TestResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    test = models.ForeignKey(TestElement, on_delete=models.CASCADE, related_name='results')
    score = models.IntegerField()
    passed = models.BooleanField()
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'test']
