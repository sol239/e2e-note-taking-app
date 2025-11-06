from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notebook, Block, NotebookUserConnector, BlockNotebookConnector
from .serializers import NotebookSerializer, BlockSerializer, NotebookUserConnectorSerializer, BlockNotebookConnectorSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def notebook_list_create(request):
    """
    List user's notebooks or create a new notebook.

    GET: Returns a list of all notebooks accessible to the authenticated user.
    POST: Creates a new notebook and associates it with the authenticated user.
    """
    if request.method == 'GET':
        connectors = NotebookUserConnector.objects.filter(user=request.user)
        serializer = NotebookUserConnectorSerializer(connectors, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = NotebookSerializer(data=request.data)
        if serializer.is_valid():
            notebook = serializer.save()
            NotebookUserConnector.objects.create(user=request.user, notebook=notebook)
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
        NotebookUserConnector.objects.get(user=request.user, notebook_id=notebook_id)
    except NotebookUserConnector.DoesNotExist:
        return Response({'error': 'Notebook not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        connectors = BlockNotebookConnector.objects.filter(notebook_id=notebook_id)
        serializer = BlockNotebookConnectorSerializer(connectors, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = BlockSerializer(data=request.data)
        if serializer.is_valid():
            block = serializer.save()
            BlockNotebookConnector.objects.create(block=block, notebook_id=notebook_id)
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
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
