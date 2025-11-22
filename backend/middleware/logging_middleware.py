import json
from django.utils.deprecation import MiddlewareMixin
from utils.backend_hub import backend_hub


class LoggingMiddleware(MiddlewareMixin):
    """Middleware to log all API requests and responses"""
    
    def process_request(self, request):
        """Log incoming request"""
        # Get request data
        data = None
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if request.content_type == 'application/json':
                    data = json.loads(request.body.decode('utf-8'))
                else:
                    data = dict(request.POST)
            except Exception:
                pass
        
        # Get user
        user = None
        if hasattr(request, 'user') and request.user.is_authenticated:
            user = str(request.user.email if hasattr(request.user, 'email') else request.user)
        
        # Log the request
        backend_hub.log_request(
            method=request.method,
            path=request.path,
            user=user,
            data=data
        )
        
        return None
    
    def process_response(self, request, response):
        """Log outgoing response"""
        # Log the response
        backend_hub.log_response(
            method=request.method,
            path=request.path,
            status=response.status_code,
            data=None  # We don't log response data to keep logs clean
        )
        
        return response
    
    def process_exception(self, request, exception):
        """Log exceptions"""
        backend_hub.log_error(
            method=request.method,
            path=request.path,
            error=exception
        )
        
        return None
