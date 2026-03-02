from django.urls import path
from . import views

urlpatterns = [
    path("shorten/", views.shorten_url),
    path("urls/", views.list_urls),
    path("urls/<str:code>/analytics/", views.url_analytics),
    path("urls/<str:code>/qr/", views.qr_code),
    path("urls/<str:code>/", views.delete_url),
]
