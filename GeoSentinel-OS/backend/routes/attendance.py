from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_attendance() -> dict:
    return {"message": "Attendance route placeholder"}
