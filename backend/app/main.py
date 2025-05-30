from fastapi import FastAPI
from .routers import upload, metrics

app = FastAPI()
app.include_router(upload.router, prefix="/upload")
app.include_router(metrics.router, prefix="/metrics")