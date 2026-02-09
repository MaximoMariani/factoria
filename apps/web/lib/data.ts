import { prisma } from "@factoria/db/src/client";

export async function getCatalogData() {
  const [products, fabrics, trims, suppliers] = await Promise.all([
    prisma.product.findMany({ orderBy: { id: "asc" } }),
    prisma.fabric.findMany({ orderBy: { id: "asc" } }),
    prisma.trim.findMany({ orderBy: { id: "asc" } }),
    prisma.supplier.findMany({ orderBy: { id: "asc" } }),
  ]);

  return { products, fabrics, trims, suppliers };
}

export async function getProductions() {
  return prisma.production.findMany({
    include: { product: true, quantities: true },
    orderBy: { id: "desc" },
  });
}
