from pymongo import MongoClient, ASCENDING
from django.conf import settings

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        _client = MongoClient(settings.MONGO_URI)
        _db = _client[settings.MONGO_DB_NAME]
        _setup_indexes(_db)
    return _db


def _setup_indexes(db):
    db.urls.create_index("short_code", unique=True)
    db.urls.create_index("created_at")
    db.clicks.create_index([("short_code", ASCENDING), ("clicked_at", ASCENDING)])
    db.clicks.create_index("clicked_at")
