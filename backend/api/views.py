from datetime import datetime, timezone

from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import services


@api_view(["POST"])
def shorten_url(request):
    original_url = request.data.get("url", "").strip()
    if not original_url:
        return Response({"error": "URL is required"}, status=status.HTTP_400_BAD_REQUEST)

    if not original_url.startswith(("http://", "https://")):
        original_url = "https://" + original_url

    custom_alias = request.data.get("custom_alias", "").strip() or None
    expires_at = request.data.get("expires_at")
    if expires_at:
        try:
            expires_at = datetime.fromisoformat(expires_at).replace(tzinfo=timezone.utc)
        except ValueError:
            return Response({"error": "Invalid expires_at format"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        short_code = services.create_short_url(original_url, custom_alias, expires_at)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)

    return Response({
        "short_code": short_code,
        "short_url": f"{settings.BASE_URL}/{short_code}",
        "original_url": original_url,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def list_urls(request):
    urls = services.get_all_urls()
    for u in urls:
        u["short_url"] = f"{settings.BASE_URL}/{u['short_code']}"
        u["created_at"] = u["created_at"].isoformat()
        if u.get("expires_at"):
            u["expires_at"] = u["expires_at"].isoformat()
    return Response(urls)


@api_view(["GET"])
def url_analytics(request, code):
    data = services.get_url_analytics(code)
    if not data:
        return Response({"error": "URL not found"}, status=status.HTTP_404_NOT_FOUND)
    data["short_url"] = f"{settings.BASE_URL}/{data['short_code']}"
    data["created_at"] = data["created_at"].isoformat()
    return Response(data)


@api_view(["DELETE"])
def delete_url(request, code):
    if services.delete_url(code):
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response({"error": "URL not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def qr_code(request, code):
    from .mongo import get_db
    db = get_db()
    url_doc = db.urls.find_one({"short_code": code}, {"_id": 0, "original_url": 1})
    if not url_doc:
        return Response({"error": "URL not found"}, status=status.HTTP_404_NOT_FOUND)

    short_url = f"{settings.BASE_URL}/{code}"
    fill_color = request.query_params.get("fill", "black")
    back_color = request.query_params.get("bg", "white")
    style = request.query_params.get("style", "rounded")

    qr_base64 = services.generate_qr_code(short_url, fill_color, back_color, style)
    return Response({"qr_code": qr_base64, "short_url": short_url})


def redirect_view(request, code):
    meta = {
        "ip": request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", "")),
        "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        "referrer": request.META.get("HTTP_REFERER", ""),
    }
    original_url = services.resolve_and_track(code, meta)
    if not original_url:
        return HttpResponseRedirect(settings.BASE_URL)
    return HttpResponseRedirect(original_url)
