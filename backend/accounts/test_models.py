"""
Unit tests for accounts models.

Tests for User model and UserManager including user creation,
authentication, and field validations.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from accounts.models import User

class UserManagerTests(TestCase):
    """Test cases for UserManager."""

    def test_create_user(self):
        """Test creating a regular user."""
        User = get_user_model()
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_with_nickname(self):
        """Test creating a user with a nickname."""
        User = get_user_model()
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            nickname='TestUser'
        )
        self.assertEqual(user.nickname, 'TestUser')

    def test_create_user_with_e2e_fields(self):
        """Test creating a user with E2E encryption fields."""
        User = get_user_model()
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            encrypted_master_key='encrypted_key_data',
            master_key_nonce='nonce_data',
            master_key_salt='salt_data',
            argon_time=4,
            argon_memory=32768
        )
        self.assertEqual(user.encrypted_master_key, 'encrypted_key_data')
        self.assertEqual(user.master_key_nonce, 'nonce_data')
        self.assertEqual(user.master_key_salt, 'salt_data')
        self.assertEqual(user.argon_time, 4)
        self.assertEqual(user.argon_memory, 32768)

    def test_create_user_without_email_raises_error(self):
        """Test that creating a user without email raises ValueError."""
        User = get_user_model()
        with self.assertRaises(ValueError) as context:
            User.objects.create_user(email='', password='testpass123')
        self.assertIn('The Email must be set', str(context.exception))

    def test_create_superuser(self):
        """Test creating a superuser."""
        User = get_user_model()
        admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)

    def test_create_superuser_without_is_staff_raises_error(self):
        """Test that creating a superuser with is_staff=False raises ValueError."""
        User = get_user_model()
        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(
                email='admin@example.com',
                password='adminpass123',
                is_staff=False
            )
        self.assertIn('Superuser must have is_staff=True', str(context.exception))

    def test_create_superuser_without_is_superuser_raises_error(self):
        """Test that creating a superuser with is_superuser=False raises ValueError."""
        User = get_user_model()
        with self.assertRaises(ValueError) as context:
            User.objects.create_superuser(
                email='admin@example.com',
                password='adminpass123',
                is_superuser=False
            )
        self.assertIn('Superuser must have is_superuser=True', str(context.exception))

    def test_email_normalization(self):
        """Test that email addresses are normalized."""
        User = get_user_model()
        user = User.objects.create_user(
            email='test@EXAMPLE.COM',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')


class UserModelTests(TestCase):
    """Test cases for User model."""

    def setUp(self):
        """Set up test user."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            nickname='TestUser'
        )

    def test_user_str_representation(self):
        """Test the string representation of a user (uses email)."""
        # The default __str__ for AbstractBaseUser returns the username field value
        self.assertEqual(str(self.user), 'test@example.com')

    def test_user_has_usable_password(self):
        """Test that user password is properly hashed."""
        self.assertTrue(self.user.has_usable_password())
        self.assertNotEqual(self.user.password, 'testpass123')

    def test_totp_fields_default_values(self):
        """Test TOTP fields have correct default values."""
        self.assertIsNone(self.user.totp_secret)
        self.assertFalse(self.user.totp_enabled)
        self.assertIsNone(self.user.recovery_keys)

    def test_e2e_fields_default_values(self):
        """Test E2E encryption fields have correct default values."""
        self.assertIsNone(self.user.encrypted_master_key)
        self.assertIsNone(self.user.master_key_nonce)
        self.assertIsNone(self.user.master_key_salt)
        self.assertEqual(self.user.argon_time, 4)
        self.assertEqual(self.user.argon_memory, 32768)

    def test_username_field_is_email(self):
        """Test that email is used as the username field."""
        self.assertEqual(User.USERNAME_FIELD, 'email')

    def test_required_fields_is_empty(self):
        """Test that no additional required fields are set."""
        self.assertEqual(User.REQUIRED_FIELDS, [])

    def test_user_permissions_inheritance(self):
        """Test that User inherits from PermissionsMixin."""
        self.assertTrue(hasattr(self.user, 'is_superuser'))
        self.assertTrue(hasattr(self.user, 'groups'))
        self.assertTrue(hasattr(self.user, 'user_permissions'))
