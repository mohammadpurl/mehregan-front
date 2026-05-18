
export interface warehouse  {
    name: string;
    code: string;
    price: string;
    category: string;
    description: string;
    stock: string;
    is_active: boolean;
    
}
export interface warehouseResponse  {
    data : warehouse[]
}