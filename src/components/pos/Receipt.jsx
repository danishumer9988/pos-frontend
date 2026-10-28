import { money } from "../../utils/money";
import "../../styles/pos.css";

const TYPE = { dine_in: "Dine-in", takeaway: "Takeaway", delivery: "Delivery" };

// Hidden on screen and shown when printing. With `preview` it is also visible on screen (checkout modal).
export default function Receipt({ order, business, preview = false }) {
  if (!order) return null;
  const cur = business?.currency || "PKR";
  return (
    <div className={`receipt-print ${preview ? "receipt-preview" : ""}`}>
      <div className="r-center">
        <strong style={{ fontSize: "1.15em" }}>{business?.name}</strong>
        {business?.address && <div>{business.address}</div>}
        {business?.phone && <div>{business.phone}</div>}
      </div>
      <hr />
      <div className="r-row"><span>Order {order.order_number}</span><span>{new Date(order.created_at).toLocaleString()}</span></div>
      <div className="r-row"><span>Type</span><span>{TYPE[order.order_type] || order.order_type}{order.table_name ? ` · ${order.table_name}` : ""}</span></div>
      {order.customer_name && order.customer_name !== order.customer_phone && <div>Customer: {order.customer_name}</div>}
      {order.customer_phone && <div>Phone: {order.customer_phone}</div>}
      {order.delivery_address && <div>Address: {order.delivery_address}</div>}
      {order.created_by_name && <div>Served by: {order.created_by_name}</div>}
      <hr />
      {order.items.map((i) => (
        <div className="r-row" key={i.id}>
          <span>{i.quantity} x {i.product_name}</span>
          <span>{money(i.quantity * i.unit_price_cents, cur)}</span>
        </div>
      ))}
      <hr />
      <div className="r-row"><span>Subtotal</span><span>{money(order.subtotal_cents, cur)}</span></div>
      {order.discount_cents > 0 && <div className="r-row"><span>Discount</span><span>-{money(order.discount_cents, cur)}</span></div>}
      {order.tax_cents > 0 && <div className="r-row"><span>Tax</span><span>{money(order.tax_cents, cur)}</span></div>}
      <div className="r-row"><strong>TOTAL</strong><strong>{money(order.total_cents, cur)}</strong></div>
      {order.payment_method ? (
        <>
          <div className="r-row"><span>Paid by</span><span style={{ textTransform: "capitalize" }}>{order.payment_method}</span></div>
          {order.payment_method === "cash" && (
            <>
              <div className="r-row"><span>Cash received</span><span>{money(order.tendered_cents, cur)}</span></div>
              <div className="r-row"><span>Change</span><span>{money(order.change_cents, cur)}</span></div>
            </>
          )}
        </>
      ) : (
        <div className="r-row"><span>Status</span><span style={{ textTransform: "capitalize" }}>{order.status}</span></div>
      )}
      <hr />
      <div className="r-center">{business?.receipt_footer}</div>
    </div>
  );
}
