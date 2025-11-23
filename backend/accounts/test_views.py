"""
Unit tests for accounts views.

Tests for registration, login, user management, two-factor authentication,
and account operations.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.core.cache import cache
from accounts.models import User
import json
import pyotp


class RegistrationTests(TestCase):
    """Test cases for user registration."""

    def setUp(self):
        """Set up test client."""
        self.client = APIClient()
        self.register_url = '/api/accounts/register/'

    def test_register_user_success(self):
        """Test successful user registration."""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'nickname': 'TestUser'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())

    def test_register_user_with_e2e_fields(self):
        """Test registration with E2E encryption fields."""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'encrypted_master_key': 'encrypted_key',
            'master_key_nonce': 'nonce',
            'master_key_salt': 'salt',
            'argon_time': 5,
            'argon_memory': 65536
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.encrypted_master_key, 'encrypted_key')
        self.assertEqual(user.argon_time, 5)
        self.assertEqual(user.argon_memory, 65536)

    def test_register_user_missing_email(self):
        """Test registration without email."""
        data = {'password': 'testpass123'}
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_register_user_missing_password(self):
        """Test registration without password."""
        data = {'email': 'test@example.com'}
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_register_duplicate_email(self):
        """Test registration with existing email."""
        User.objects.create_user(email='test@example.com', password='testpass123')
        data = {
            'email': 'test@example.com',
            'password': 'newpass123'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


class LoginTests(TestCase):
    """Test cases for user login."""

    def setUp(self):
        """Set up test client and user."""
        self.client = APIClient()
        self.login_url = '/api/accounts/login/'
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    def test_login_success(self):
        """Test successful login."""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['tfa_required'], False)

    def test_login_with_2fa_enabled(self):
        """Test login with 2FA enabled."""
        self.user.totp_enabled = True
        self.user.totp_secret = pyotp.random_base32()
        self.user.save()
        
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['tfa_required'], True)
        self.assertIn('temp_token', response.data)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpass'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_nonexistent_user(self):
        """Test login with non-existent user."""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserDetailTests(TestCase):
    """Test cases for user detail view."""

    def setUp(self):
        """Set up test client and authenticated user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            nickname='TestUser'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.detail_url = '/api/accounts/user/'

    def test_get_user_detail(self):
        """Test retrieving user details."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['nickname'], 'TestUser')

    def test_update_nickname(self):
        """Test updating user nickname."""
        data = {'nickname': 'NewNickname'}
        response = self.client.patch(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.nickname, 'NewNickname')

    def test_update_email(self):
        """Test updating user email."""
        data = {'email': 'newemail@example.com'}
        response = self.client.patch(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'newemail@example.com')

    def test_update_user_unauthenticated(self):
        """Test updating user without authentication."""
        self.client.credentials()  # Remove credentials
        data = {'nickname': 'NewNickname'}
        response = self.client.patch(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TwoFactorAuthTests(TestCase):
    """Test cases for two-factor authentication."""

    def setUp(self):
        """Set up test client and authenticated user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_tfa_setup(self):
        """Test setting up 2FA."""
        response = self.client.post('/api/accounts/tfa/setup/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('secret', response.data)
        self.assertIn('qr', response.data)
        self.assertIn('uri', response.data)
        self.assertIn('recovery_keys', response.data)
        self.assertEqual(len(response.data['recovery_keys']), 5)
        
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.totp_secret)
        self.assertIsNotNone(self.user.recovery_keys)

    def test_tfa_enable_valid_code(self):
        """Test enabling 2FA with valid TOTP code."""
        secret = pyotp.random_base32()
        self.user.totp_secret = secret
        self.user.save()
        
        totp = pyotp.TOTP(secret)
        code = totp.now()
        
        response = self.client.post('/api/accounts/tfa/enable/', {'code': code}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.totp_enabled)

    def test_tfa_enable_invalid_code(self):
        """Test enabling 2FA with invalid TOTP code."""
        self.user.totp_secret = pyotp.random_base32()
        self.user.save()
        
        response = self.client.post('/api/accounts/tfa/enable/', {'code': '000000'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        self.user.refresh_from_db()
        self.assertFalse(self.user.totp_enabled)

    def test_tfa_enable_without_setup(self):
        """Test enabling 2FA without setup."""
        response = self.client.post('/api/accounts/tfa/enable/', {'code': '123456'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tfa_disable(self):
        """Test disabling 2FA."""
        self.user.totp_enabled = True
        self.user.totp_secret = pyotp.random_base32()
        self.user.recovery_keys = json.dumps(['KEY1', 'KEY2'])
        self.user.save()
        
        response = self.client.post('/api/accounts/tfa/disable/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.user.refresh_from_db()
        self.assertFalse(self.user.totp_enabled)
        self.assertIsNone(self.user.totp_secret)
        self.assertIsNone(self.user.recovery_keys)

    def test_tfa_verify_valid_code(self):
        """Test verifying TOTP code during login."""
        secret = pyotp.random_base32()
        self.user.totp_enabled = True
        self.user.totp_secret = secret
        self.user.save()
        
        temp_token = 'test_temp_token'
        cache.set(f'tfa_{temp_token}', self.user.id, timeout=300)
        
        totp = pyotp.TOTP(secret)
        code = totp.now()
        
        # Remove authentication for this endpoint (it's AllowAny)
        self.client.credentials()
        response = self.client.post('/api/accounts/tfa/verify/', {
            'temp_token': temp_token,
            'code': code
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['tfa_required'], False)

    def test_tfa_verify_recovery_key(self):
        """Test verifying with recovery key."""
        secret = pyotp.random_base32()
        recovery_keys = ['RECOVERYKEY1', 'RECOVERYKEY2']
        self.user.totp_enabled = True
        self.user.totp_secret = secret
        self.user.recovery_keys = json.dumps(recovery_keys)
        self.user.save()
        
        temp_token = 'test_temp_token'
        cache.set(f'tfa_{temp_token}', self.user.id, timeout=300)
        
        self.client.credentials()
        response = self.client.post('/api/accounts/tfa/verify/', {
            'temp_token': temp_token,
            'code': 'RECOVERYKEY1'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        self.user.refresh_from_db()
        self.assertFalse(self.user.totp_enabled)

    def test_tfa_verify_expired_session(self):
        """Test verifying with expired temp token."""
        self.client.credentials()
        response = self.client.post('/api/accounts/tfa/verify/', {
            'temp_token': 'expired_token',
            'code': '123456'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EncryptedMasterKeyTests(TestCase):
    """Test cases for encrypted master key retrieval."""

    def setUp(self):
        """Set up test client and authenticated user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            encrypted_master_key='encrypted_key',
            master_key_nonce='nonce',
            master_key_salt='salt',
            argon_time=5,
            argon_memory=65536
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_get_encrypted_master_key(self):
        """Test retrieving encrypted master key."""
        response = self.client.get('/api/accounts/encrypted-master/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['encrypted_master_key'], 'encrypted_key')
        self.assertEqual(response.data['nonce'], 'nonce')
        self.assertEqual(response.data['salt'], 'salt')
        self.assertEqual(response.data['argon_time'], 5)
        self.assertEqual(response.data['argon_memory'], 65536)

    def test_get_encrypted_master_key_unauthenticated(self):
        """Test retrieving encrypted master key without authentication."""
        self.client.credentials()
        response = self.client.get('/api/accounts/encrypted-master/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ChangePasswordTests(TestCase):
    """Test cases for password change."""

    def setUp(self):
        """Set up test client and authenticated user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='oldpass123',
            encrypted_master_key='old_encrypted_key',
            master_key_nonce='old_nonce',
            master_key_salt='old_salt'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_change_password_success(self):
        """Test successful password change."""
        data = {
            'old_password': 'oldpass123',
            'new_password': 'newpass123',
            'encrypted_master_key': 'new_encrypted_key',
            'master_key_nonce': 'new_nonce',
            'master_key_salt': 'new_salt',
            'argon_time': 6,
            'argon_memory': 131072
        }
        response = self.client.post('/api/accounts/change-password/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass123'))
        self.assertEqual(self.user.encrypted_master_key, 'new_encrypted_key')
        self.assertEqual(self.user.argon_time, 6)
        self.assertEqual(self.user.argon_memory, 131072)

    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password."""
        data = {
            'old_password': 'wrongpass',
            'new_password': 'newpass123',
            'encrypted_master_key': 'new_encrypted_key',
            'master_key_nonce': 'new_nonce',
            'master_key_salt': 'new_salt'
        }
        response = self.client.post('/api/accounts/change-password/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_missing_fields(self):
        """Test password change with missing required fields."""
        data = {'new_password': 'newpass123'}
        response = self.client.post('/api/accounts/change-password/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DeleteUserTests(TestCase):
    """Test cases for user deletion."""

    def setUp(self):
        """Set up test client and authenticated user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_delete_user_success(self):
        """Test successful user deletion."""
        response = self.client.delete('/api/accounts/delete/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(email='test@example.com').exists())

    def test_delete_user_unauthenticated(self):
        """Test user deletion without authentication."""
        self.client.credentials()
        response = self.client.delete('/api/accounts/delete/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
