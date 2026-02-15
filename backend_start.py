import uvicorn
from backend_app import app   # 👈 explicit import

PORT = 51234

def main():
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=PORT,
        log_level="warning"
    )

if __name__ == "__main__":
    main()
