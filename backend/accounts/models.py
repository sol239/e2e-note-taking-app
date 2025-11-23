from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    """
    Custom user manager for email-based authentication.

    Handles creation of regular users and superusers with email as the
    primary identifier instead of username.
    """

    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular user with the given email and password.

        Args:
            email (str): User's email address
            password (str): User's password (will be hashed)
            **extra_fields: Additional fields (nickname, E2E encryption fields, etc.)

        Returns:
            User: The created user instance

        Raises:
            ValueError: If email is not provided
        """
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Create and save a superuser with the given email and password.

        Args:
            email (str): Superuser's email address
            password (str): Superuser's password (will be hashed)
            **extra_fields: Additional fields

        Returns:
            User: The created superuser instance

        Raises:
            ValueError: If is_staff or is_superuser is not True
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model with email-based authentication and E2E encryption support.

    Fields:
        email: Primary identifier and login credential
        nickname: Display name for the user
        first_name, last_name: User's full name (optional)
        is_active, is_staff: User permissions
        totp_secret, totp_enabled: Two-factor authentication fields
        recovery_keys: JSON-encoded list of backup recovery codes
        encrypted_master_key: User's encrypted E2E encryption master key
        master_key_nonce: Nonce/IV used for master key encryption
        master_key_salt: Salt used for key derivation
        argon_time, argon_memory: KDF parameters for master key decryption
    """

    email = models.EmailField(unique=True)
    nickname = models.CharField(max_length=30, blank=True, null=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    totp_secret = models.CharField(max_length=64, blank=True, null=True)
    totp_enabled = models.BooleanField(default=False)
    recovery_keys = models.TextField(blank=True, null=True) # Stored as JSON list

    # E2E Encryption fields
    encrypted_master_key = models.TextField(blank=True, null=True)
    master_key_nonce = models.CharField(max_length=64, blank=True, null=True) # Base64 encoded
    master_key_salt = models.CharField(max_length=64, blank=True, null=True) # Base64 encoded
    argon_time = models.IntegerField(default=4)
    argon_memory = models.IntegerField(default=32768)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()
