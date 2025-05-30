from fastapi import APIRouter, HTTPException, status
from ..services import check_db_status, delete_db_file

router = APIRouter()


@router.get(
    "/db-status",
    summary="Check DuckDB file status",
    status_code=status.HTTP_200_OK,
)
async def db_status():
    """
    Returns whether the DuckDB file exists, whether it has data,
    and how many shipments are loaded.
    """
    status = check_db_status()
    return status


@router.delete(
    "/db",
    summary="Delete the DuckDB database file",
    status_code=status.HTTP_200_OK,
)
async def delete_db():
    """
    Deletes the on-disk DuckDB file.
    Next upload will recreate an empty DB.
    """
    try:
        removed = delete_db_file()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete DB file: {exc}",
        )
    if removed:
        return {"message": "DuckDB file deleted", "deleted": True}
    else:
        return {"message": "No DuckDB file to delete", "deleted": False}
