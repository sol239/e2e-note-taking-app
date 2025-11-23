"""
Unit tests for notes models.

Tests for Notebook, Block, NotebookUserConnector, and BlockNotebookConnector models
including creation, relationships, and field validations.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from notes.models import Notebook, Block, NotebookUserConnector, BlockNotebookConnector
import uuid

User = get_user_model()


class NotebookModelTests(TestCase):
    """Test cases for Notebook model."""

    def test_create_notebook(self):
        """Test creating a notebook."""
        notebook = Notebook.objects.create(name='Test Notebook')
        self.assertEqual(notebook.name, 'Test Notebook')
        self.assertIsInstance(notebook.id, uuid.UUID)

    def test_notebook_str_representation(self):
        """Test the string representation of a notebook."""
        notebook = Notebook.objects.create(name='My Notebook')
        self.assertEqual(str(notebook), 'My Notebook')

    def test_notebook_id_is_uuid(self):
        """Test that notebook ID is automatically generated as UUID."""
        notebook = Notebook.objects.create(name='Test Notebook')
        self.assertIsInstance(notebook.id, uuid.UUID)

    def test_notebook_name_max_length(self):
        """Test notebook name max length."""
        # Max length is 255
        long_name = 'a' * 255
        notebook = Notebook.objects.create(name=long_name)
        self.assertEqual(len(notebook.name), 255)


class BlockModelTests(TestCase):
    """Test cases for Block model."""

    def test_create_block(self):
        """Test creating a block."""
        block = Block.objects.create(
            type='paragraph',
            content='Test content'
        )
        self.assertEqual(block.type, 'paragraph')
        self.assertEqual(block.content, 'Test content')
        self.assertIsInstance(block.id, uuid.UUID)

    def test_create_block_with_metadata(self):
        """Test creating a block with metadata."""
        metadata = {'language': 'python', 'theme': 'dark'}
        block = Block.objects.create(
            type='code',
            content='print("hello")',
            metadata=metadata
        )
        self.assertEqual(block.metadata, metadata)

    def test_create_block_with_settings(self):
        """Test creating a block with settings."""
        settings = {
            'styling': {
                'fontSize': 16,
                'textColor': '#000000'
            }
        }
        block = Block.objects.create(
            type='paragraph',
            content='Styled text',
            settings=settings
        )
        self.assertEqual(block.settings, settings)

    def test_block_str_representation(self):
        """Test the string representation of a block."""
        block = Block.objects.create(type='heading1', content='Title')
        expected = f"heading1 - {block.id}"
        self.assertEqual(str(block), expected)

    def test_block_empty_content(self):
        """Test creating a block with empty content."""
        block = Block.objects.create(type='paragraph', content='')
        self.assertEqual(block.content, '')

    def test_block_null_metadata(self):
        """Test creating a block with null metadata."""
        block = Block.objects.create(type='paragraph', content='Text')
        self.assertIsNone(block.metadata)

    def test_block_null_settings(self):
        """Test creating a block with null settings."""
        block = Block.objects.create(type='paragraph', content='Text')
        self.assertIsNone(block.settings)


class NotebookUserConnectorTests(TestCase):
    """Test cases for NotebookUserConnector model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.notebook = Notebook.objects.create(name='Test Notebook')

    def test_create_connector(self):
        """Test creating a notebook-user connector."""
        connector = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )
        self.assertEqual(connector.user, self.user)
        self.assertEqual(connector.notebook, self.notebook)

    def test_connector_str_representation(self):
        """Test the string representation of a connector."""
        connector = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )
        expected = f"{self.user.email} - {self.notebook.name}"
        self.assertEqual(str(connector), expected)

    def test_connector_unique_together(self):
        """Test that user-notebook combination is unique."""
        NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )
        # Attempting to create a duplicate should raise an error
        with self.assertRaises(Exception):
            NotebookUserConnector.objects.create(
                user=self.user,
                notebook=self.notebook
            )

    def test_connector_last_opened_nullable(self):
        """Test that last_opened can be null."""
        connector = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )
        self.assertIsNone(connector.last_opened)

    def test_connector_cascade_delete_user(self):
        """Test that connector is deleted when user is deleted."""
        connector = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )
        connector_id = connector.id
        self.user.delete()
        self.assertFalse(NotebookUserConnector.objects.filter(id=connector_id).exists())

    def test_connector_cascade_delete_notebook(self):
        """Test that connector is deleted when notebook is deleted."""
        connector = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )
        connector_id = connector.id
        self.notebook.delete()
        self.assertFalse(NotebookUserConnector.objects.filter(id=connector_id).exists())

    def test_multiple_users_same_notebook(self):
        """Test that multiple users can access the same notebook."""
        user2 = User.objects.create_user(
            email='test2@example.com',
            password='testpass123'
        )
        connector1 = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )
        connector2 = NotebookUserConnector.objects.create(
            user=user2,
            notebook=self.notebook
        )
        self.assertEqual(connector1.notebook, connector2.notebook)


class BlockNotebookConnectorTests(TestCase):
    """Test cases for BlockNotebookConnector model."""

    def setUp(self):
        """Set up test data."""
        self.notebook = Notebook.objects.create(name='Test Notebook')
        self.block = Block.objects.create(
            type='paragraph',
            content='Test content'
        )

    def test_create_connector(self):
        """Test creating a block-notebook connector."""
        connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook
        )
        self.assertEqual(connector.block, self.block)
        self.assertEqual(connector.notebook, self.notebook)

    def test_connector_default_positions(self):
        """Test default position values."""
        connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook
        )
        self.assertEqual(connector.position_id, 0)
        self.assertEqual(connector.position_order, 0)

    def test_connector_custom_positions(self):
        """Test creating connector with custom positions."""
        connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook,
            position_id=5,
            position_order=3
        )
        self.assertEqual(connector.position_id, 5)
        self.assertEqual(connector.position_order, 3)

    def test_connector_str_representation(self):
        """Test the string representation of a connector."""
        connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook
        )
        expected = f"{self.block.id} - {self.notebook.name}"
        self.assertEqual(str(connector), expected)

    def test_connector_unique_together(self):
        """Test that block-notebook combination is unique."""
        BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook
        )
        # Attempting to create a duplicate should raise an error
        with self.assertRaises(Exception):
            BlockNotebookConnector.objects.create(
                block=self.block,
                notebook=self.notebook
            )

    def test_connector_cascade_delete_block(self):
        """Test that connector is deleted when block is deleted."""
        connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook
        )
        connector_id = connector.id
        self.block.delete()
        self.assertFalse(BlockNotebookConnector.objects.filter(id=connector_id).exists())

    def test_connector_cascade_delete_notebook(self):
        """Test that connector is deleted when notebook is deleted."""
        connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook
        )
        connector_id = connector.id
        self.notebook.delete()
        self.assertFalse(BlockNotebookConnector.objects.filter(id=connector_id).exists())

    def test_multiple_blocks_same_notebook(self):
        """Test that multiple blocks can belong to the same notebook."""
        block2 = Block.objects.create(type='heading1', content='Title')
        connector1 = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook,
            position_order=0
        )
        connector2 = BlockNotebookConnector.objects.create(
            block=block2,
            notebook=self.notebook,
            position_order=1
        )
        self.assertEqual(connector1.notebook, connector2.notebook)
        self.assertNotEqual(connector1.block, connector2.block)
