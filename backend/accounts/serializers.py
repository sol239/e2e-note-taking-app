from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'nickname')
        read_only_fields = ('email',)

class UpdateUserSerializer(serializers.Serializer):
    nickname = serializers.CharField(max_length=30, allow_blank=True, required=False)
    email = serializers.EmailField(required=False)
