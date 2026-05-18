/** API may return snake_case or camelCase; actions normalize to this shape. */
export interface StockLevel {
  id: number;
  itemName: string;
  sku: string;
  unit: string;
  onHand: number;
  available: number;
}

export interface InventoryTransaction {
  id: string;
  type: string;
  source: string;
  destination: string;
  receiverName: string;
  date: string;
  status: string;
}
