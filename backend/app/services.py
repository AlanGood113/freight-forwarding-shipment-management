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


def cargo_consolidation(
    destination: Optional[str] = None,
    departure_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Suggest shipments that can be consolidated by destination and departure_date,
    optionally filtered by those fields.
    """
    filters = []
    params: List[Any] = []

    if destination:
        filters.append("destination = ?")
        params.append(destination)
    if departure_date:
        filters.append("departure_date = ?")
        params.append(departure_date)

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = f"""
    SELECT
      destination,
      departure_date,
      COUNT(*) AS group_count,
      STRING_AGG(CAST(shipment_id AS VARCHAR), ',') AS shipment_ids
    FROM shipments
    {where_clause}
    GROUP BY destination, departure_date
    HAVING COUNT(*) > 1;
    """
    return run_query(sql, tuple(params))


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


def get_shipments(
    page: int = 1,
    page_size: int = 100,
    status: Optional[str] = None,
    destination: Optional[str] = None,
    carrier: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieve a paginated list of shipments, optionally filtered.

    Args:
      - page: 1-based page number
      - page_size: number of shipments per page
      - status: filter by shipment status
      - destination: filter by destination code
      - carrier: filter by carrier name

    Returns:
      - List of shipment records for the requested page
    """
    offset = (page - 1) * page_size

    where_clauses = []
    params: List[Any] = []

    if status:
        where_clauses.append("status = ?")
        params.append(status)
    if destination:
        where_clauses.append("destination = ?")
        params.append(destination)
    if carrier:
        where_clauses.append("carrier = ?")
        params.append(carrier)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    sql = f"""
    SELECT *
    FROM shipments
    {where_sql}
    ORDER BY shipment_id
    LIMIT ? OFFSET ?;
    """
    params.extend([page_size, offset])
    return run_query(sql, tuple(params))


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


def summary_statistics() -> Dict[str, Any]:
    """
    Returns overall summary:
      - total_shipments
      - on_time (delivered)
      - delayed (not yet delivered)
      - warehouse_utilization (total_volume & percent)
    """
    # Total shipments
    total = run_query("SELECT COUNT(*) AS total_shipments FROM shipments;")[0][
        "total_shipments"
    ]

    # On-time vs delayed
    counts = run_query(
        """
        SELECT
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS on_time,
          SUM(CASE WHEN status != 'delivered' THEN 1 ELSE 0 END) AS delayed
        FROM shipments;
    """
    )[0]

    # Warehouse usage
    utilization = warehouse_utilization()

    return {
        "total_shipments": total,
        "on_time": counts["on_time"],
        "delayed": counts["delayed"],
        "warehouse_utilization": utilization,
    }


def received_count_by_carrier(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Returns count of shipments received per carrier per day,
    optionally filtered by arrival_date between start_date and end_date.

    Args:
      - start_date: 'YYYY-MM-DD' string, inclusive lower bound
      - end_date:   'YYYY-MM-DD' string, inclusive upper bound

    Returns:
      - List of { arrival_date, carrier, count }
    """
    params: list[Any] = []
    where_clauses: list[str] = []

    if start_date:
        where_clauses.append("arrival_date >= ?")
        params.append(start_date)
    if end_date:
        where_clauses.append("arrival_date <= ?")
        params.append(end_date)

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    sql = f"""
    SELECT
      arrival_date,
      carrier,
      COUNT(*) AS count
    FROM shipments
    {where_sql}
    GROUP BY arrival_date, carrier
    ORDER BY arrival_date, carrier;
    """
    return run_query(sql, tuple(params))


def volume_by_mode() -> List[Dict[str, Any]]:
    """
    Returns total shipment volume grouped by mode (air or sea).
    """
    sql = """
    SELECT
      mode,
      SUM(volume) AS total_volume
    FROM shipments
    GROUP BY mode;
    """
    return run_query(sql)


def throughput_over_time(
    start_date: Optional[str] = None, end_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Returns number of packages received per day, optionally filtered
    by arrival_date between start_date and end_date.
    """
    params: list[Any] = []
    filters: list[str] = []

    if start_date:
        filters.append("arrival_date >= ?")
        params.append(start_date)
    if end_date:
        filters.append("arrival_date <= ?")
        params.append(end_date)

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

    sql = f"""
    SELECT
      arrival_date,
      COUNT(*) AS packages_received
    FROM shipments
    {where_clause}
    GROUP BY arrival_date
    ORDER BY arrival_date;
    """
    return run_query(sql, tuple(params))
