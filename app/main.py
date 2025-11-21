from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config.db import check_db_connection
from app.settings import settings as s


@asynccontextmanager
async def lifespan(app: FastAPI):
    await check_db_connection()
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Support Agent",
    description="A simple API for managing support tickets",
)


@app.get("/")
def read_root():
    return {"message": "Hello from Support Agent API!"}
