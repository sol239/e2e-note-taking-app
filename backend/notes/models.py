from django.db import models
from django.conf import settings
import uuid

class Notebook(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class NotebookUserConnector(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'notebook')

    def __str__(self):
        return f"{self.user.email} - {self.notebook.name}"

class Block(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=50)
    content = models.TextField(blank=True)
    metadata = models.JSONField(blank=True, null=True)
    settings = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"{self.type} - {self.id}"

class BlockNotebookConnector(models.Model):
    block = models.ForeignKey(Block, on_delete=models.CASCADE)
    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('block', 'notebook')

    def __str__(self):
        return f"{self.block.id} - {self.notebook.name}"
