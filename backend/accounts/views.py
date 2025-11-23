from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from accounts.models import User
from .serializers import UserSerializer, UpdateUserSerializer
import pyotp
import base64
import qrcode
import io
import json
import random
import string
from django.core.cache import cache
from notes.models import NotebookUserConnector

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

    # E2E Encryption fields
    encrypted_master_key = request.data.get('encrypted_master_key')
    master_key_nonce = request.data.get('master_key_nonce')
    master_key_salt = request.data.get('master_key_salt')
    argon_time = request.data.get('argon_time', 4)
    argon_memory = request.data.get('argon_memory', 32768)

    if not email or not password:
        return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(
        email=email, 
        password=password, 
        nickname=nickname,
        encrypted_master_key=encrypted_master_key,
        master_key_nonce=master_key_nonce,
        master_key_salt=master_key_salt,
        argon_time=argon_time,
        argon_memory=argon_memory
    )
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
        if user.totp_enabled:
            temp_token = pyotp.random_base32()
            cache.set(f"tfa_{temp_token}", user.id, timeout=300) # 5 minutes
            return Response({
                "tfa_required": True,
                "temp_token": temp_token
            })

        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'tfa_required': False})
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def tfa_setup(request):
    """
    Initialize two-factor authentication for the user.

    Generates a TOTP secret, recovery keys, and QR code for the user.
    The user must verify the setup using tfa_enable endpoint.

    Returns:
        - secret: TOTP secret key
        - qr: Base64-encoded QR code image
        - uri: TOTP URI for manual entry
        - recovery_keys: List of 5 backup recovery keys
    """
    user = request.user
    secret = pyotp.random_base32()
    user.totp_secret = secret
    
    # Generate recovery keys
    recovery_keys = [''.join(random.choices(string.ascii_uppercase + string.digits, k=10)) for _ in range(5)]
    user.recovery_keys = json.dumps(recovery_keys)
    
    user.save()

    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user.email,
        issuer_name="E2E Notes App"
    )

    qr_buffer = io.BytesIO()
    qrcode.make(totp_uri).save(qr_buffer, format='PNG')
    qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode()

    return Response({
        "secret": secret,
        "qr": qr_base64,
        "uri": totp_uri,
        "recovery_keys": recovery_keys
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def tfa_enable(request):
    """
    Enable two-factor authentication after setup.

    Verifies the TOTP code to ensure the user has correctly configured their
    authenticator app before enabling 2FA.

    Request Body:
        code (str): 6-digit TOTP code from authenticator app

    Returns:
        Success message if code is valid, error otherwise.
    """
    user = request.user
    code = request.data.get("code")

    if not user.totp_secret:
        return Response({"error": "TFA not initialized"}, status=400)

    totp = pyotp.TOTP(user.totp_secret)

    if totp.verify(code):
        user.totp_enabled = True
        user.save()
        return Response({"status": "TFA enabled"})
    else:
        return Response({"error": "Invalid code"}, status=400)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def tfa_disable(request):
    """
    Disable two-factor authentication for the user.

    Removes TOTP secret, disables 2FA, and deletes recovery keys.
    User will no longer be prompted for 2FA codes during login.

    Returns:
        Success message confirming 2FA has been disabled.
    """
    user = request.user
    user.totp_enabled = False
    user.totp_secret = None
    user.recovery_keys = None
    user.save()
    return Response({"status": "TFA disabled"})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def tfa_verify(request):
    """
    Verify two-factor authentication code during login.

    Accepts either a 6-digit TOTP code or a recovery key.
    If a recovery key is used, 2FA is automatically disabled.

    Request Body:
        temp_token (str): Temporary session token from login
        code (str): TOTP code or recovery key

    Returns:
        Authentication token if verification succeeds.
    """
    temp_token = request.data.get("temp_token")
    code = request.data.get("code")

    user_id = cache.get(f"tfa_{temp_token}")

    if not user_id:
        return Response({"error": "Session expired or invalid"}, status=400)

    user = User.objects.get(id=user_id)
    
    # Check if code is a recovery key
    recovery_keys = []
    if user.recovery_keys:
        try:
            recovery_keys = json.loads(user.recovery_keys)
        except:
            pass
            
    if code in recovery_keys:
        # Recovery key used
        user.totp_enabled = False
        user.totp_secret = None
        user.recovery_keys = None
        user.save()
        
        cache.delete(f"tfa_{temp_token}")
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "tfa_required": False,
            "message": "Recovery key used. 2FA has been disabled."
        })

    totp = pyotp.TOTP(user.totp_secret)

    if not totp.verify(code, valid_window=1):
        return Response({"error": "Invalid TOTP"}, status=400)

    cache.delete(f"tfa_{temp_token}")
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "token": token.key,
        "tfa_required": False
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_encrypted_master(request):
    """
    Retrieve the encrypted master key and related parameters for the authenticated user.

    Returns the encrypted master key bundle needed for client-side decryption:
    - encrypted_master_key: Base64-encoded encrypted master key
    - nonce: Encryption nonce/IV
    - salt: Key derivation salt
    - argon_time: Argon2 time parameter
    - argon_memory: Argon2 memory parameter (also used for PBKDF2 iterations)

    Used by the frontend to decrypt the master key using the user's password.
    """
    user = request.user
    return Response({
        'encrypted_master_key': user.encrypted_master_key,
        'nonce': user.master_key_nonce,
        'salt': user.master_key_salt,
        'argon_time': user.argon_time,
        'argon_memory': user.argon_memory,
    })

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_user(request):
    """
    Delete the authenticated user account and all associated data.
    """
    user = request.user
    # Get all notebooks for this user
    user_connectors = list(NotebookUserConnector.objects.filter(user=user))
    for connector in user_connectors:
        notebook = connector.notebook
        # Check if this notebook has other users
        other_users_count = NotebookUserConnector.objects.filter(notebook=notebook).exclude(user=user).count()
        if other_users_count == 0:
            notebook.delete()
    
    user.delete()
    return Response({'message': 'Account deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """
    Change user password and update encrypted master key.
    """
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    # E2E Encryption fields
    encrypted_master_key = request.data.get('encrypted_master_key')
    master_key_nonce = request.data.get('master_key_nonce')
    master_key_salt = request.data.get('master_key_salt')
    argon_time = request.data.get('argon_time')
    argon_memory = request.data.get('argon_memory')

    if not new_password or not encrypted_master_key:
        return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

    # Verify old password if provided (optional but recommended)
    if old_password and not user.check_password(old_password):
        return Response({'error': 'Invalid old password'}, status=status.HTTP_400_BAD_REQUEST)

    # Update password
    user.set_password(new_password)
    
    # Update E2E fields
    user.encrypted_master_key = encrypted_master_key
    user.master_key_nonce = master_key_nonce
    user.master_key_salt = master_key_salt
    if argon_time:
        user.argon_time = argon_time
    if argon_memory:
        user.argon_memory = argon_memory
        
    user.save()
    
    return Response({'message': 'Password changed successfully'})
