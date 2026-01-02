from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ShoppingItemBase(BaseModel):
    item: str
    quantity: int = 1
    unit: Optional[str] = None
    category: str = "general"
    estimated_price: Optional[float] = None
    notes: Optional[str] = None


class ShoppingItemCreate(ShoppingItemBase):
    pass


class ShoppingItemUpdate(BaseModel):
    item: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    estimated_price: Optional[float] = None
    notes: Optional[str] = None
    purchased: Optional[bool] = None


class ShoppingItemResponse(ShoppingItemBase):
    id: int
    purchased: bool
    purchased_at: Optional[datetime] = None
    added_at: datetime

    class Config:
        from_attributes = True
