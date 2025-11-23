"""
Unit tests for notes views.

Tests for notebook and block CRUD operations, import/export functionality,
and access control.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from notes.models import Notebook, Block, NotebookUserConnector, BlockNotebookConnector
import json
import io
import zipfile

User = get_user_model()


class NotebookListCreateTests(TestCase):
    """Test cases for notebook list and creation."""

    def setUp(self):
        """Set up test client and authenticated user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.list_create_url = '/api/notes/notebooks/'

    def test_list_notebooks(self):
        """Test listing user's notebooks."""
        notebook = Notebook.objects.create(name='Test Notebook')
        NotebookUserConnector.objects.create(user=self.user, notebook=notebook)
        
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['notebook']['name'], 'Test Notebook')

    def test_list_notebooks_empty(self):
        """Test listing notebooks when user has none."""
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_create_notebook(self):
        """Test creating a new notebook."""
        data = {'name': 'New Notebook'}
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Notebook')
        
        # Verify notebook is associated with user
        self.assertTrue(
            NotebookUserConnector.objects.filter(
                user=self.user,
                notebook__name='New Notebook'
            ).exists()
        )

    def test_create_notebook_creates_initial_block(self):
        """Test that creating a notebook also creates an initial heading block."""
        data = {'name': 'New Notebook'}
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        notebook = Notebook.objects.get(id=response.data['id'])
        blocks = BlockNotebookConnector.objects.filter(notebook=notebook)
        self.assertEqual(blocks.count(), 1)
        
        initial_block = blocks.first().block
        self.assertEqual(initial_block.type, 'heading1')
        self.assertEqual(initial_block.content, 'New Notebook')

    def test_list_notebooks_unauthenticated(self):
        """Test listing notebooks without authentication."""
        self.client.credentials()
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NotebookDetailTests(TestCase):
    """Test cases for notebook detail, update, and deletion."""

    def setUp(self):
        """Set up test client and authenticated user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        self.notebook = Notebook.objects.create(name='Test Notebook')
        self.connector = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )

    def test_get_notebook_detail(self):
        """Test retrieving notebook details."""
        url = f'/api/notes/notebooks/{self.notebook.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Notebook')

    def test_get_notebook_updates_last_opened(self):
        """Test that getting notebook details updates last_opened timestamp."""
        self.assertIsNone(self.connector.last_opened)
        url = f'/api/notes/notebooks/{self.notebook.id}/'
        self.client.get(url)
        
        self.connector.refresh_from_db()
        self.assertIsNotNone(self.connector.last_opened)

    def test_update_notebook(self):
        """Test updating notebook details."""
        url = f'/api/notes/notebooks/{self.notebook.id}/'
        data = {'name': 'Updated Notebook'}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.notebook.refresh_from_db()
        self.assertEqual(self.notebook.name, 'Updated Notebook')

    def test_delete_notebook(self):
        """Test deleting a notebook."""
        url = f'/api/notes/notebooks/{self.notebook.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notebook.objects.filter(id=self.notebook.id).exists())

    def test_access_other_users_notebook(self):
        """Test that user cannot access another user's notebook."""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123'
        )
        other_notebook = Notebook.objects.create(name='Other Notebook')
        NotebookUserConnector.objects.create(user=other_user, notebook=other_notebook)
        
        url = f'/api/notes/notebooks/{other_notebook.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class BlockListCreateTests(TestCase):
    """Test cases for block list and creation."""

    def setUp(self):
        """Set up test client, user, and notebook."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        self.notebook = Notebook.objects.create(name='Test Notebook')
        self.connector = NotebookUserConnector.objects.create(
            user=self.user,
            notebook=self.notebook
        )

    def test_list_blocks(self):
        """Test listing blocks in a notebook."""
        block = Block.objects.create(type='paragraph', content='Test content')
        BlockNotebookConnector.objects.create(block=block, notebook=self.notebook)
        
        url = f'/api/notes/notebooks/{self.notebook.id}/blocks/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['block']['content'], 'Test content')

    def test_list_blocks_updates_last_opened(self):
        """Test that listing blocks updates last_opened timestamp."""
        self.assertIsNone(self.connector.last_opened)
        url = f'/api/notes/notebooks/{self.notebook.id}/blocks/'
        self.client.get(url)
        
        self.connector.refresh_from_db()
        self.assertIsNotNone(self.connector.last_opened)

    def test_create_block(self):
        """Test creating a new block."""
        url = f'/api/notes/notebooks/{self.notebook.id}/blocks/'
        data = {
            'type': 'paragraph',
            'content': 'New content',
            'metadata': {},
            'settings': {},
            'position_id': 0,
            'position_order': 1
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'New content')
        
        # Verify block is associated with notebook
        self.assertTrue(
            BlockNotebookConnector.objects.filter(
                notebook=self.notebook,
                block__content='New content'
            ).exists()
        )

    def test_create_block_with_positions(self):
        """Test creating a block with specific positions."""
        url = f'/api/notes/notebooks/{self.notebook.id}/blocks/'
        data = {
            'type': 'code',
            'content': 'print("test")',
            'metadata': {'language': 'python'},
            'settings': {},
            'position_id': 5,
            'position_order': 3
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        connector = BlockNotebookConnector.objects.get(
            notebook=self.notebook,
            block__content='print("test")'
        )
        self.assertEqual(connector.position_id, 5)
        self.assertEqual(connector.position_order, 3)

    def test_list_blocks_for_nonexistent_notebook(self):
        """Test listing blocks for a notebook that doesn't exist."""
        url = '/api/notes/notebooks/00000000-0000-0000-0000-000000000000/blocks/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class BlockDetailTests(TestCase):
    """Test cases for block detail, update, and deletion."""

    def setUp(self):
        """Set up test client, user, notebook, and block."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        self.notebook = Notebook.objects.create(name='Test Notebook')
        NotebookUserConnector.objects.create(user=self.user, notebook=self.notebook)
        
        self.block = Block.objects.create(type='paragraph', content='Test content')
        self.block_connector = BlockNotebookConnector.objects.create(
            block=self.block,
            notebook=self.notebook,
            position_id=0,
            position_order=0
        )

    def test_get_block_detail(self):
        """Test retrieving block details."""
        url = f'/api/notes/notebooks/{self.notebook.id}/blocks/{self.block.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], 'Test content')

    def test_update_block(self):
        """Test updating block content."""
        url = f'/api/notes/notebooks/{self.notebook.id}/blocks/{self.block.id}/'
        data = {
            'type': 'paragraph',
            'content': 'Updated content',
            'metadata': {},
            'settings': {}
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.block.refresh_from_db()
        self.assertEqual(self.block.content, 'Updated content')

    def test_update_block_positions(self):
        """Test updating block positions."""
        url = f'/api/notes/notebooks/{self.notebook.id}/blocks/{self.block.id}/'
        data = {
            'type': 'paragraph',
            'content': 'Test content',
            'metadata': {},
            'settings': {},
            'position_id': 2,
            'position_order': 5
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.block_connector.refresh_from_db()
        self.assertEqual(self.block_connector.position_id, 2)
        self.assertEqual(self.block_connector.position_order, 5)

    def test_delete_block(self):
        """Test deleting a block."""
        url = f'/api/notes/notebooks/{self.notebook.id}/blocks/{self.block.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Block.objects.filter(id=self.block.id).exists())

    def test_access_block_from_other_users_notebook(self):
        """Test that user cannot access blocks from another user's notebook."""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123'
        )
        other_notebook = Notebook.objects.create(name='Other Notebook')
        NotebookUserConnector.objects.create(user=other_user, notebook=other_notebook)
        
        other_block = Block.objects.create(type='paragraph', content='Other content')
        BlockNotebookConnector.objects.create(block=other_block, notebook=other_notebook)
        
        url = f'/api/notes/notebooks/{other_notebook.id}/blocks/{other_block.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ExportNotebookTests(TestCase):
    """Test cases for notebook export functionality."""

    def setUp(self):
        """Set up test client, user, and notebook with blocks."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        
        self.notebook = Notebook.objects.create(name='Export Test')
        NotebookUserConnector.objects.create(user=self.user, notebook=self.notebook)
        
        # Create some blocks
        self.block1 = Block.objects.create(
            type='heading1',
            content='Title',
            metadata={},
            settings={}
        )
        self.block2 = Block.objects.create(
            type='paragraph',
            content='Content',
            metadata={},
            settings={}
        )
        BlockNotebookConnector.objects.create(
            block=self.block1,
            notebook=self.notebook,
            position_id=0,
            position_order=0
        )
        BlockNotebookConnector.objects.create(
            block=self.block2,
            notebook=self.notebook,
            position_id=0,
            position_order=1
        )

    def test_export_notebook_json(self):
        """Test exporting notebook as JSON."""
        url = f'/api/notes/notebooks/{self.notebook.id}/export/?export_format=json'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/json')
        
        # Parse JSON response
        data = json.loads(response.content)
        self.assertEqual(data['name'], 'Export Test')
        self.assertEqual(len(data['blocks']), 2)

    def test_export_notebook_zip(self):
        """Test exporting notebook as ZIP."""
        url = f'/api/notes/notebooks/{self.notebook.id}/export/?export_format=zip'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/zip')
        
        # Verify ZIP contains notebook.json
        zip_buffer = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
            self.assertIn('notebook.json', zip_file.namelist())

    def test_export_nonexistent_notebook(self):
        """Test exporting a non-existent notebook."""
        url = '/api/notes/notebooks/00000000-0000-0000-0000-000000000000/export/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ImportNotebookTests(TestCase):
    """Test cases for notebook import functionality."""

    def setUp(self):
        """Set up test client and authenticated user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.import_url = '/api/notes/notebooks/import/'

    def test_import_notebook_json(self):
        """Test importing notebook from JSON file."""
        notebook_data = {
            'name': 'Imported Notebook',
            'blocks': [
                {
                    'type': 'heading1',
                    'content': 'Title',
                    'metadata': {},
                    'settings': {},
                    'position_id': 0,
                    'position_order': 0
                },
                {
                    'type': 'paragraph',
                    'content': 'Content',
                    'metadata': {},
                    'settings': {},
                    'position_id': 0,
                    'position_order': 1
                }
            ]
        }
        
        json_file = io.BytesIO(json.dumps(notebook_data).encode('utf-8'))
        json_file.name = 'import.json'
        
        response = self.client.post(self.import_url, {'file': json_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Imported Notebook')
        
        # Verify notebook and blocks were created
        notebook = Notebook.objects.get(id=response.data['id'])
        blocks = BlockNotebookConnector.objects.filter(notebook=notebook)
        self.assertEqual(blocks.count(), 2)

    def test_import_notebook_no_file(self):
        """Test importing without providing a file."""
        response = self.client.post(self.import_url, {}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_import_notebook_invalid_format(self):
        """Test importing with unsupported file format."""
        txt_file = io.BytesIO(b'text content')
        txt_file.name = 'import.txt'
        
        response = self.client.post(self.import_url, {'file': txt_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
