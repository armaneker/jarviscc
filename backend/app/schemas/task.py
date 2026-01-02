from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "todo"
    priority: str = "medium"
    due_date: Optional[date] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    completed: Optional[bool] = None


class TaskResponse(TaskBase):
    id: int
    completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
