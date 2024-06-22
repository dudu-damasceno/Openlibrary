// backend/src/services/prismaService.ts
import { PrismaClient, PrismaPromise } from '@prisma/client';

const prisma = new PrismaClient();

export const runQuery = async <T>(query: PrismaPromise<T[]>) => {
  try {
    const result = await query;
    return result;
  } catch (error) {
    throw new Error(`Erro ao executar a query: ${error}`);
  }
};

export default prisma;
