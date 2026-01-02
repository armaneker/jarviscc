from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.sql import func

from ..database import Base


class ShoppingItem(Base):
    __tablename__ = "shopping_list"

    id = Column(Integer, primary_key=True, index=True)
    item = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1)
    unit = Column(String(20), nullable=True)  # kg, liters, pieces, etc.
    category = Column(String(50), default="general")  # groceries, household, electronics, etc.
    estimated_price = Column(Float, nullable=True)
    purchased = Column(Boolean, default=False)
    purchased_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(String(500), nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ShoppingItem(id={self.id}, item='{self.item}', purchased={self.purchased})>"
