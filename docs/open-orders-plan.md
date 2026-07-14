# Open repair order browsing plan

The existing `repair_orders`, `repair_order_parts`, and `repair_order_labor`
models are the proposed clean read model. Before transforming staged data, add
stable legacy line keys to both line tables so repeated transforms remain
idempotent.

- `/open-orders` will query the signed-in membership's shop, filter open repair
  orders, order by opened date, and use the shared server-rendered pagination.
- `/open-orders/[id]` will enforce the same shop scope and show the linked
  customer, vehicle, parts, labor, odometer, concern, and notes.
- Missing customer or vehicle links will be reported during transform and
  skipped until they can be resolved.

No routes or clean transforms are enabled until staging counts and the required
idempotency constraints are approved.
