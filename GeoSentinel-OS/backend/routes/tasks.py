from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_tasks() -> dict:
    return {"message": "Tasks route placeholder"}
