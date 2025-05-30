from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import upload, metrics, admin

app = FastAPI()

# Enable CORS for the React frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(upload.router, prefix="/upload")
app.include_router(metrics.router, prefix="/metrics")
app.include_router(admin.router, prefix="/admin")
