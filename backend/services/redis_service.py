import json
import redis
from config import Config


class RedisService:
    """Redis service for cart management and caching (Unit III - NoSQL)."""
    _mock_db = {}  # In-memory fallback if Redis is not installed

    def __init__(self):
        self.use_mock = False
        try:
            self.client = redis.Redis(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                db=Config.REDIS_DB,
                decode_responses=True,
                socket_connect_timeout=2
            )
            self.client.ping() # test connection
        except Exception as e:
            print(f"[WARNING] Redis server not found ({e}). Falling back to in-memory mock (Demo Mode).")
            self.use_mock = True

    def _cart_key(self, user_id):
        return f"cart:{user_id}"

    # --- Cart Operations (Key-Value Store) ---

    def get_cart(self, user_id):
        """Get all items in user's cart."""
        key = self._cart_key(user_id)
        if self.use_mock:
            raw = self._mock_db.get(key, {})
        else:
            raw = self.client.hgetall(key)
        return [json.loads(v) for v in raw.values()]

    def add_to_cart(self, user_id, item_id, quantity, item_data):
        """Add item to cart."""
        key = self._cart_key(user_id)
        if self.use_mock:
            if key not in self._mock_db: self._mock_db[key] = {}
            existing = self._mock_db[key].get(str(item_id))
            if existing:
                data = json.loads(existing)
                data['qty'] = data.get('qty', 1) + quantity
            else:
                data = {**item_data, 'id': item_id, 'qty': quantity}
            self._mock_db[key][str(item_id)] = json.dumps(data)
            return

        existing = self.client.hget(key, str(item_id))
        if existing:
            data = json.loads(existing)
            data['qty'] = data.get('qty', 1) + quantity
        else:
            data = {**item_data, 'id': item_id, 'qty': quantity}
        self.client.hset(key, str(item_id), json.dumps(data))
        self.client.expire(key, 86400)  # 24h TTL

    def update_quantity(self, user_id, item_id, quantity):
        """Update item quantity."""
        key = self._cart_key(user_id)
        if self.use_mock:
            if key in self._mock_db and str(item_id) in self._mock_db[key]:
                data = json.loads(self._mock_db[key][str(item_id)])
                data['qty'] = quantity
                self._mock_db[key][str(item_id)] = json.dumps(data)
            return

        existing = self.client.hget(key, str(item_id))
        if existing:
            data = json.loads(existing)
            data['qty'] = quantity
            self.client.hset(key, str(item_id), json.dumps(data))

    def remove_from_cart(self, user_id, item_id):
        """Remove item from cart."""
        key = self._cart_key(user_id)
        if self.use_mock:
            if key in self._mock_db and str(item_id) in self._mock_db[key]:
                del self._mock_db[key][str(item_id)]
            return
        self.client.hdel(key, str(item_id))

    def clear_cart(self, user_id):
        """Clear entire cart."""
        key = self._cart_key(user_id)
        if self.use_mock:
            if key in self._mock_db:
                del self._mock_db[key]
            return
        self.client.delete(key)

    # --- Caching Operations ---

    def cache_set(self, key, data, ttl=300):
        """Cache data with TTL."""
        if self.use_mock:
            self._mock_db[f"cache:{key}"] = json.dumps(data)
            return
        self.client.setex(f"cache:{key}", ttl, json.dumps(data))

    def cache_get(self, key):
        """Get cached data."""
        if self.use_mock:
            raw = self._mock_db.get(f"cache:{key}")
        else:
            raw = self.client.get(f"cache:{key}")
        return json.loads(raw) if raw else None

    def cache_delete(self, key):
        """Invalidate cache."""
        if self.use_mock:
            if f"cache:{key}" in self._mock_db:
                del self._mock_db[f"cache:{key}"]
            return
        self.client.delete(f"cache:{key}")
