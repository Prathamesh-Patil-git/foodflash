import mysql.connector
from mysql.connector import pooling
from config import Config

# Connection pool for efficient DB access
db_pool = pooling.MySQLConnectionPool(
    pool_name="foodflash_pool",
    pool_size=5,
    host=Config.MYSQL_HOST,
    port=Config.MYSQL_PORT,
    user=Config.MYSQL_USER,
    password=Config.MYSQL_PASSWORD,
    database=Config.MYSQL_DATABASE
)

def get_db():
    """Get a connection from the pool."""
    return db_pool.get_connection()

def execute_query(query, params=None, fetch=True):
    """Execute a query and return results."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if fetch:
            result = cursor.fetchall()
            return result
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

def execute_procedure(proc_name, args):
    """Call a stored procedure and return results."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.callproc(proc_name, args)
        results = []
        for result in cursor.stored_results():
            results.append(result.fetchall())
        conn.commit()
        return results
    finally:
        cursor.close()
        conn.close()
