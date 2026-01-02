from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models.task import Task
from ..schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    priority: str = None,
    completed: bool = None,
    db: Session = Depends(get_db)
):
    """Get all tasks with optional filters."""
    query = db.query(Task)
    if category:
        query = query.filter(Task.category == category)
    if priority:
        query = query.filter(Task.priority == priority)
    if completed is not None:
        query = query.filter(Task.completed == completed)

    tasks = query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()
    return tasks


@router.get("/categories")
def get_categories():
    """Get available task categories."""
    return ["todo", "refill", "maintenance", "other"]


@router.get("/priorities")
def get_priorities():
    """Get available priority levels."""
    return ["low", "medium", "high", "urgent"]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a specific task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task."""
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task: TaskUpdate,
    db: Session = Depends(get_db)
):
    """Update a task."""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task.model_dump(exclude_unset=True)

    # Set completed_at timestamp when marking as completed
    if "completed" in update_data and update_data["completed"] and not db_task.completed:
        update_data["completed_at"] = datetime.now()
    elif "completed" in update_data and not update_data["completed"]:
        update_data["completed_at"] = None

    for key, value in update_data.items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task."""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(db_task)
    db.commit()


@router.post("/{task_id}/toggle", response_model=TaskResponse)
def toggle_task_completion(task_id: int, db: Session = Depends(get_db)):
    """Toggle task completion status."""
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_task.completed = not db_task.completed
    db_task.completed_at = datetime.now() if db_task.completed else None

    db.commit()
    db.refresh(db_task)
    return db_task
