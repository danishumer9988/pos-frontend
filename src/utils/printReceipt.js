export function printReceipt(setOrder, order) {
  setOrder(order);
  setTimeout(() => window.print(), 80); // let React render the receipt first
}
