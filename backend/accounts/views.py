from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from accounts.models import User
from .serializers import UserSerializer, UpdateUserSerializer

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """
    Register a new user account.

    Create a new user with email and password, and return an authentication token.
    """
    email = request.data.get('email')
    password = request.data.get('password')
    nickname = request.data.get('nickname')
    if not email or not password:
        return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(email=email, password=password, nickname=nickname)
    token, created = Token.objects.get_or_create(user=user)
    return Response({'token': token.key}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def user_detail(request):
    """
    Retrieve and update the current authenticated user. PATCH allows updating the nickname.
    """
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    if request.method == 'PATCH':
        serializer = UpdateUserSerializer(data=request.data)
        if serializer.is_valid():
            if 'nickname' in serializer.validated_data:
                request.user.nickname = serializer.validated_data.get('nickname')
            if 'email' in serializer.validated_data:
                request.user.email = serializer.validated_data.get('email')
            request.user.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Authenticate user and return token.

    Login with email and password to receive an authentication token for API access.
    """
    email = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(request, username=email, password=password)
    if user is not None:
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
