export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  /** DRF serialises decimals as strings, e.g. "24.99" */
  price: string;
  stock: number;
  category: number;
  category_name: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductPayload {
  name: string;
  price: string;
  stock: number;
  category: number;
  is_active: boolean;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductListParams {
  page: number;
  search: string;
  category: string;
}
