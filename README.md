# Tillo: POS for Food & Hospitality

A multi-tenant SaaS point of sale for food and hospitality shops. One app serves many shops. Each shop only sees its own data.

## Stack
- Frontend: React (Vite), React Router
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL on Neon
- Hosting: Vercel (frontend and backend as separate projects)

## Rules that must never be broken
- Prices and money are stored as whole numbers (minor units), never decimals.
- Every database query on shop data must filter by the logged-in user's business_id.
- Hiding a page in React is not security. The API must check the session on every request.
- Do not show a feature as working before it works. Unfinished pages say "Soon".

## Business types (one modular app)
Restaurant and Cafe, Fast Food, Bakery, Juice and Beverage, Ice Cream and Dessert, Catering, Food Truck and Takeaway.

## Pages

Sidebar order: Daily, Money, Growth, Admin.

### Daily

**Home** (built)
- Purpose: first screen after login, a quick look at today.
- Contains: setup checklist now. Later: today's sales, order count, cash vs card, last 5 orders, top items, "New Sale" button.
- Handles: read-only summary data.

**Checkout** (not built, most important page)
- Purpose: where cashiers make sales all day. Must be fast and work on tablet and phone.
- Contains: category tabs, item grid with search, cart, quantity change, item notes, order type (dine-in, takeaway, delivery), coupon field, tax and total, payment (cash with change, or card), receipt, hold and resume order.
- Handles: creating orders and order items, payments, tax calculation.

**Orders** (not built)
- Purpose: see and manage all orders and fix mistakes.
- Contains: order list with filters, order detail, status (open, paid, cancelled, refunded), cancel and refund (owner or manager only), reprint receipt.
- Handles: order status changes and refunds.

**Products** (not built)
- Purpose: the menu. Checkout sells whatever is set up here.
- Contains: categories (add, edit, order, hide), items (name, price, category, photo, on/off switch), search and filter. Later: sizes, add-ons, stock.
- Handles: categories and products tables.

### Money

**Finance** (not built)
- Purpose: the money side, so the owner can match numbers to the cash drawer.
- Contains (v1): daily summary (gross sales, discounts, refunds, tax collected, net sales), cash vs card totals, end-of-day cash count with mismatch check. Later: expenses and profit.
- Handles: totals calculated from orders and payments.

**Transactions** (not built)
- Purpose: the raw list of every payment, like a bank statement.
- Contains: payment list (time, order number, amount, method, cashier), filters, CSV export, refunds shown separately.
- Handles: read-only payment records.

**Analytics** (not built)
- Purpose: trends for decisions, not daily counting.
- Contains: sales by day, week and month, best and worst items, busiest hours, sales by category and cashier.
- Handles: reports. Needs real sales data first, so it is built late.

### Growth

**Coupons** (not built)
- Purpose: discounts that cashiers apply at Checkout.
- Contains: create code (percentage or fixed), start and end date, usage limit, minimum order, on/off switch, usage count.
- Handles: coupons table and validation at checkout.

**Customers** (not built, optional for v1)
- Purpose: a simple list of people who buy from the shop.
- Contains: name, phone, order count, total spent, history, attach customer to an order.
- Handles: customers table linked to orders.

### Admin

**Users** (not built)
- Purpose: manage staff who log in.
- Contains: add cashier or manager, roles (owner, manager, cashier), deactivate user, last login.
- Handles: needs a link between users and shops with a role. v1 may stay owner-only.

**Settings** (not built)
- Purpose: shop configuration.
- Contains: shop name, address, phone, logo, currency, tax rate, receipt header and footer, enabled order types and payment methods. Later: printer setup and subscription.
- Handles: updates to the businesses table.

**Help** (not built)
- Purpose: answers for owners so support is not needed for every question.
- Contains: short guides (add items, make a sale, refund), contact support, FAQ.
- Handles: static content.

## Build order
1. Sidebar frame (done), Products, Checkout, Orders, Home summary
2. Settings, Users, Finance summary
3. Transactions, Coupons, Customers
4. Analytics, Help

## Already built
- Signup with email code, login, password reset, logout
- Shop setup (business type, name, country, currency)
- Dashboard frame with sidebar

## Not built yet
- Everything marked "not built" above
- Billing and trial limits
- Offline mode and printer support
- Terms and Privacy pages