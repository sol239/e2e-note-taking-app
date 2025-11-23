from django.db import models
from django.conf import settings
import uuid

class Notebook(models.Model):
    """
    Notebook model representing a collection of blocks.

    Each notebook can contain multiple blocks and be shared with multiple users
    through the NotebookUserConnector relationship.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class NotebookUserConnector(models.Model):
    """
    Many-to-many relationship between users and notebooks.

    Tracks which users have access to which notebooks and when they last
    opened each notebook for recency-based sorting.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE)
    last_opened = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'notebook')

    def __str__(self):
        return f"{self.user.email} - {self.notebook.name}"

class Block(models.Model):
    """
    Block model representing a single content block within a notebook.

    Blocks can be of various types (text, image, code, etc.) and contain
    the actual content along with metadata and display settings.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=50)
    content = models.TextField(blank=True)
    metadata = models.JSONField(blank=True, null=True)
    settings = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"{self.type} - {self.id}"

class BlockNotebookConnector(models.Model):
    """
    Many-to-many relationship between blocks and notebooks with positioning.

    Tracks which blocks belong to which notebooks and maintains their
    position within the notebook using position_id and position_order.
    """

    block = models.ForeignKey(Block, on_delete=models.CASCADE)
    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE)
    position_id = models.IntegerField(default=0)
    position_order = models.IntegerField(default=0)

    class Meta:
        unique_together = ('block', 'notebook')

    def __str__(self):
        return f"{self.block.id} - {self.notebook.name}"
