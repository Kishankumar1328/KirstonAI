from typing import Optional, Any, Dict

class AntigravityException(Exception):
    """Base exception for Antigravity application."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

class ResourceNotFoundException(AntigravityException):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} with id '{resource_id}' was not found.",
            code="RESOURCE_NOT_FOUND",
            status_code=404
        )

class UnauthorizedException(AntigravityException):
    def __init__(self, message: str = "Authentication credentials were not provided or are invalid."):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=401
        )

class ForbiddenException(AntigravityException):
    def __init__(self, message: str = "You do not have permission to access this resource."):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403
        )

class RateLimitException(AntigravityException):
    def __init__(self, message: str = "Rate limit exceeded. Please try again later."):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429
        )

class LLMProviderException(AntigravityException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"LLM Provider Error: {message}",
            code="LLM_ERROR",
            status_code=502,
            details=details
        )
