# MongoDB is used directly via PyMongo (no Django ORM models).
# See mongo.py for connection setup and services.py for document operations.
#
# URL Document Schema:
# {
#     "short_code": str,        # unique, indexed
#     "original_url": str,
#     "clicks": int,            # atomic $inc
#     "created_at": datetime,
#     "expires_at": datetime,   # optional
# }
#
# Click Document Schema:
# {
#     "short_code": str,        # indexed with clicked_at
#     "clicked_at": datetime,
#     "ip": str,
#     "user_agent": str,
#     "browser": str,
#     "os": str,
#     "device": str,
#     "referrer": str,
# }
