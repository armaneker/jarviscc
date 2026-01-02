from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date
from sqlalchemy.sql import func

from ..database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    category = Column(String(50), default="todo")  # todo, refill, maintenance, other
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    due_date = Column(Date, nullable=True)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', completed={self.completed})>"
