from typing import List, Dict, Any, Optional
from .db import DB_FILE, get_connection, run_query
import os

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


def cargo_consolidation(
    destination: Optional[str] = None,
    arrival_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Suggest shipments in status='received' that arrived on the same day
    to the same destination, optionally filtered by those fields.
    Returns destination, arrival_date, group_count, and
    shipments as a list of { shipment_id, customer_id }.
    """
    filters = ["status = 'received'"]
    params: List[Any] = []

    if destination:
        filters.append("destination = ?")
        params.append(destination)
    if arrival_date:
        filters.append("arrival_date = ?")
        params.append(arrival_date)

    where_clause = "WHERE " + " AND ".join(filters)

    # Pull back the raw string so we can split it client-side:
    sql = f"""
    SELECT
      destination,
      arrival_date,
      COUNT(*) AS group_count,
      STRING_AGG(
        CAST(shipment_id AS VARCHAR) || ':' || CAST(customer_id AS VARCHAR),
        ','
      ) AS shipments
    FROM shipments
    {where_clause}
    GROUP BY destination, arrival_date
    HAVING COUNT(*) > 1;
    """
    rows = run_query(sql, tuple(params))

    # Transform the comma-string into a real list of dicts:
    for row in rows:
        pairs = row["shipments"].split(",")
        row["shipments"] = [
            {"shipment_id": int(p.split(":")[0]), "customer_id": int(p.split(":")[1])}
            for p in pairs
        ]

    return rows


def warehouse_utilization() -> Dict[str, Any]:
    """
    Calculate warehouse utilization based on shipments currently in the warehouse.
    Only shipments with status='received' occupy warehouse space.

    Returns:
      { total_volume: int, utilization_percent: float }
    """
    sql = (
        "SELECT COALESCE(SUM(volume), 0) AS total_volume "
        "FROM shipments WHERE status = 'received';"
    )
    result = run_query(sql)
    total_volume = result[0].get("total_volume", 0)
    utilization = (total_volume / WAREHOUSE_CAPACITY_CM3) * 100
    return {"total_volume": total_volume, "utilization_percent": utilization}


def get_shipments(
    page: int = 1,
    page_size: int = 100,
    status: Optional[str] = None,
    destination: Optional[str] = None,
    carrier: Optional[str] = None,
    arrival_date_start: Optional[str] = None,
    arrival_date_end: Optional[str] = None,
    search: Optional[int] = None,
) -> (int, List[Dict[str, Any]]):
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
    if arrival_date_start:
        where_clauses.append("arrival_date >= ?")
        params.append(arrival_date_start)
    if arrival_date_end:
        where_clauses.append("arrival_date <= ?")
        params.append(arrival_date_end)
    if search is not None:
        where_clauses.append("(shipment_id = ? OR customer_id = ?)")
        params.extend([search, search])

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    # Count total
    count_sql = f"SELECT COUNT(*) AS total FROM shipments {where_sql};"
    total_count = run_query(count_sql, tuple(params))[0]["total"]

    # Fetch page
    page_sql = f"""
        SELECT *
        FROM shipments
        {where_sql}
        ORDER BY shipment_id
        LIMIT ? OFFSET ?;
    """
    page_params = tuple(params) + (page_size, offset)
    rows = run_query(page_sql, page_params)

    return total_count, rows


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


def check_db_status() -> Dict[str, Any]:
    """
    Check whether the DuckDB file exists and if it has any shipments loaded.
    Returns:
      {
        exists: bool,
        loaded: bool,
        total_shipments: int
      }
    """
    if not os.path.exists(DB_FILE):
        return {"exists": False, "loaded": False, "total_shipments": 0}

    # File exists; see if the shipments table has any rows
    try:
        tables = run_query("PRAGMA show_tables;")
        if not any(t["name"] == "shipments" for t in tables):
            return {"exists": True, "loaded": False, "total_shipments": 0}

        total = run_query("SELECT COUNT(*) AS total_shipments FROM shipments;")[0][
            "total_shipments"
        ]
        return {"exists": True, "loaded": total > 0, "total_shipments": total}
    except Exception:
        return {"exists": True, "loaded": False, "total_shipments": 0}


def delete_db_file() -> bool:
    """
    Delete the on-disk DuckDB file to reset state.
    Returns True if file was deleted, False if it did not exist.
    """
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        return True
    return False
