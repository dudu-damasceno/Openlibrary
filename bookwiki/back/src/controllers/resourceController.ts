import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getDMMF } from "@prisma/internals";

const prisma = new PrismaClient();

export const getRelationshipsForTable = async (tableName: string, prismaClient: PrismaClient) => {
  try {
    const dmmf = await getDMMF({ datamodelPath: "prisma/schema.prisma" });
    const model = dmmf.datamodel.models.find((m: any) => m.name === tableName);

    if (!model) {
      return null;
    }

    const relations = model.fields
      .filter((field: any) => field.relationName)
      .map((field: any) => ({
        field: field.name,
        relation: field.type,
        relatedTable: dmmf.datamodel.models.find((m: any) => m.name === field.type)?.name,
      }));

    return relations;
  } catch (error) {
    console.error(`Erro ao buscar relacionamentos para a tabela ${tableName}:`, error);
    throw error;
  }
};

export const getAllTableNames = async (prismaClient: PrismaClient) => {
  try {
    const dmmf = await getDMMF({ datamodelPath: "prisma/schema.prisma" });
    return dmmf.datamodel.models.map((model: any) => model.name);
  } catch (error) {
    console.error("Erro ao buscar nomes das tabelas:", error);
    throw error;
  }
};

export const getTableAttributes = async (tableName: string) => {
  try {
    const dmmf = await getDMMF({ datamodelPath: "prisma/schema.prisma" });
    const model = dmmf.datamodel.models.find((m: any) => m.name === tableName);

    if (!model) {
      return null;
    }

    const attributes = model.fields
      .filter((field: any) => !field.relationName)
      .map((field: any) => field.name);

    return attributes;
  } catch (error) {
    console.error(`Erro ao buscar atributos para a tabela ${tableName}:`, error);
    throw error;
  }
};

const getPrismaClient = (tableName: string) => {
  const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
  return (prisma as any)[modelName];
};

const parseValue = (field: string, value: any) => {
  if (typeof value === 'string' && !isNaN(Number(value))) {
    return parseInt(value, 10);
  }
  return value;
};

const getValidFieldForRelation = async (relationName: string) => {
  const dmmf = await getDMMF({ datamodelPath: "prisma/schema.prisma" });
  const model = dmmf.datamodel.models.find((m: any) => m.name === relationName);

  if (!model) {
    throw new Error(`Relacionamento '${relationName}' não encontrado`);
  }

  const validField = model.fields.find((field: any) => !field.relationName);
  if (!validField) {
    throw new Error(`Nenhum campo válido encontrado para o relacionamento '${relationName}'`);
  }

  return validField.name;
};

export const generateReport = async (req: Request, res: Response) => {
  const { tableName, filters, attributes, relationshipAttributes, orderBy, orderDirection, limit, relationships } = req.body;
  console.log("Dados recebidos:", req.body);

  try {
    const prismaClient = getPrismaClient(tableName);

    if (!prismaClient) {
      return res.status(404).json({ error: "Tabela não encontrada" });
    }

    const query: any = {};

    if (attributes.length > 0) {
      query.select = {};

      attributes.forEach((attr: string | number) => {
        if (typeof attr === 'string') {
          const [modelAttr, relationAttr] = attr.split(".");

          if (relationAttr) {
            if (!query.select[modelAttr]) {
              query.select[modelAttr] = { select: {} };
            }
            query.select[modelAttr].select[relationAttr] = true;
          } else {
            query.select[attr] = true;
          }
        }
      });
    }

    if (relationships.length > 0 && relationshipAttributes) {
      for (const rel of relationships) {
        if (!query.select[rel]) {
          query.select[rel] = { select: {} };
        }
        if (relationshipAttributes[rel]?.length > 0) {
          relationshipAttributes[rel].forEach((attr: string | number) => {
            query.select[rel].select[attr] = true;
          });
        } else {
          const validField = await getValidFieldForRelation(rel);
          query.select[rel].select[validField] = true;
        }
      }
    }

    if (filters && filters.length > 0) {
      query.where = {};

      filters.forEach((filter: any) => {
        const { field, operator, value, tableName: filterTable } = filter;

        const parsedValue = parseValue(field, value);

        if (filterTable === tableName) {
          query.where[field] = buildFilterCondition(operator, parsedValue);
        } else {
          if (!query.where[filterTable]) {
            query.where[filterTable] = {};
          }
          query.where[filterTable][field] = buildFilterCondition(operator, parsedValue);
        }
      });
    }

    if (orderBy && orderDirection) {
      query.orderBy = { [orderBy.split(".").pop()]: orderDirection.toLowerCase() as "asc" | "desc" };
    }

    if (limit) {
      query.take = limit;
    }

    console.log("Query final:", query);

    const reportData = await prismaClient.findMany(query);
    console.log("Resultado da consulta:", reportData);

    const mappedReportData = await Promise.all(reportData.map(async (item: any) => {
      if (tableName === 'livro') {
        if (item.livro_autor) {
          const livroAutorDetails = await Promise.all(item.livro_autor.map(async (la: any) => {
            const autorDetails = await prisma.autor.findUnique({
              where: { autor_key: la.autor_key }
            });
            return { ...la, autor: autorDetails };
          }));
          return { ...item, livro_autor: livroAutorDetails };
        }
      } else if (tableName === 'autor' || tableName === 'categoria') {
        if (item.livro_autor) {
          const livroDetails = await Promise.all(item.livro_autor.map(async (la: any) => {
            const livroDetails = await prisma.livro.findUnique({
              where: { livro_key: la.livro_key }
            });
            return { ...la, livro: livroDetails };
          }));
          return { ...item, livro_autor: livroDetails };
        }
      }

      return item; // Retorna o item original se não for 'livro', 'autor' ou 'categoria'
    }));

    const formattedReportData = mappedReportData.map((item: any) => {
      const formattedItem: any = { ...item };

      Object.keys(formattedItem).forEach(key => {
        if (Array.isArray(formattedItem[key])) {
          formattedItem[key] = formattedItem[key].map((relationItem: any) => {
            if (relationItem && typeof relationItem === 'object') {
              return { ...relationItem };
            }
            return relationItem;
          });
        }
      });

      return formattedItem;
    });

    res.status(200).json(formattedReportData);
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
};

function buildFilterCondition(operator: string, value: any) {
  switch (operator) {
    case "equals":
      return value;
    case "not equals":
      return { not: value };
    case "contains":
      return { contains: value };
    case "starts with":
      return { startsWith: value };
    case "ends with":
      return { endsWith: value };
    case "greater than":
      return { gt: value };
    case "less than":
      return { lt: value };
    default:
      throw new Error(`Operador '${operator}' não suportado`);
  }
}

export default generateReport;
