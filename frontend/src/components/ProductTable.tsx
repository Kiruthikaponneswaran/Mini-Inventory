import { formatDate, formatPrice } from "../lib/format";
import type { Product } from "../types";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="badge badge-danger">Out of stock</span>;
  if (stock <= 5) return <span className="badge badge-warn">{stock} · Low</span>;
  return <span>{stock}</span>;
}

/**
 * A real <table> on desktop. On narrow screens CSS turns each row into a card and
 * uses the data-label attributes as inline captions, so there's one markup for both.
 */
export function ProductTable({ products, onEdit, onDelete }: Props) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th className="num">Price</th>
            <th className="num">Stock</th>
            <th>Status</th>
            <th>Created</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td data-label="Name" className="cell-name">
                {p.name}
              </td>
              <td data-label="Category">{p.category_name}</td>
              <td data-label="Price" className="num">
                {formatPrice(p.price)}
              </td>
              <td data-label="Stock" className="num">
                <StockBadge stock={p.stock} />
              </td>
              <td data-label="Status">
                <span className={p.is_active ? "badge badge-ok" : "badge"}>
                  {p.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td data-label="Created">{formatDate(p.created_at)}</td>
              <td className="actions">
                <button className="btn btn-sm" onClick={() => onEdit(p)} aria-label={`Edit ${p.name}`}>
                  Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(p)} aria-label={`Delete ${p.name}`}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
