"""
Unit tests for accounts serializers.

Tests for UserSerializer and UpdateUserSerializer including
field validation and data serialization.
"""

from django.test import TestCase
from accounts.models import User
from accounts.serializers import UserSerializer, UpdateUserSerializer


class UserSerializerTests(TestCase):
    """Test cases for UserSerializer."""

    def setUp(self):
        """Set up test user."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            nickname='TestUser',
            first_name='Test',
            last_name='User'
        )

    def test_user_serializer_contains_expected_fields(self):
        """Test that UserSerializer contains expected fields."""
        serializer = UserSerializer(instance=self.user)
        data = serializer.data
        self.assertEqual(set(data.keys()), {'email', 'first_name', 'last_name', 'nickname', 'totp_enabled'})

    def test_user_serializer_field_content(self):
        """Test UserSerializer field content."""
        serializer = UserSerializer(instance=self.user)
        data = serializer.data
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(data['first_name'], 'Test')
        self.assertEqual(data['last_name'], 'User')
        self.assertEqual(data['nickname'], 'TestUser')
        self.assertEqual(data['totp_enabled'], False)

    def test_user_serializer_with_totp_enabled(self):
        """Test UserSerializer with TOTP enabled."""
        self.user.totp_enabled = True
        self.user.save()
        serializer = UserSerializer(instance=self.user)
        data = serializer.data
        self.assertEqual(data['totp_enabled'], True)

    def test_email_field_is_read_only(self):
        """Test that email field is read-only."""
        serializer = UserSerializer(instance=self.user)
        self.assertIn('email', serializer.fields)
        self.assertTrue(serializer.fields['email'].read_only)

    def test_totp_enabled_field_is_read_only(self):
        """Test that totp_enabled field is read-only."""
        serializer = UserSerializer(instance=self.user)
        self.assertIn('totp_enabled', serializer.fields)
        self.assertTrue(serializer.fields['totp_enabled'].read_only)


class UpdateUserSerializerTests(TestCase):
    """Test cases for UpdateUserSerializer."""

    def test_update_user_serializer_valid_nickname(self):
        """Test UpdateUserSerializer with valid nickname."""
        data = {'nickname': 'NewNickname'}
        serializer = UpdateUserSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['nickname'], 'NewNickname')

    def test_update_user_serializer_valid_email(self):
        """Test UpdateUserSerializer with valid email."""
        data = {'email': 'newemail@example.com'}
        serializer = UpdateUserSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['email'], 'newemail@example.com')

    def test_update_user_serializer_both_fields(self):
        """Test UpdateUserSerializer with both nickname and email."""
        data = {
            'nickname': 'NewNickname',
            'email': 'newemail@example.com'
        }
        serializer = UpdateUserSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['nickname'], 'NewNickname')
        self.assertEqual(serializer.validated_data['email'], 'newemail@example.com')

    def test_update_user_serializer_empty_data(self):
        """Test UpdateUserSerializer with empty data (should be valid as all fields are optional)."""
        data = {}
        serializer = UpdateUserSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_update_user_serializer_blank_nickname(self):
        """Test UpdateUserSerializer with blank nickname (should be valid)."""
        data = {'nickname': ''}
        serializer = UpdateUserSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['nickname'], '')

    def test_update_user_serializer_invalid_email(self):
        """Test UpdateUserSerializer with invalid email."""
        data = {'email': 'invalid-email'}
        serializer = UpdateUserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_update_user_serializer_nickname_max_length(self):
        """Test UpdateUserSerializer nickname max length validation."""
        data = {'nickname': 'a' * 31}  # Max length is 30
        serializer = UpdateUserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('nickname', serializer.errors)

    def test_update_user_serializer_nickname_exactly_30_chars(self):
        """Test UpdateUserSerializer with nickname exactly 30 characters."""
        data = {'nickname': 'a' * 30}
        serializer = UpdateUserSerializer(data=data)
        self.assertTrue(serializer.is_valid())
