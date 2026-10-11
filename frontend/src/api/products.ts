import type { Category, Paginated, Product, ProductListParams, ProductPayload } from "../types";
import { api } from "./client";

export const PAGE_SIZE = 10;

export async function listProducts({ page, search, category }: ProductListParams): Promise<Paginated<Product>> {
  const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
  if (search) params.search = search;
  if (category) params.category = category;
  const { data } = await api.get<Paginated<Product>>("/products/", { params });
  return data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const { data } = await api.post<Product>("/products/", payload);
  return data;
}

export async function updateProduct(id: number, payload: ProductPayload): Promise<Product> {
  const { data } = await api.put<Product>(`/products/${id}/`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}/`);
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories/");
  return data;
}
