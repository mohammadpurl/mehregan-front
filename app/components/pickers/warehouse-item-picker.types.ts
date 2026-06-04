export type WarehouseItemSelection = {
  itemId: number;
  itemName: string;
  quantity: number;
  description?: string;
};

export type WarehouseItemSelectionMap = Record<number, WarehouseItemSelection>;

export type WarehouseCatalogItem = {
  itemId: number;
  itemName: string;
  sku?: string | null;
  unit?: string | null;
  warehouseId?: number | null;
  warehouseName?: string | null;
  onHand: number;
  hasStockRecord?: boolean;
};
