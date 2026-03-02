import base64
import io
import string
import threading
import time
from datetime import datetime, timezone

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer, CircleModuleDrawer, SquareModuleDrawer, GappedSquareModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from user_agents import parse as parse_ua

from .mongo import get_db

CHARSET = string.ascii_letters + string.digits  # Base62


def generate_short_code(length=6):
    """Generate a unique Base62 short code with collision detection."""
    db = get_db()
    for _ in range(10):
        # Use timestamp + counter for uniqueness
        ts = int(time.time() * 1000000)
        code = ""
        for _ in range(length):
            code += CHARSET[ts % 62]
            ts //= 62
        if not db.urls.find_one({"short_code": code}, {"_id": 1}):
            return code
    raise RuntimeError("Failed to generate unique short code after 10 attempts")


def create_short_url(original_url, custom_alias=None, expires_at=None):
    """Create a new shortened URL."""
    db = get_db()

    if custom_alias:
        if db.urls.find_one({"short_code": custom_alias}, {"_id": 1}):
            raise ValueError(f"Alias '{custom_alias}' is already taken")
        short_code = custom_alias
    else:
        short_code = generate_short_code()

    doc = {
        "short_code": short_code,
        "original_url": original_url,
        "created_at": datetime.now(timezone.utc),
        "clicks": 0,
    }
    if expires_at:
        doc["expires_at"] = expires_at

    db.urls.insert_one(doc)
    return short_code


def resolve_and_track(short_code, request_meta):
    """Resolve short code, atomically increment clicks, log analytics async."""
    db = get_db()
    doc = db.urls.find_one_and_update(
        {"short_code": short_code},
        {"$inc": {"clicks": 1}},
        projection={"original_url": 1, "expires_at": 1},
    )
    if not doc:
        return None

    if doc.get("expires_at") and doc["expires_at"] < datetime.now(timezone.utc):
        return None

    # Fire-and-forget analytics logging
    threading.Thread(
        target=_log_click,
        args=(short_code, request_meta),
        daemon=True,
    ).start()

    return doc["original_url"]


def _log_click(short_code, meta):
    """Log click details to the clicks collection (runs in background thread)."""
    db = get_db()
    ua = parse_ua(meta.get("user_agent", ""))
    db.clicks.insert_one({
        "short_code": short_code,
        "clicked_at": datetime.now(timezone.utc),
        "ip": meta.get("ip", ""),
        "user_agent": meta.get("user_agent", ""),
        "browser": ua.browser.family,
        "os": ua.os.family,
        "device": "Mobile" if ua.is_mobile else ("Tablet" if ua.is_tablet else "Desktop"),
        "referrer": meta.get("referrer", ""),
    })


def get_all_urls():
    """List all URLs sorted by newest first."""
    db = get_db()
    return list(db.urls.find(
        {},
        {"_id": 0, "short_code": 1, "original_url": 1, "clicks": 1, "created_at": 1, "expires_at": 1},
    ).sort("created_at", -1))


def get_url_analytics(short_code):
    """Get detailed analytics using MongoDB aggregation pipelines."""
    db = get_db()

    url_doc = db.urls.find_one(
        {"short_code": short_code},
        {"_id": 0, "short_code": 1, "original_url": 1, "clicks": 1, "created_at": 1},
    )
    if not url_doc:
        return None

    # Clicks per day
    clicks_per_day = list(db.clicks.aggregate([
        {"$match": {"short_code": short_code}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$clicked_at"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
        {"$limit": 30},
    ]))

    # Browser breakdown
    browsers = list(db.clicks.aggregate([
        {"$match": {"short_code": short_code}},
        {"$group": {"_id": "$browser", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]))

    # Device breakdown
    devices = list(db.clicks.aggregate([
        {"$match": {"short_code": short_code}},
        {"$group": {"_id": "$device", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]))

    # OS breakdown
    operating_systems = list(db.clicks.aggregate([
        {"$match": {"short_code": short_code}},
        {"$group": {"_id": "$os", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]))

    # Top referrers
    referrers = list(db.clicks.aggregate([
        {"$match": {"short_code": short_code, "referrer": {"$ne": ""}}},
        {"$group": {"_id": "$referrer", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]))

    return {
        **url_doc,
        "clicks_per_day": [{"date": c["_id"], "count": c["count"]} for c in clicks_per_day],
        "browsers": [{"name": b["_id"], "count": b["count"]} for b in browsers],
        "devices": [{"name": d["_id"], "count": d["count"]} for d in devices],
        "operating_systems": [{"name": o["_id"], "count": o["count"]} for o in operating_systems],
        "referrers": [{"name": r["_id"], "count": r["count"]} for r in referrers],
    }


def delete_url(short_code):
    """Delete a URL and its click data."""
    db = get_db()
    result = db.urls.delete_one({"short_code": short_code})
    if result.deleted_count:
        db.clicks.delete_many({"short_code": short_code})
        return True
    return False


MODULE_DRAWERS = {
    "square": SquareModuleDrawer,
    "rounded": RoundedModuleDrawer,
    "circle": CircleModuleDrawer,
    "gapped": GappedSquareModuleDrawer,
}


def generate_qr_code(url, fill_color="black", back_color="white", style="rounded"):
    """Generate a QR code and return as base64 PNG."""
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)

    drawer_cls = MODULE_DRAWERS.get(style, RoundedModuleDrawer)
    color_mask = SolidFillColorMask(
        back_color=_parse_color(back_color),
        front_color=_parse_color(fill_color),
    )

    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=drawer_cls(),
        color_mask=color_mask,
    )

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()


def _parse_color(color_str):
    """Parse hex color string to RGB tuple."""
    if color_str.startswith("#"):
        color_str = color_str[1:]
        if len(color_str) == 6:
            return tuple(int(color_str[i:i+2], 16) for i in (0, 2, 4))
    color_map = {"black": (0, 0, 0), "white": (255, 255, 255)}
    return color_map.get(color_str.lower(), (0, 0, 0))
