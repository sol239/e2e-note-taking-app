from django.urls import path
from . import views

urlpatterns = [
    path('notebooks/', views.notebook_list_create, name='notebook-list-create'),
    path('notebooks/<uuid:notebook_id>/', views.notebook_detail, name='notebook-detail'),
    path('notebooks/<uuid:notebook_id>/blocks/', views.block_list_create, name='block-list-create'),
    path('notebooks/<uuid:notebook_id>/blocks/<uuid:block_id>/', views.block_detail, name='block-detail'),
]