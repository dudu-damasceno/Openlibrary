import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getDMMF } from "@prisma/internals";

const prisma = new PrismaClient(); // Inicializa o PrismaClient

// Função para obter relacionamentos para uma tabela específica
export const getRelationshipsForTable = async (
  tableName: string,
  prismaClient: PrismaClient
) => {
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
        relatedTable: dmmf.datamodel.models.find(
          (m: any) => m.name === field.type
        )?.name,
      }));

    return relations;
  } catch (error) {
    console.error(
      `Erro ao buscar relacionamentos para a tabela ${tableName}:`,
      error
    );
    throw error;
  }
};

// Função para obter todos os nomes de tabelas
export const getAllTableNames = async (prismaClient: PrismaClient) => {
  try {
    const dmmf = await getDMMF({ datamodelPath: "prisma/schema.prisma" });
    return dmmf.datamodel.models.map((model: any) => model.name);
  } catch (error) {
    console.error("Erro ao buscar nomes das tabelas:", error);
    throw error;
  }
};

// Função para buscar atributos de uma tabela específica
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
    console.error(
      `Erro ao buscar atributos para a tabela ${tableName}:`,
      error
    );
    throw error;
  }
};

// Função auxiliar para obter o cliente Prisma correto baseado no nome da tabela
const getPrismaClient = (tableName: string) => {
  const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
  return (prisma as any)[modelName];
};

// Função para buscar recursos específicos
export const getResources = async (req: Request, res: Response) => {
  const resource = req.params.resource;

  try {
    let result: any[] = [];
    const prismaClient = getPrismaClient(resource);

    if (!prismaClient) {
      return res.status(404).json({ error: "Recurso não encontrado" });
    }

    result = await prismaClient.findMany();

    res.status(200).json(result);
  } catch (error) {
    console.error(`Erro ao buscar ${resource}:`, error);
    res.status(500).json({ error: `Erro ao buscar ${resource}` });
  }
};

// Função para gerar relatório com base nas opções selecionadas pelo usuário
export const generateReport = async (req: Request, res: Response) => {
  const { tableName, filter, attributes, orderBy, limit } = req.body;
  console.log("Dados recebidos:", req.body);
  console.log("Relacionamento:", filter?.relationship);
  console.log("Filtros:", filter);
  console.log("Ordenação:", orderBy);
  console.log("Limite:", limit);
  try {
    const prismaClient = getPrismaClient(tableName);

    if (!prismaClient) {
      return res.status(404).json({ error: "Tabela não encontrada" });
    }

    // Limpa os nomes dos atributos para remover o prefixo da tabela
    const cleanedAttributes = attributes.map((attr: string) =>
      attr.split(".").pop()
    );

    // Base da consulta Prisma
    const query: any = {
      select: cleanedAttributes.reduce((acc: any, attr: string) => {
        acc[attr] = true;
        return acc;
      }, {}),
    };

    // Verifica se há filtros para adicionar à consulta
    if (filter && filter.field && filter.operator && filter.value) {
      const field = filter.field.split(".").pop();
      const { operator, value } = filter;

      query.where = {};
      switch (operator) {
        case "equals":
          query.where[field] = parseValue(field, value);
          break;
        case "not equals":
          query.where[field] = { not: parseValue(field, value) };
          break;
        case "contains":
          query.where[field] = { contains: value };
          break;
        case "starts with":
          query.where[field] = { startsWith: value };
          break;
        case "ends with":
          query.where[field] = { endsWith: value };
          break;
        case "greater than":
          query.where[field] = { gt: parseValue(field, value) };
          break;
        case "less than":
          query.where[field] = { lt: parseValue(field, value) };
          break;
        default:
          throw new Error(`Operador '${operator}' não suportado`);
      }
    }

    // Adiciona a ordenação se estiver presente
    if (orderBy) {
      query.orderBy = { [orderBy.split(".").pop()]: "asc" }; // Pode ser modificado conforme necessário
    }

    // Adiciona o limite se estiver presente
    if (limit) {
      query.take = limit;
    }

    // Adiciona os relacionamentos se estiverem presentes
    if (filter?.relationship) {
      query.include = {
        [filter.relationship]: true,
      };
    }

    // Executa a consulta Prisma
    const reportData = await prismaClient.findMany(query);
    console.log(query); // Log da consulta gerada
    res.status(200).json(reportData);
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
};

// Função auxiliar para converter o valor para o tipo apropriado baseado no campo
const parseValue = (field: string, value: any) => {
  if (field.endsWith("_id")) {
    return parseInt(value, 10);
  }
  return value;
};
