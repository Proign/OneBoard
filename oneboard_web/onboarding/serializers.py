from rest_framework import serializers
from .models import Course, CourseProgress, CourseElement, TextElement, VideoElement, TestElement, TaskElement

class CourseSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'image', 'status', 'created_at', 'progress']
        read_only_fields = ['created_at']

    def get_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = CourseProgress.objects.filter(
                user=request.user,
                course=obj
            ).first()
            return progress.progress if progress else 0
        return 0

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Если изображение не предоставлено в validated_data, 
        # оставляем существующее изображение нетронутым
        if 'image' not in validated_data:
            validated_data.pop('image', None)
        return super().update(instance, validated_data)

class TextElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextElement
        fields = ['content']

    def to_representation(self, instance):
        return {
            'content': instance.content
        }

class VideoElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoElement
        fields = ['video_url', 'description']

class TestElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestElement
        fields = ['description', 'pass_threshold']

class TaskElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskElement
        fields = ['description', 'deadline']

class CourseElementSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()

    class Meta:
        model = CourseElement
        fields = ['id', 'title', 'type', 'order', 'content']
        read_only_fields = ['course']

    def get_content(self, obj):
        if obj.type == 'text':
            return TextElementSerializer(obj.text_content).data
        elif obj.type == 'video':
            return VideoElementSerializer(obj.video_content).data
        elif obj.type == 'test':
            return TestElementSerializer(obj.test_content).data
        elif obj.type == 'task':
            return TaskElementSerializer(obj.task_content).data
        return None

    def update(self, instance, validated_data):
        # Обновляем базовые поля элемента
        instance.title = validated_data.get('title', instance.title)
        instance.save()

        # Получаем данные контента из контекста
        content_data = self.context.get('content_data', {}).get('content', {})

        # Обновляем специфичный контент в зависимости от типа
        if instance.type == 'text':
            text_content = instance.text_content
            text_content.content = content_data.get('content', text_content.content)
            text_content.save()
        elif instance.type == 'video':
            video_content = instance.video_content
            video_content.video_url = content_data.get('video_url', video_content.video_url)
            video_content.description = content_data.get('description', video_content.description)
            video_content.save()
        # Добавьте обработку других типов по необходимости

        return instance

    def create(self, validated_data):
        element_type = validated_data.get('type')
        content_data = self.context.get('content_data', {})
        
        # Создаем базовый элемент
        element = CourseElement.objects.create(**validated_data)
        
        if element_type == 'text':
            content = content_data.get('content', {}).get('content', '')
            TextElement.objects.create(
                element=element,
                content=content
            )
        elif element_type == 'video':
            VideoElement.objects.create(
                element=element,
                video_url=content_data.get('video_url', ''),
                description=content_data.get('description', '')
            )
        elif element_type == 'test':
            TestElement.objects.create(
                element=element,
                description=content_data.get('description', '')
            )
        elif element_type == 'task':
            TaskElement.objects.create(
                element=element,
                description=content_data.get('description', '')
            )
        
        return element
