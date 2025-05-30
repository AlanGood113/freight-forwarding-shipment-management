import os
import duckdb

# Path to the on-disk DuckDB database file
DB_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'data', 'duckdb.db')
)


def get_connection(in_memory: bool = False) -> duckdb.DuckDBPyConnection:
    """
    Create and return a DuckDB connection.

    Args:
        in_memory (bool): If True, creates an in-memory database. Otherwise uses on-disk file.
    """
    if in_memory:
        return duckdb.connect(database=':memory:')
    # On-disk (persistent) mode
    return duckdb.connect(database=DB_FILE)


def run_query(sql: str, params: tuple = None, in_memory: bool = False) -> list[dict]:
    """
    Execute an arbitrary SQL query and return results as a list of dicts.

    Args:
        sql (str): SQL query to execute.
        params (tuple, optional): Query parameters.
        in_memory (bool): Whether to use in-memory database.

    Returns:
        list[dict]: Query results.
    """
    conn = get_connection(in_memory)
    if params:
        result = conn.execute(sql, params)
    else:
        result = conn.execute(sql)
    df = result.df()
    return df.to_dict(orient="records")
