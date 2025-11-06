from rest_framework import serializers
from .models import Notebook, Block, NotebookUserConnector, BlockNotebookConnector

class NotebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notebook
        fields = ['id', 'name']
        extra_kwargs = {
            'id': {'read_only': True, 'help_text': 'Unique identifier for the notebook'},
            'name': {'help_text': 'Display name of the notebook'},
        }

class BlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = ['id', 'type', 'content', 'metadata', 'settings']
        extra_kwargs = {
            'id': {'read_only': True, 'help_text': 'Unique identifier for the block'},
            'type': {'help_text': 'Type of block (text, image, code, etc.)'},
            'content': {'help_text': 'Main content of the block'},
            'metadata': {'help_text': 'Additional metadata for the block'},
            'settings': {'help_text': 'Block-specific settings and configuration'},
        }

class NotebookUserConnectorSerializer(serializers.ModelSerializer):
    notebook = NotebookSerializer()

    class Meta:
        model = NotebookUserConnector
        fields = ['notebook']

class BlockNotebookConnectorSerializer(serializers.ModelSerializer):
    block = BlockSerializer()

    class Meta:
        model = BlockNotebookConnector
        fields = ['block']