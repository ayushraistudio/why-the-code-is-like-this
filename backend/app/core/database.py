from neo4j import GraphDatabase, exceptions as neo4j_exceptions
from app.core.config import settings
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Neo4jConnection:
    def __init__(self):
        self.driver = None
        self._connect()

    def _connect(self):
        """Initialize Neo4j driver with keep-alive and liveness check for AuraDB."""
        try:
            if self.driver:
                try:
                    self.driver.close()
                except Exception:
                    pass

            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
                connection_timeout=20.0,
                max_connection_lifetime=180,  
                liveness_check_timeout=0.0,   
                keep_alive=True,
                connection_acquisition_timeout=30.0,
            )
            logger.info("Initialized Neo4j AuraDB driver with keep-alive pool")
        except Exception as e:
            logger.error(f"Failed to initialize Neo4j driver: {e}")
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def get_session(self):
        if not self.driver:
            self._connect()
        if not self.driver:
            raise ConnectionError(
                "Unable to connect to Neo4j AuraDB. Please check your internet connection or verify that your AuraDB instance is running."
            )
        return self.driver.session()

    def run_query_with_retry(self, query: str, parameters: dict = None, max_retries: int = 3):
        """
        Executes a Cypher query and automatically recovers from defunct/dropped
        IPv4/IPv6 cloud connections.
        """
        params = parameters or {}
        last_error = None

        for attempt in range(1, max_retries + 1):
            try:
                with self.get_session() as session:
                    result = session.run(query, **params)
                    records = [record.data() for record in result]
                    return records
            except (
                neo4j_exceptions.ServiceUnavailable,
                neo4j_exceptions.SessionExpired,
                neo4j_exceptions.TransientError,
                OSError,
            ) as e:
                last_error = e
                logger.warning(
                    f"Neo4j connection dropped on attempt {attempt}/{max_retries} ({e}). Reconnecting..."
                )
                self._connect()
                time.sleep(0.8 * attempt)
            except neo4j_exceptions.AuthError as auth_err:
                logger.error(f"Neo4j authentication failed: {auth_err}")
                raise ConnectionError(
                    "Neo4j Authentication Failed: Please verify NEO4J_USERNAME and NEO4J_PASSWORD in backend/.env."
                )
            except Exception as e:
                last_error = e
                if "defunct connection" in str(e).lower() or "reset by peer" in str(e).lower():
                    logger.warning(f"Defunct connection detected on attempt {attempt}. Reconnecting...")
                    self._connect()
                    time.sleep(0.8 * attempt)
                else:
                    raise e

        logger.error(f"All Neo4j retry attempts failed: {last_error}")
        raise ConnectionError(
            "Neo4j AuraDB connection timed out or is paused. Please check your AuraDB console and network connection."
        )


db_connection = Neo4jConnection()