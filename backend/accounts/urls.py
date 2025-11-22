from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('user/', views.user_detail, name='user-detail'),
    path('tfa/setup/', views.tfa_setup, name='tfa-setup'),
    path('tfa/enable/', views.tfa_enable, name='tfa-enable'),
    path('tfa/disable/', views.tfa_disable, name='tfa-disable'),
    path('tfa/verify/', views.tfa_verify, name='tfa-verify'),
]