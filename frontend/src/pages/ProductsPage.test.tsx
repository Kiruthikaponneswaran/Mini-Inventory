import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as productsApi from "../api/products";
import { AuthProvider } from "../auth/AuthContext";
import { tokenStorage } from "../lib/tokenStorage";
import type { Paginated, Product } from "../types";
import { ProductsPage } from "./ProductsPage";

vi.mock("../api/products", async (importOriginal) => ({
  ...(await importOriginal<typeof productsApi>()),
  listProducts: vi.fn(),
  listCategories: vi.fn(),
  deleteProduct: vi.fn(),
}));

const product = (id: number, name: string): Product => ({
  id, name, price: "10.00", stock: 10, category: 1, category_name: "Electronics",
  is_active: true, created_at: "2025-01-01T00:00:00Z",
});
const page = (results: Product[]): Paginated<Product> => ({ count: results.length, next: null, previous: null, results });

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider>
          <ProductsPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    tokenStorage.setSession("a", "r", "demo");
    vi.mocked(productsApi.listCategories).mockResolvedValue([{ id: 1, name: "Electronics" }]);
  });

  it("shows a loading state, then the rows", async () => {
    vi.mocked(productsApi.listProducts).mockResolvedValue(page([product(1, "Mouse"), product(2, "Keyboard")]));
    renderPage();
    expect(screen.getByText("Loading products…")).toBeInTheDocument();
    expect(await screen.findByText("Mouse")).toBeInTheDocument();
    expect(screen.getByText("Keyboard")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.mocked(productsApi.listProducts).mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText("No products yet")).toBeInTheDocument();
  });

  it("shows an error state with a working retry", async () => {
    vi.mocked(productsApi.listProducts).mockRejectedValueOnce(new Error("boom")).mockResolvedValue(page([product(1, "Mouse")]));
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't load");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Mouse")).toBeInTheDocument();
  });

  it("debounces search: one request after typing stops, not one per keystroke", async () => {
    vi.mocked(productsApi.listProducts).mockResolvedValue(page([product(1, "Mouse")]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Mouse");
    vi.mocked(productsApi.listProducts).mockClear();

    await user.type(screen.getByLabelText("Search products"), "mouse");
    expect(productsApi.listProducts).not.toHaveBeenCalled(); // still inside the debounce window

    await waitFor(() => expect(productsApi.listProducts).toHaveBeenCalledTimes(1), { timeout: 1500 });
    expect(productsApi.listProducts).toHaveBeenCalledWith(expect.objectContaining({ search: "mouse", page: 1 }));
  });

  it("requires confirmation before deleting", async () => {
    vi.mocked(productsApi.listProducts).mockResolvedValue(page([product(1, "Mouse")]));
    vi.mocked(productsApi.deleteProduct).mockResolvedValue();
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Delete Mouse" }));
    expect(productsApi.deleteProduct).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(productsApi.deleteProduct).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete Mouse" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(productsApi.deleteProduct).toHaveBeenCalledWith(1));
  });
});
