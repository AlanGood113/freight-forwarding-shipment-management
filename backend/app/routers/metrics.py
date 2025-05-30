from fastapi import APIRouter, HTTPException, Query, Path, status
from typing import List, Dict, Any
from ..services import (
    cargo_consolidation,
    warehouse_utilization,
    get_shipments,
    get_shipment_details,
)

router = APIRouter()


@router.get(
    "/consolidation",
    summary="Get cargo consolidation suggestions",
    status_code=status.HTTP_200_OK,
)
async def get_cargo_consolidation():
    """
    Returns groups of shipments that can be consolidated,
    grouped by destination and departure_date.
    """
    try:
        groups = cargo_consolidation()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch cargo consolidation: {exc}",
        )
    return {"cargo_consolidation": groups}


@router.get(
    "/warehouse",
    summary="Get current warehouse utilization",
    status_code=status.HTTP_200_OK,
)
async def get_warehouse_utilization():
    """
    Returns total volume of shipments and utilization percentage.
    """
    try:
        utilization = warehouse_utilization()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch warehouse utilization: {exc}",
        )
    return {"warehouse_utilization": utilization}

@router.get(
    "/shipments",
    summary="List shipments with pagination",
    status_code=status.HTTP_200_OK,
)
async def list_shipments(
    page: int = Query(1, ge=1, description="Page number, starting from 1"),
    page_size: int = Query(
        100, ge=1, le=1000, description="Number of shipments per page"
    ),
) -> dict:
    """
    Retrieve a paginated list of shipments.
    """
    try:
        shipments = get_shipments(page=page, page_size=page_size)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch shipments: {exc}",
        )
    return {"page": page, "page_size": page_size, "shipments": shipments}


@router.get(
    "/shipments/{shipment_id}",
    summary="Get shipment details",
    status_code=status.HTTP_200_OK,
)
async def shipment_details(
    shipment_id: int = Path(..., ge=4000000, description="Unique shipment identifier"),
) -> Dict[str, Any]:
    """
    Retrieve details for a single shipment by its ID.
    """
    try:
        shipment = get_shipment_details(shipment_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch shipment details: {exc}",
        )

    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shipment {shipment_id} not found",
        )

    return shipment
