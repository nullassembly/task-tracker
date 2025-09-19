from typing import List
from pydantic import BaseModel


class TasksRead(BaseModel):
    id: int
    completed: int
    task: str
    created: str


class TasksResponse(BaseModel):
    success: bool
    tasks: List[TasksRead]


class TaskForm(BaseModel):
    task: str


class TaskUpdate(BaseModel):
    task: str = None
    completed: int = None
