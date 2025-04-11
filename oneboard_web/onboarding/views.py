from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Course, CourseProgress, CourseElement
from .serializers import CourseSerializer, CourseElementSerializer

# Create your views here.

def login_view(request):
    return render(request, 'onboarding/login.html')

def dashboard_view(request):
    return render(request, 'onboarding/dashboard.html')

def course_view(request):
    return render(request, 'onboarding/course.html')

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager']:
            return Course.objects.all()
        return Course.objects.filter(status='published')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class CourseElementViewSet(viewsets.ModelViewSet):
    serializer_class = CourseElementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CourseElement.objects.filter(course_id=self.kwargs['course_pk'])

    def perform_create(self, serializer):
        serializer.save(course_id=self.kwargs['course_pk'])

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Добавляем данные контента в контекст сериализатора
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
            context={'content_data': request.data}
        )
        
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def create(self, request, course_pk=None):
        serializer = self.get_serializer(
            data={**request.data, 'course': course_pk},
            context={'content_data': request.data}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def reorder(self, request, course_pk=None):
        elements = request.data.get('elements', [])
        for order, element_id in enumerate(elements):
            CourseElement.objects.filter(id=element_id, course_id=course_pk).update(order=order)
        return Response({'status': 'success'})
