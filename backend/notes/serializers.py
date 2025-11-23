"""
Serializers for the Notes API.

Defines DRF serializers for Notebook, Block, and their connector models,
handling JSON serialization/deserialization and validation.
"""

from rest_framework import serializers
from .models import Notebook, Block, NotebookUserConnector, BlockNotebookConnector

class NotebookSerializer(serializers.ModelSerializer):
    """
    Serializer for Notebook model.

    Serializes notebook data including ID and name.
    """
    class Meta:
        model = Notebook
        fields = ['id', 'name']
        extra_kwargs = {
            'id': {'read_only': True, 'help_text': 'Unique identifier for the notebook'},
            'name': {'help_text': 'Display name of the notebook'},
        }

class BlockSerializer(serializers.ModelSerializer):
    """
    Serializer for Block model.

    Handles serialization of block content, type, metadata, and settings.
    The ID field is optional to support both creation and updates.
    """

    id = serializers.UUIDField(required=False, help_text='Unique identifier for the block')

    class Meta:
        model = Block
        fields = ['id', 'type', 'content', 'metadata', 'settings']
        extra_kwargs = {
            'type': {'help_text': 'Type of block (text, image, code, etc.)'},
            'content': {'help_text': 'Main content of the block'},
            'metadata': {'help_text': 'Additional metadata for the block'},
            'settings': {'help_text': 'Block-specific settings and configuration'},
        }

class NotebookUserConnectorSerializer(serializers.ModelSerializer):
    """
    Serializer for NotebookUserConnector model.

    Includes nested notebook data and last_opened timestamp for
    recency-based sorting.
    """

    notebook = NotebookSerializer()

    class Meta:
        model = NotebookUserConnector
        fields = ['notebook', 'last_opened']

class BlockNotebookConnectorSerializer(serializers.ModelSerializer):
    """
    Serializer for BlockNotebookConnector model.

    Includes nested block data along with position information
    (position_id and position_order) for maintaining block order.
    """

    block = BlockSerializer()

    class Meta:
        model = BlockNotebookConnector
        fields = ['block', 'position_id', 'position_order']