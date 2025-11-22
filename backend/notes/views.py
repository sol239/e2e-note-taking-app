from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from .models import Notebook, Block, NotebookUserConnector, BlockNotebookConnector
from .serializers import NotebookSerializer, BlockSerializer, NotebookUserConnectorSerializer, BlockNotebookConnectorSerializer
import json
import zipfile
import io
import base64
import uuid

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def notebook_list_create(request):
    """
    List user's notebooks or create a new notebook.

    GET: Returns a list of all notebooks accessible to the authenticated user.
    POST: Creates a new notebook and associates it with the authenticated user.
    """
    if request.method == 'GET':
        connectors = NotebookUserConnector.objects.filter(user=request.user).order_by('-last_opened')
        serializer = NotebookUserConnectorSerializer(connectors, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = NotebookSerializer(data=request.data)
        if serializer.is_valid():
            notebook = serializer.save()
            NotebookUserConnector.objects.create(user=request.user, notebook=notebook)
            
            # Create initial heading 1 block with notebook name
            initial_block = Block.objects.create(
                type='heading1',
                content=notebook.name,
                metadata={},
                settings={}
            )
            BlockNotebookConnector.objects.create(block=initial_block, notebook=notebook)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def notebook_detail(request, notebook_id):
    """
    Retrieve, update, or delete a specific notebook.

    GET: Returns details of the specified notebook if user has access.
    PUT: Updates the notebook details.
    DELETE: Deletes the notebook and all associated data.
    """
    try:
        connector = NotebookUserConnector.objects.get(user=request.user, notebook_id=notebook_id)
        notebook = connector.notebook
    except NotebookUserConnector.DoesNotExist:
        return Response({'error': 'Notebook not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # Update last_opened timestamp
        connector.last_opened = timezone.now()
        connector.save()

        serializer = NotebookSerializer(notebook)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = NotebookSerializer(notebook, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        notebook.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def block_list_create(request, notebook_id):
    """
    List blocks in a notebook or create a new block.

    GET: Returns all blocks in the specified notebook.
    POST: Creates a new block and associates it with the notebook.
    """
    try:
        connector = NotebookUserConnector.objects.get(user=request.user, notebook_id=notebook_id)
    except NotebookUserConnector.DoesNotExist:
        return Response({'error': 'Notebook not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # Update last_opened timestamp
        connector.last_opened = timezone.now()
        connector.save()

        connectors = BlockNotebookConnector.objects.filter(notebook_id=notebook_id)
        serializer = BlockNotebookConnectorSerializer(connectors, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = BlockSerializer(data=request.data)
        if serializer.is_valid():
            block = serializer.save()
            BlockNotebookConnector.objects.create(
                block=block, 
                notebook_id=notebook_id,
                position_id=request.data.get('position_id', 0),
                position_order=request.data.get('position_order', 0)
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def block_detail(request, notebook_id, block_id):
    """
    Retrieve, update, or delete a specific block.

    GET: Returns details of the specified block.
    PUT: Updates the block content and metadata.
    DELETE: Removes the block from the notebook.
    """
    try:
        NotebookUserConnector.objects.get(user=request.user, notebook_id=notebook_id)
        connector = BlockNotebookConnector.objects.get(block_id=block_id, notebook_id=notebook_id)
        block = connector.block
    except (NotebookUserConnector.DoesNotExist, BlockNotebookConnector.DoesNotExist):
        return Response({'error': 'Block not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = BlockSerializer(block)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = BlockSerializer(block, data=request.data)
        if serializer.is_valid():
            serializer.save()
            
            # Update position if provided
            if 'position_id' in request.data or 'position_order' in request.data:
                connector.position_id = request.data.get('position_id', connector.position_id)
                connector.position_order = request.data.get('position_order', connector.position_order)
                connector.save()
                
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_notebook(request, notebook_id):
    try:
        connector = NotebookUserConnector.objects.get(user=request.user, notebook_id=notebook_id)
        notebook = connector.notebook
    except NotebookUserConnector.DoesNotExist:
        return Response({'error': 'Notebook not found'}, status=status.HTTP_404_NOT_FOUND)

    format_type = request.query_params.get('export_format', 'json')
    
    # Get all blocks
    block_connectors = BlockNotebookConnector.objects.filter(notebook=notebook).order_by('position_id', 'position_order')
    blocks_data = []
    
    for bc in block_connectors:
        block_data = BlockSerializer(bc.block).data
        # Add position info
        block_data['position_id'] = bc.position_id
        block_data['position_order'] = bc.position_order
        blocks_data.append(block_data)
    
    notebook_data = {
        'id': str(notebook.id),
        'name': notebook.name,
        'blocks': blocks_data
    }

    if format_type == 'zip':
        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Process blocks to extract assets
            processed_blocks = []
            assets_folder = 'assets/'
            
            for block in blocks_data:
                processed_block = block.copy()
                # Check for images/media in metadata
                if block['type'] in ['image', 'video', 'audio'] and block.get('metadata') and block['metadata'].get('url'):
                    url = block['metadata']['url']
                    # Check if it's base64
                    if url.startswith('data:'):
                        try:
                            header, encoded = url.split(',', 1)
                            data = base64.b64decode(encoded)
                            
                            # Determine extension
                            ext = 'bin'
                            if 'image/png' in header: ext = 'png'
                            elif 'image/jpeg' in header: ext = 'jpg'
                            elif 'image/gif' in header: ext = 'gif'
                            elif 'image/webp' in header: ext = 'webp'
                            
                            filename = f"{block['id']}.{ext}"
                            zip_file.writestr(f"{assets_folder}{filename}", data)
                            
                            # Update URL in processed block to point to local file
                            processed_block['metadata']['url'] = f"{assets_folder}{filename}"
                        except Exception as e:
                            print(f"Failed to process asset for block {block['id']}: {e}")
                
                processed_blocks.append(processed_block)
            
            # Update notebook data with processed blocks (referencing local files)
            notebook_data['blocks'] = processed_blocks
            
            # Write notebook.json
            zip_file.writestr('notebook.json', json.dumps(notebook_data, indent=2))
        
        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{notebook.name}.zip"'
        return response

    else:
        # Default JSON export
        response = HttpResponse(json.dumps(notebook_data, indent=2), content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="{notebook.name}.json"'
        return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_notebook(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    uploaded_file = request.FILES['file']
    filename = uploaded_file.name.lower()
    
    try:
        notebook_data = None
        assets = {}
        
        if filename.endswith('.zip'):
            with zipfile.ZipFile(uploaded_file, 'r') as zip_ref:
                # Read notebook.json
                if 'notebook.json' not in zip_ref.namelist():
                    return Response({'error': 'Invalid ZIP: notebook.json missing'}, status=status.HTTP_400_BAD_REQUEST)
                
                with zip_ref.open('notebook.json') as f:
                    notebook_data = json.load(f)
                
                # Read assets
                for file in zip_ref.namelist():
                    if file.startswith('assets/'):
                        with zip_ref.open(file) as f:
                            assets[file] = f.read()
                            
        elif filename.endswith('.json'):
            notebook_data = json.load(uploaded_file)
        else:
            return Response({'error': 'Unsupported file format'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not notebook_data:
            return Response({'error': 'Failed to read notebook data'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create Notebook
        notebook = Notebook.objects.create(name=notebook_data.get('name', 'Imported Notebook'))
        NotebookUserConnector.objects.create(user=request.user, notebook=notebook)
        
        # Create Blocks
        for block_data in notebook_data.get('blocks', []):
            # Restore assets if needed
            if block_data.get('metadata') and block_data['metadata'].get('url'):
                url = block_data['metadata']['url']
                if url in assets:
                    # Convert back to base64 for now (as per current frontend implementation)
                    # In a real app, we might upload to S3/media storage here
                    asset_data = assets[url]
                    mime_type = 'application/octet-stream'
                    if url.endswith('.png'): mime_type = 'image/png'
                    elif url.endswith('.jpg'): mime_type = 'image/jpeg'
                    elif url.endswith('.gif'): mime_type = 'image/gif'
                    
                    base64_str = base64.b64encode(asset_data).decode('utf-8')
                    block_data['metadata']['url'] = f"data:{mime_type};base64,{base64_str}"
            
            block = Block.objects.create(
                type=block_data.get('type', 'paragraph'),
                content=block_data.get('content', ''),
                metadata=block_data.get('metadata', {}),
                settings=block_data.get('settings', {})
            )
            
            BlockNotebookConnector.objects.create(
                block=block, 
                notebook=notebook,
                position_id=block_data.get('position_id', 0),
                position_order=block_data.get('position_order', 0)
            )
            
        return Response({'id': notebook.id, 'name': notebook.name}, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
