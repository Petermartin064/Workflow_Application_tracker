import jwt
import datetime
from django.conf import settings
from ninja.security import HttpBearer

# Use a default secret key for JWT if not set in settings, but ideally use settings.SECRET_KEY
JWT_SECRET = getattr(settings, 'SECRET_KEY', 'default_jwt_secret_key')
JWT_ALGORITHM = 'HS256'

def create_access_token(user_id: int, username: str, is_superuser: bool) -> str:
    payload = {
        'user_id': user_id,
        'username': username,
        'role': 'Admin' if is_superuser else 'Applicant',
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
        'iat': datetime.datetime.now(datetime.timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

class AdminBearer(HttpBearer):
    def authenticate(self, request, token):
        payload = decode_access_token(token)
        if payload and payload.get('role') == 'Admin':
            return payload
        return None

class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        payload = decode_access_token(token)
        if payload:
            return payload
        return None
