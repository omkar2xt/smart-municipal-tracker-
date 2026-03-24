from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_tracking() -> dict:
    return {"message": "Tracking route placeholder"}
