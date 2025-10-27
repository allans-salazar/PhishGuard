# server/db.py
import os
import oracledb
from dotenv import load_dotenv
load_dotenv()

_pool = None

def get_pool():
    global _pool
    if _pool is None:
        dsn = oracledb.makedsn(
            os.getenv("ORACLE_HOST", "127.0.0.1"),
            int(os.getenv("ORACLE_PORT", "1521")),
            service_name=os.getenv("ORACLE_SERVICE", "ORCLCDB")  # or ORCLPDB1
        )
        _pool = oracledb.create_pool(
            user=os.getenv("ORACLE_USER", "PHISHGUARD"),
            password=os.getenv("ORACLE_PASS", "phishguardpw"),
            dsn=dsn, min=1, max=4, increment=1
        )
    return _pool

def query(sql: str, params: dict | None = None, commit: bool = False):
    pool = get_pool()
    with pool.acquire() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or {})
            if commit:
                conn.commit()
            if cur.description:
                return cur.fetchall()
            return None