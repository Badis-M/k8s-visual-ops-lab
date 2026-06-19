from fastapi import FastAPI
import os

app = FastAPI()

APP_NAME = os.getenv("APP_NAME", "k8s-ops-api")
READY = os.getenv("READY", "true")

@app.get("/")
def root():
    return {
        "message": "kubernetes operations lab",
        "app": APP_NAME,
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
    }

@app.get("/ready")
def ready():
    if READY.lower() != "true":
        return {
            "status": "not ready"
        }
    
    return {
        "status": "ready",
    }

@app.get("/config")
def config():
    return{
        "app_name": APP_NAME,
        "ready": READY,
    }