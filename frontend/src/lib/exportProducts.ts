import { api } from "../api/client";
import { formatDate } from "./format";

type ExportFilters = { search?: string; category?: string };

type ProductRow = {
  id: number;
  name: string;
  category_name: string;
  price: string;
  stock: number;
  is_active: boolean;
  created_at: string;
};

type Page = { next: string | null; results: ProductRow[] };

// The API is paginated (max 100 per page), so fetch every page with the same filters as the table.
async function fetchAllProducts(filters: ExportFilters): Promise<ProductRow[]> {
  const rows: ProductRow[] = [];
  let page = 1;
  for (;;) {
    const { data } = await api.get<Page>("/products/", {
      params: {
        search: filters.search || undefined,
        category: filters.category || undefined,
        page,
        page_size: 100,
      },
    });
    rows.push(...data.results);
    if (!data.next) break;
    page += 1;
  }
  return rows;
}

export async function exportProductsToExcel(filters: ExportFilters) {
  const products = await fetchAllProducts(filters);

  // Load the Excel library only when the button is clicked
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  const ws = wb.addWorksheet("Products");

  ws.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Name", key: "name", width: 32 },
    { header: "Category", key: "category", width: 20 },
    { header: "Price (AED)", key: "price", width: 14, style: { numFmt: "#,##0.00" } },
    { header: "Stock", key: "stock", width: 10 },
    { header: "Status", key: "status", width: 12 },
    { header: "Created", key: "created", width: 22 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  for (const p of products) {
    ws.addRow({
      id: p.id,
      name: p.name,
      category: p.category_name,
      price: Number(p.price),
      stock: p.stock,
      status: p.is_active ? "Active" : "Inactive",
      created: formatDate(p.created_at),
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}