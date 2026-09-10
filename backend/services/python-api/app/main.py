from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session
from .database import Base, SessionLocal, engine
from .models import Item

@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="Python SQLAlchemy API", lifespan=lifespan)

@app.get("/")
def index():
    return {
        "message": "Python SQLAlchemy API",
        "docs": "/docs",
        "health": "/health",
        "items": "/items",
    }

class ItemCreate(BaseModel):
    name: str

class ItemRead(ItemCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int

def get_db():
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()

@app.get("/health")
def health():
    return {"service": "python-api", "status": "ok"}

@app.get("/items", response_model=list[ItemRead])
def list_items(database: Session = Depends(get_db)):
    return database.scalars(select(Item).order_by(Item.id)).all()

@app.post("/items", response_model=ItemRead, status_code=201)
def create_item(payload: ItemCreate, database: Session = Depends(get_db)):
    if not payload.name.strip():
        raise HTTPException(status_code=422, detail="name cannot be blank")
    item = Item(name=payload.name.strip())
    database.add(item)
    database.commit()
    database.refresh(item)
    return item
