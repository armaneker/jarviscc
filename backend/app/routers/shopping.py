from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models.shopping import ShoppingItem
from ..schemas.shopping import ShoppingItemCreate, ShoppingItemUpdate, ShoppingItemResponse

router = APIRouter(prefix="/shopping", tags=["shopping"])


@router.get("/", response_model=List[ShoppingItemResponse])
def get_shopping_list(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    purchased: bool = None,
    db: Session = Depends(get_db)
):
    """Get shopping list items with optional filters."""
    query = db.query(ShoppingItem)
    if category:
        query = query.filter(ShoppingItem.category == category)
    if purchased is not None:
        query = query.filter(ShoppingItem.purchased == purchased)

    items = query.order_by(ShoppingItem.added_at.desc()).offset(skip).limit(limit).all()
    return items


@router.get("/categories")
def get_shopping_categories():
    """Get available shopping categories."""
    return ["groceries", "household", "electronics", "personal", "pet", "other"]


@router.get("/{item_id}", response_model=ShoppingItemResponse)
def get_shopping_item(item_id: int, db: Session = Depends(get_db)):
    """Get a specific shopping item by ID."""
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Shopping item not found")
    return item


@router.post("/", response_model=ShoppingItemResponse, status_code=201)
def create_shopping_item(item: ShoppingItemCreate, db: Session = Depends(get_db)):
    """Add a new item to shopping list."""
    db_item = ShoppingItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/{item_id}", response_model=ShoppingItemResponse)
def update_shopping_item(
    item_id: int,
    item: ShoppingItemUpdate,
    db: Session = Depends(get_db)
):
    """Update a shopping item."""
    db_item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Shopping item not found")

    update_data = item.model_dump(exclude_unset=True)

    # Set purchased_at timestamp when marking as purchased
    if "purchased" in update_data and update_data["purchased"] and not db_item.purchased:
        update_data["purchased_at"] = datetime.now()
    elif "purchased" in update_data and not update_data["purchased"]:
        update_data["purchased_at"] = None

    for key, value in update_data.items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/{item_id}", status_code=204)
def delete_shopping_item(item_id: int, db: Session = Depends(get_db)):
    """Delete a shopping item."""
    db_item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Shopping item not found")

    db.delete(db_item)
    db.commit()


@router.post("/{item_id}/toggle", response_model=ShoppingItemResponse)
def toggle_purchased(item_id: int, db: Session = Depends(get_db)):
    """Toggle item purchased status."""
    db_item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Shopping item not found")

    db_item.purchased = not db_item.purchased
    db_item.purchased_at = datetime.now() if db_item.purchased else None

    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/clear-purchased", status_code=204)
def clear_purchased_items(db: Session = Depends(get_db)):
    """Remove all purchased items from the list."""
    db.query(ShoppingItem).filter(ShoppingItem.purchased == True).delete()
    db.commit()
