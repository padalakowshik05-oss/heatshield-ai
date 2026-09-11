"""
HeatShield AI — Authentication Routes
======================================
Endpoints for user registration, login, token verification, and logout.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr, Field

from services.auth_service import (
    get_user_by_email,
    get_user_by_username,
    get_user_by_identifier,
    get_user_by_id,
    create_user,
    verify_password,
    create_access_token,
    decode_access_token,
)

router = APIRouter()


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================

class RegisterRequest(BaseModel):
    email: str = Field(..., description="Valid user email address")
    username: Optional[str] = Field(None, description="Alphanumeric username")
    full_name: str = Field(..., min_length=2, description="User full name")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")


class LoginRequest(BaseModel):
    username_or_email: str = Field(..., description="Email address or username")
    password: str = Field(..., description="Account password")
    remember_me: Optional[bool] = False


class UserProfile(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    role: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


# ============================================================
# DEPENDENCY: EXTRACT CURRENT AUTHENTICATED USER
# ============================================================

def get_current_user(authorization: Optional[str] = Header(None)) -> UserProfile:
    """Extract and validate Bearer JWT token from Authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization scheme. Use 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User associated with token no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserProfile(
        id=user["id"],
        email=user["email"],
        username=user["username"],
        full_name=user["full_name"],
        role=user["role"],
    )


# ============================================================
# ENDPOINTS
# ============================================================

@router.post("/register", response_model=AuthResponse)
@router.post("/signup", response_model=AuthResponse)
def register(req: RegisterRequest):
    """Register a new user account."""
    clean_email = req.email.strip().lower()
    if "@" not in clean_email or "." not in clean_email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Generate username from email if not provided
    username = req.username.strip().lower() if req.username else clean_email.split("@")[0]

    # Check for existing email
    if get_user_by_email(clean_email):
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists"
        )

    # Check for existing username
    if get_user_by_username(username):
        # Auto-suffix if clash
        username = f"{username}_{int(req.password[-2:], 16) if req.password[-2:].isalnum() else 1}"
        if get_user_by_username(username):
            raise HTTPException(
                status_code=400,
                detail="Username is already taken"
            )

    try:
        user = create_user(
            email=clean_email,
            username=username,
            full_name=req.full_name,
            password=req.password,
            role="officer"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    token = create_access_token({"sub": str(user["id"]), "email": user["email"]})

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            full_name=user["full_name"],
            role=user["role"]
        )
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    """Authenticate user with email or username and password."""
    identifier = req.username_or_email.strip()
    if not identifier or not req.password:
        raise HTTPException(status_code=400, detail="Email/Username and password are required")

    user = get_user_by_identifier(identifier)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email/username or password")

    if not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email/username or password")

    token = create_access_token({"sub": str(user["id"]), "email": user["email"]})

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile(
            id=user["id"],
            email=user["email"],
            username=user["username"],
            full_name=user["full_name"],
            role=user["role"]
        )
    )


@router.get("/me", response_model=UserProfile)
def get_me(current_user: UserProfile = Depends(get_current_user)):
    """Retrieve profile of the currently authenticated user."""
    return current_user


@router.post("/logout")
def logout(current_user: UserProfile = Depends(get_current_user)):
    """Acknowledge session logout."""
    return {
        "status": "success",
        "message": f"Successfully logged out user {current_user.email}"
    }
