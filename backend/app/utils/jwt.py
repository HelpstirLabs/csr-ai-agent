from jose import jwt, JWTError
from app.core.config import settings

def verify_jwt(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("user_id")

        if not user_id:
            raise Exception("Invalid token")

        return user_id

    except JWTError:
        raise Exception("Invalid token")