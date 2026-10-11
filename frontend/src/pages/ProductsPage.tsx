import { useEffect, useState } from "react";

import { PAGE_SIZE } from "../api/products";
import { Layout } from "../components/Layout";
import { Pagination } from "../components/Pagination";
import { ProductTable } from "../components/ProductTable";
import { EmptyState, ErrorState, Spinner } from "../components/States";
import { useDebounce } from "../hooks/useDebounce";
import { useCategories, useProducts } from "../hooks/useProducts";
import { getErrorMessage, getStatus } from "../lib/errors";
import type { Product } from "../types";

export function ProductsPage() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 400);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  // Row actions are wired up in the next commit (form + delete confirmation).
  const [, setEditing] = useState<Product | "new" | null>(null);
  const [, setDeleting] = useState<Product | null>(null);

  // A new search or filter always starts from page 1.
  useEffect(() => setPage(1), [search, category]);

  const categories = useCategories();
  const products = useProducts({ page, search, category });

  // e.g. the last item on the last page was removed elsewhere: fall back instead of showing an error.
  useEffect(() => {
    if (products.isError && getStatus(products.error) === 404 && page > 1) setPage(page - 1);
  }, [products.isError, products.error, page]);

  const hasFilters = search !== "" || category !== "";
  const clearFilters = () => {
    setSearchInput("");
    setCategory("");
  };

  let content;
  if (products.isPending) {
    content = <Spinner label="Loading products…" />;
  } else if (products.isError) {
    content = <ErrorState message={getErrorMessage(products.error)} onRetry={() => products.refetch()} />;
  } else if (products.data.count === 0) {
    content = hasFilters ? (
      <EmptyState title="No products match your filters">
        <button className="btn" onClick={clearFilters}>
          Clear filters
        </button>
      </EmptyState>
    ) : (
      <EmptyState title="No products yet">
        <span className="muted">Add your first product to get started.</span>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          Add product
        </button>
      </EmptyState>
    );
  } else {
    content = (
      <>
        <div className={products.isPlaceholderData ? "fade" : undefined} aria-busy={products.isFetching}>
          <ProductTable products={products.data.results} onEdit={setEditing} onDelete={setDeleting} />
        </div>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={products.data.count}
          onChange={setPage}
          disabled={products.isPlaceholderData}
        />
      </>
    );
  }

  return (
    <Layout>
      <div className="page-head">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          + Add product
        </button>
      </div>

      <div className="toolbar">
        <div className="field grow">
          <label htmlFor="search" className="sr-only">
            Search products
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search by name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="category-filter" className="sr-only">
            Filter by category
          </label>
          <select
            id="category-filter"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={categories.isPending}
          >
            <option value="">All categories</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {categories.isError && (
        <div className="alert alert-error" role="alert">
          Couldn't load categories.{" "}
          <button className="link" onClick={() => categories.refetch()}>
            Retry
          </button>
        </div>
      )}

      <section className="card">{content}</section>
    </Layout>
  );
}
