import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as api from "../api/products";
import type { ProductListParams, ProductPayload } from "../types";

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => api.listProducts(params),
    // Keep showing the previous page while the next loads: no flash of spinner on paging/typing.
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: api.listCategories,
    staleTime: 5 * 60_000,
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: ProductPayload }) =>
      id === undefined ? api.createProduct(payload) : api.updateProduct(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
