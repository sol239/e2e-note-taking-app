"""
Unit tests for notes serializers.

Tests for NotebookSerializer, BlockSerializer, NotebookUserConnectorSerializer,
and BlockNotebookConnectorSerializer including validation and data serialization.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from notes.models import Notebook, Block, NotebookUserConnector, BlockNotebookConnector
from notes.serializers import (
    NotebookSerializer,
    BlockSerializer,
    NotebookUserConnectorSerializer,
    BlockNotebookConnectorSerializer
)
import uuid

User = get_user_model()


class NotebookSerializerTests(TestCase):
    """Test cases for NotebookSerializer."""

    def test_notebook_serializer_contains_expected_fields(self):
        """Test that NotebookSerializer contains expected fields."""
        notebook = Notebook.objects.create(name='Test Notebook')
        serializer = NotebookSerializer(instance=notebook)
        data = serializer.data
        self.assertEqual(set(data.keys()), {'id', 'name'})

    def test_notebook_serializer_field_content(self):
        """Test NotebookSerializer field content."""
        notebook = Notebook.objects.create(name='My Notebook')
        serializer = NotebookSerializer(instance=notebook)
        data = serializer.data
        self.assertEqual(data['name'], 'My Notebook')
        self.assertEqual(str(notebook.id), data['id'])

    def test_notebook_serializer_id_is_read_only(self):
        """Test that id field is read-only."""
        serializer = NotebookSerializer()
        self.assertTrue(serializer.fields['id'].read_only)

    def test_create_notebook_via_serializer(self):
        """Test creating a notebook through the serializer."""
        data = {'name': 'New Notebook'}
        serializer = NotebookSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        notebook = serializer.save()
        self.assertEqual(notebook.name, 'New Notebook')
        self.assertIsInstance(notebook.id, uuid.UUID)

    def test_update_notebook_via_serializer(self):
        """Test updating a notebook through the serializer."""
        notebook = Notebook.objects.create(name='Old Name')
        data = {'name': 'Updated Name'}
        serializer = NotebookSerializer(instance=notebook, data=data)
        self.assertTrue(serializer.is_valid())
        updated_notebook = serializer.save()
        self.assertEqual(updated_notebook.name, 'Updated Name')


class BlockSerializerTests(TestCase):
    """Test cases for BlockSerializer."""

    def test_block_serializer_contains_expected_fields(self):
        """Test that BlockSerializer contains expected fields."""
        block = Block.objects.create(type='paragraph', content='Test')
        serializer = BlockSerializer(instance=block)
        data = serializer.data
        self.assertEqual(set(data.keys()), {'id', 'type', 'content', 'metadata', 'settings'})

    def test_block_serializer_field_content(self):
        """Test BlockSerializer field content."""
        metadata = {'language': 'python'}
        settings = {'styling': {'fontSize': 14}}
        block = Block.objects.create(
            type='code',
            content='print("hello")',
            metadata=metadata,
            settings=settings
        )
        serializer = BlockSerializer(instance=block)
        data = serializer.data
        self.assertEqual(data['type'], 'code')
        self.assertEqual(data['content'], 'print("hello")')
        self.assertEqual(data['metadata'], metadata)
        self.assertEqual(data['settings'], settings)

    def test_block_serializer_id_is_optional(self):
        """Test that id field is not required for creation."""
        serializer = BlockSerializer()
        self.assertFalse(serializer.fields['id'].required)

    def test_create_block_via_serializer(self):
        """Test creating a block through the serializer."""
        data = {
            'type': 'paragraph',
            'content': 'New content',
            'metadata': {},
            'settings': {}
        }
        serializer = BlockSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        block = serializer.save()
        self.assertEqual(block.type, 'paragraph')
        self.assertEqual(block.content, 'New content')

    def test_create_block_with_metadata(self):
        """Test creating a block with metadata through serializer."""
        data = {
            'type': 'code',
            'content': 'console.log("test")',
            'metadata': {'language': 'javascript'},
            'settings': {}
        }
        serializer = BlockSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        block = serializer.save()
        self.assertEqual(block.metadata['language'], 'javascript')

    def test_update_block_via_serializer(self):
        """Test updating a block through the serializer."""
        block = Block.objects.create(type='paragraph', content='Old content')
        data = {
            'type': 'paragraph',
            'content': 'Updated content',
            'metadata': {},
            'settings': {}
        }
        serializer = BlockSerializer(instance=block, data=data)
        self.assertTrue(serializer.is_valid())
        updated_block = serializer.save()
        self.assertEqual(updated_block.content, 'Updated content')

    def test_block_serializer_null_metadata(self):
        """Test serializing block with null metadata."""
        block = Block.objects.create(type='paragraph', content='Text')
        serializer = BlockSerializer(instance=block)
        data = serializer.data
        self.assertIsNone(data['metadata'])

    def test_block_serializer_null_settings(self):
        """Test serializing block with null settings."""
        block = Block.objects.create(type='paragraph', content='Text')
        serializer = BlockSerializer(instance=block)
        data = serializer.data
        self.assertIsNone(data['settings'])


class NotebookUserConnectorSerializerTests(TestCase):
    """Test cases for NotebookUserConnectorSerializer."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.notebook = Notebook.objects.create(name='Test Notebook')

    def test_connector_serializer_contains_expected_fields(self):
        """Test that NotebookUserConnectorSerializer contains expected fields."""
        connector = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )
        serializer = NotebookUserConnectorSerializer(instance=connector)
        data = serializer.data
        self.assertEqual(set(data.keys()), {'notebook', 'last_opened'})

    def test_connector_serializer_nested_notebook(self):
        """Test that notebook is nested in the serializer."""
        connector = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )
        serializer = NotebookUserConnectorSerializer(instance=connector)
        data = serializer.data
        self.assertIn('notebook', data)
        self.assertEqual(data['notebook']['name'], 'Test Notebook')
        self.assertEqual(data['notebook']['id'], str(self.notebook.id))

    def test_connector_serializer_last_opened_nullable(self):
        """Test that last_opened can be null."""
        connector = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )
        serializer = NotebookUserConnectorSerializer(instance=connector)
        data = serializer.data
        self.assertIsNone(data['last_opened'])


class BlockNotebookConnectorSerializerTests(TestCase):
    """Test cases for BlockNotebookConnectorSerializer."""

    def setUp(self):
        """Set up test data."""
        self.notebook = Notebook.objects.create(name='Test Notebook')
        self.block = Block.objects.create(
            type='paragraph',
            content='Test content'
        )

    def test_connector_serializer_contains_expected_fields(self):
        """Test that BlockNotebookConnectorSerializer contains expected fields."""
        connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook,
            position_id=1,
            position_order=2
        )
        serializer = BlockNotebookConnectorSerializer(instance=connector)
        data = serializer.data
        self.assertEqual(set(data.keys()), {'block', 'position_id', 'position_order'})

    def test_connector_serializer_nested_block(self):
        """Test that block is nested in the serializer."""
        connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook
        )
        serializer = BlockNotebookConnectorSerializer(instance=connector)
        data = serializer.data
        self.assertIn('block', data)
        self.assertEqual(data['block']['type'], 'paragraph')
        self.assertEqual(data['block']['content'], 'Test content')

    def test_connector_serializer_position_fields(self):
        """Test position fields in the serializer."""
        connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook,
            position_id=5,
            position_order=3
        )
        serializer = BlockNotebookConnectorSerializer(instance=connector)
        data = serializer.data
        self.assertEqual(data['position_id'], 5)
        self.assertEqual(data['position_order'], 3)

    def test_connector_serializer_default_positions(self):
        """Test default position values in the serializer."""
        connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook
        )
        serializer = BlockNotebookConnectorSerializer(instance=connector)
        data = serializer.data
        self.assertEqual(data['position_id'], 0)
        self.assertEqual(data['position_order'], 0)
