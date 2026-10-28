// `perm` = permission key(s) the user needs (any of them). The owner has every permission.
export const NAV_GROUPS = [
  {
    title: "Daily",
    items: [
      { path: "/dashboard", label: "Home", perm: "dashboard" },
      { path: "/dashboard/checkout", label: "Checkout", perm: "checkout" },
      { path: "/dashboard/floor-plan", label: "Floor plan", perm: ["floor_plan", "tables_edit"] },
      { path: "/dashboard/orders", label: "Orders", perm: "orders" },
    ],
  },
  {
    title: "Management",
    items: [
      { path: "/dashboard/inventory", label: "Inventory", perm: "inventory" },
      { path: "/dashboard/customers", label: "Customers", perm: "customers" },
      { path: "/dashboard/finance", label: "Finance", perm: "finance" },
      { path: "/dashboard/analytics", label: "Analytics", perm: "analytics" },
    ],
  },
  {
    title: "Settings",
    items: [
      { path: "/dashboard/users", label: "Users", perm: "users" },
      { path: "/dashboard/settings", label: "Settings", perm: "settings" },
      { path: "/dashboard/help", label: "Help", perm: ["dashboard", "checkout", "orders", "inventory", "customers", "finance", "analytics", "floor_plan", "users"] },
    ],
  },
];
