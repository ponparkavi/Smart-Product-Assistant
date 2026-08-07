from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.schemas.auth_schema import UserRegister, UserLogin, UserOut, Token
from app.services.user_service import UserService
from app.core.security import create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload["sub"]
    user = await UserService.get_user_by_id(user_id)
    return user

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister):
    user_dict = await UserService.create_user(user_in)
    access_token = create_access_token(user_dict["id"])
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin):
    user_dict = await UserService.authenticate_user(user_in.email, user_in.password)
    access_token = create_access_token(user_dict["id"])
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.get("/me", response_model=UserOut)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return current_user
