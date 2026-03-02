from django.urls import path, include
from django.http import JsonResponse


def home(request):
    return JsonResponse({
        "name": "URLKit API",
        "endpoints": {
            "shorten": "POST /api/shorten/",
            "list": "GET /api/urls/",
            "analytics": "GET /api/urls/<code>/analytics/",
            "qr_code": "GET /api/urls/<code>/qr/",
            "redirect": "GET /<code>/",
        }
    })


urlpatterns = [
    path("", home),
    path("api/", include("api.urls")),
    path("<str:code>/", include("api.redirect_urls")),
]
