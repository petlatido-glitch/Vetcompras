import { prisma } from "@/lib/prisma";

const ALIAS_GROUPS = [
  ["dipirona", "metamizol", "dipirona sodica", "dipirona sódica", "genfar dipirona"],
  ["amoxicilina", "amoxilina", "amoxil", "amoxicilina trihidratada"],
  ["carprofeno", "rimadyl"],
  ["enrofloxacino", "baytril"],
  ["cefalexina", "keflex"],
  ["ketoprofeno", "ketofen"],
  ["ibuprofeno", "ibupril"]
];

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getAliasTerms(query: string) {
  const normalized = normalizeText(query);
  const tokens = normalized.split(" ").filter((token) => token.length >= 3);
  const terms = new Set<string>([normalized, ...tokens]);

  for (const group of ALIAS_GROUPS) {
    const normalizedGroup = group.map(normalizeText);
    if (normalizedGroup.some((term) => tokens.includes(term))) {
      normalizedGroup.forEach((term) => terms.add(term));
    }
  }

  return Array.from(terms).filter(Boolean);
}

export function scoreMatch(query: string, sources: string[]) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  const queryTokens = new Set(normalizedQuery.split(" ").filter((token) => token.length >= 3));
  let score = 0;

  for (const source of sources) {
    const normalizedSource = normalizeText(source);
    if (!normalizedSource) continue;

    if (normalizedSource === normalizedQuery) score += 50;
    if (normalizedSource.includes(normalizedQuery)) score += 30;
    if (normalizedQuery.includes(normalizedSource) && normalizedSource.length > 3) score += 20;

    const sourceTokens = normalizedSource.split(" ");
    for (const token of queryTokens) {
      if (sourceTokens.includes(token)) score += 10;
      else if (sourceTokens.some((t) => t.startsWith(token) || token.startsWith(t))) score += 5;
    }
  }

  return score;
}

export async function findBestProductMatch(query: string) {
  const searchTerms = getAliasTerms(query);

  const productCandidates = await prisma.producto.findMany({
    where: {
      OR: searchTerms.flatMap((term) => [
        { nombre: { contains: term, mode: "insensitive" } },
        { marca: { contains: term, mode: "insensitive" } },
        { laboratorio: { contains: term, mode: "insensitive" } },
        { presentacion: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } }
      ])
    },
    take: 80
  });

  const itemCandidates = await prisma.cotizacionItem.findMany({
    where: {
      AND: [
        { productoId: { not: "" } },
        {
          OR: searchTerms.flatMap((term) => [
            { nombreDetectado: { contains: term, mode: "insensitive" } },
            { producto: { nombre: { contains: term, mode: "insensitive" } } },
            { producto: { marca: { contains: term, mode: "insensitive" } } } ,
            { producto: { laboratorio: { contains: term, mode: "insensitive" } } }
          ])
        }
      ]
    },
    include: { producto: true },
    take: 120
  });

  const candidates: Array<{
    productoId: string;
    productoNombre: string | null;
    score: number;
    source: "product" | "item";
  }> = [];

  for (const product of productCandidates) {
    const score = scoreMatch(query, [product.nombre ?? "", product.marca ?? "", product.laboratorio ?? "", product.presentacion ?? ""]);
    candidates.push({
      productoId: product.id,
      productoNombre: product.nombre,
      score,
      source: "product"
    });
  }

  for (const item of itemCandidates) {
    const score = scoreMatch(query, [item.nombreDetectado ?? "", item.producto?.nombre ?? "", item.producto?.marca ?? "", item.producto?.laboratorio ?? ""]);
    if (item.productoId) {
      candidates.push({
        productoId: item.productoId,
        productoNombre: item.producto?.nombre ?? null,
        score,
        source: "item"
      });
    }
  }

  if (candidates.length === 0) {
    const fallbackProducts = await prisma.producto.findMany({ take: 80 });
    const fallbackItems = await prisma.cotizacionItem.findMany({ where: { productoId: { not: "" } }, include: { producto: true }, take: 120 });

    for (const product of fallbackProducts) {
      const score = scoreMatch(query, [product.nombre ?? "", product.marca ?? "", product.laboratorio ?? "", product.presentacion ?? ""]);
      if (score > 0) {
        candidates.push({ productoId: product.id, productoNombre: product.nombre, score, source: "product" });
      }
    }
    for (const item of fallbackItems) {
      const score = scoreMatch(query, [item.nombreDetectado ?? "", item.producto?.nombre ?? "", item.producto?.marca ?? "", item.producto?.laboratorio ?? ""]);
      if (score > 0 && item.productoId) {
        candidates.push({ productoId: item.productoId, productoNombre: item.producto?.nombre ?? null, score, source: "item" });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}
