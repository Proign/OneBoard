from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from . import views

# Удалим app_name = 'onboarding', так как это создает конфликт
router = DefaultRouter()
router.register(r'courses', views.CourseViewSet, basename='course')

courses_router = routers.NestedDefaultRouter(router, r'courses', lookup='course')
courses_router.register(r'elements', views.CourseElementViewSet, basename='course-elements')

# Разделим URL-паттерны для API и веб-страниц
api_urlpatterns = [
    path('', include(router.urls)),
    path('', include(courses_router.urls)),
]

web_urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('course/', views.course_view, name='course'),
]

# Основные URL-паттерны теперь пустые, они будут определены в основном urls.py
urlpatterns = []
