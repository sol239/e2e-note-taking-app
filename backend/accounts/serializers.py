from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'nickname', 'totp_enabled')
        read_only_fields = ('email', 'totp_enabled')

class UpdateUserSerializer(serializers.Serializer):
    nickname = serializers.CharField(max_length=30, allow_blank=True, required=False)
    email = serializers.EmailField(required=False)
