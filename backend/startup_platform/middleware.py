from django.utils.deprecation import MiddlewareMixin

class CorsOptionsMiddleware(MiddlewareMixin):
    """
    Handle OPTIONS requests for CORS preflight
    """
    def process_request(self, request):
        if request.method == "OPTIONS":
            from django.http import HttpResponse
            response = HttpResponse()
            response["Access-Control-Allow-Origin"] = request.META.get("HTTP_ORIGIN", "*")
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response["Access-Control-Max-Age"] = "86400"
            return response
        return None