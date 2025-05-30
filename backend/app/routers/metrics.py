from fastapi import APIRouter, HTTPException, Query, Path, status
from typing import List, Dict, Any, Optional
from fastapi.responses import StreamingResponse
import csv, io
from pydantic import BaseModel
from ..models import ConsolidationScope, ExportRequest
from ..services import (
    cargo_consolidation,
    warehouse_utilization,
    get_shipments,
    get_shipment_details,
    summary_statistics,
    received_count_by_carrier,
    volume_by_mode,
    throughput_over_time,
)

router = APIRouter()


@router.get(
    "/consolidation",
    summary="Get cargo consolidation suggestions",
    status_code=status.HTTP_200_OK,
)
async def get_cargo_consolidation(
    destination: Optional[str] = Query(
        None, description="Filter by destination code (e.g. SVG, DOM)"
    ),
    departure_date: Optional[str] = Query(
        None, description="Filter by departure date (YYYY-MM-DD)"
    ),
):
    """
    Returns groups of shipments that can be consolidated,
    optionally filtered by destination and departure_date.
    """
    try:
        groups = cargo_consolidation(
            destination=destination, departure_date=departure_date
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch cargo consolidation: {exc}",
        )
    return {"cargo_consolidation": groups}


@router.post(
    "/consolidation/export",
    summary="Export consolidation recommendations as CSV",
    status_code=status.HTTP_200_OK,
)
async def export_consolidation(req: ExportRequest):
    """
    Accepts a list of {destination, departure_date} filters,
    fetches the matching consolidation groups, and returns a CSV file.
    """
    try:
        # aggregate rows from each scope
        rows = []
        for scope in req.scopes:
            groups = cargo_consolidation(
                destination=scope.destination,
                departure_date=scope.departure_date,
            )
            rows.extend(groups)

        # if no scopes provided, export all
        if not req.scopes:
            rows = cargo_consolidation()

        # build CSV in-memory
        buffer = io.StringIO()
        writer = csv.DictWriter(
            buffer,
            fieldnames=["destination", "departure_date", "group_count", "shipment_ids"],
        )
        writer.writeheader()
        writer.writerows(rows)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=consolidation.csv"},
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export consolidation CSV: {exc}",
        )


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
    summary="List shipments with pagination and filters",
    status_code=status.HTTP_200_OK,
)
async def list_shipments(
    page: int = Query(1, ge=1, description="Page number, starting from 1"),
    page_size: int = Query(
        100, ge=1, le=1000, description="Number of shipments per page"
    ),
    status: Optional[str] = Query(
        None, description="Filter by status (delivered, intransit, received)"
    ),
    destination: Optional[str] = Query(
        None, description="Filter by destination code (e.g. SVG, DOM)"
    ),
    carrier: Optional[str] = Query(
        None, description="Filter by carrier (UPS, DHL, FEDEX, etc.)"
    ),
):
    """
    Retrieve a paginated, filtered list of shipments.
    """
    try:
        shipments = get_shipments(
            page=page,
            page_size=page_size,
            status=status,
            destination=destination,
            carrier=carrier,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch shipments: {exc}",
        )
    return {
        "page": page,
        "page_size": page_size,
        "filters": {"status": status, "destination": destination, "carrier": carrier},
        "shipments": shipments,
    }


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


@router.get(
    "/summary",
    summary="Get overall shipment summary stats",
    status_code=status.HTTP_200_OK,
)
async def get_summary():
    """
    Returns total shipments, on-time vs delayed counts, and warehouse utilization.
    """
    try:
        stats = summary_statistics()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch summary statistics: {exc}",
        )
    return stats


@router.get(
    "/received-by-carrier",
    summary="Get received shipment counts per carrier per day",
    status_code=status.HTTP_200_OK,
)
async def get_received_by_carrier(
    start_date: Optional[str] = Query(
        None, description="Inclusive start date, format YYYY-MM-DD"
    ),
    end_date: Optional[str] = Query(
        None, description="Inclusive end date, format YYYY-MM-DD"
    ),
):
    """
    Returns a list of { arrival_date, carrier, count } for shipments received,
    filtered by optional date range.
    """
    try:
        data = received_count_by_carrier(start_date, end_date)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch received-by-carrier data: {exc}",
        )
    return {"received_by_carrier": data}


@router.get(
    "/volume-by-mode",
    summary="Get shipment volume by mode",
    status_code=status.HTTP_200_OK,
)
async def get_volume_by_mode():
    """
    Returns a list of { mode, total_volume } for shipments.
    """
    try:
        data = volume_by_mode()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch volume by mode data: {exc}",
        )
    return {"volume_by_mode": data}


@router.get(
    "/throughput",
    summary="Get warehouse throughput over time",
    status_code=status.HTTP_200_OK,
)
async def get_throughput(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD inclusive"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD inclusive"),
):
    """
    Returns a list of { arrival_date, packages_received } for each day
    shipments were received, filtered by optional date range.
    """
    try:
        data = throughput_over_time(start_date, end_date)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch throughput data: {exc}",
        )
    return {"throughput": data}
