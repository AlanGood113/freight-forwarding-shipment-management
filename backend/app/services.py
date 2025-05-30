from typing import List, Dict, Any, Optional
from .db import run_query

# Total warehouse capacity in cubic centimeters
WAREHOUSE_CAPACITY_CM3 = 60_000_000_000


def dedupe_shipments() -> int:
    """
    Remove duplicate shipments by keeping only the earliest arrival for each shipment_id.
    Returns the count of duplicates removed.
    """
    # Count distinct IDs vs raw rows
    before = run_query("SELECT COUNT(*) AS c FROM shipments;")[0]["c"]
    sql = """
    CREATE OR REPLACE TABLE shipments AS
    SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (
            PARTITION BY shipment_id
            ORDER BY arrival_date
        ) AS rn
        FROM shipments
    ) sub
    WHERE rn = 1;
    """
    run_query(sql)
    after = run_query("SELECT COUNT(*) AS c FROM shipments;")[0]["c"]
    removed = before - after
    return removed


def handle_missing_values(strategy: str = "reject") -> List[Dict[str, Any]]:
    """
    Handle missing values in the shipments table.

    Args:
      - strategy: 'reject' to list rows with missing required fields,
                  'fill_zero' to set missing numeric fields to zero.

    Returns:
      - If 'reject', a list of invalid rows; otherwise empty list.
    """
    required_cols = [
        "shipment_id",
        "customer_id",
        "origin",
        "destination",
        "weight",
        "volume",
        "carrier",
        "mode",
        "status",
        "arrival_date",
    ]

    if strategy == "reject":
        cond = " OR ".join([f"{col} IS NULL" for col in required_cols])
        sql = f"SELECT * FROM shipments WHERE {cond};"
        return run_query(sql)

    elif strategy == "fill_zero":
        sql = """
        UPDATE shipments
        SET
            weight = COALESCE(weight, 0),
            volume = COALESCE(volume, 0)
        WHERE weight IS NULL OR volume IS NULL;
        """
        run_query(sql)
        return []

    else:
        raise ValueError(f"Unknown missing-value strategy: {strategy}")


def cargo_consolidation() -> List[Dict[str, Any]]:
    """
    Suggest shipments that can be grouped by destination and departure_date
    when multiple shipments share those, returning each group with count and IDs.
    """
    sql = """
    SELECT
      destination,
      departure_date,
      COUNT(*) AS group_count,
      STRING_AGG(CAST(shipment_id AS VARCHAR), ',') AS shipment_ids
    FROM shipments
    WHERE departure_date IS NOT NULL
    GROUP BY destination, departure_date
    HAVING COUNT(*) > 1;
    """
    return run_query(sql)


def warehouse_utilization() -> Dict[str, Any]:
    """
    Calculate warehouse utilization: total volume vs capacity.

    Returns:
      { total_volume: int, utilization_percent: float }
    """
    result = run_query("SELECT SUM(volume) AS total_volume FROM shipments;")
    total_volume = result[0].get("total_volume") or 0
    utilization = (total_volume / WAREHOUSE_CAPACITY_CM3) * 100
    return {"total_volume": total_volume, "utilization_percent": utilization}


def get_shipments(page: int = 1, page_size: int = 100) -> List[Dict[str, Any]]:
    """
    Retrieve a paginated list of shipments.

    Args:
      - page: 1-based page number
      - page_size: number of shipments per page

    Returns:
      - List of shipment records for the requested page
    """
    offset = (page - 1) * page_size
    sql = """
    SELECT *
    FROM shipments
    ORDER BY shipment_id
    LIMIT ? OFFSET ?;
    """
    return run_query(sql, (page_size, offset))


def get_shipment_details(shipment_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieve the details for a single shipment by its ID.

    Args:
      - shipment_id: the unique identifier of the shipment

    Returns:
      - A dict of shipment fields, or None if not found
    """
    sql = "SELECT * FROM shipments WHERE shipment_id = ?;"
    results = run_query(sql, (shipment_id,))
    return results[0] if results else None
