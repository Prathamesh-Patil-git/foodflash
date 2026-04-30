"""
CartService — In-Memory Cart Storage
Replaces the previous Redis-backed cart with a simple module-level dict.
Cart data is held in process memory for the server's lifetime, which is
appropriate for a single-restaurant demo / DBMS project scope.
"""


class CartService:
    """
    Pure in-memory shopping cart service.
    Stores cart data as a dict keyed by user_id.
    Each cart is itself a dict keyed by item_id (str) → item dict.
    """
    _store: dict = {}  # { "cart:<user_id>": { "<item_id>": {...} } }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _key(self, user_id: int) -> str:
        return f"cart:{user_id}"

    def _get_raw(self, user_id: int) -> dict:
        return self._store.get(self._key(user_id), {})

    # ------------------------------------------------------------------
    # Cart CRUD
    # ------------------------------------------------------------------

    def get_cart(self, user_id: int) -> list:
        """Return list of cart items for the user."""
        return list(self._get_raw(user_id).values())

    def add_to_cart(self, user_id: int, item_id: int, quantity: int, item_data: dict):
        """Add item to cart, incrementing quantity if it already exists."""
        key = self._key(user_id)
        if key not in self._store:
            self._store[key] = {}

        sid = str(item_id)
        existing = self._store[key].get(sid)
        if existing:
            existing['qty'] = existing.get('qty', 1) + quantity
            self._store[key][sid] = existing
        else:
            self._store[key][sid] = {**item_data, 'id': item_id, 'qty': quantity}

    def update_quantity(self, user_id: int, item_id: int, quantity: int):
        """Set item quantity directly."""
        key = self._key(user_id)
        sid = str(item_id)
        if key in self._store and sid in self._store[key]:
            self._store[key][sid]['qty'] = quantity

    def remove_from_cart(self, user_id: int, item_id: int):
        """Remove a specific item from the cart."""
        key = self._key(user_id)
        sid = str(item_id)
        if key in self._store and sid in self._store[key]:
            del self._store[key][sid]

    def clear_cart(self, user_id: int):
        """Remove all items from the user's cart."""
        key = self._key(user_id)
        if key in self._store:
            del self._store[key]
