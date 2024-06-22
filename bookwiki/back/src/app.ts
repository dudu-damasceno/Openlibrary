import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getRelationshipsForTable, getAllTableNames, getTableAttributes, generateReport } from './controllers/resourceController';

declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
    }
  }
}

const app = express();
const prisma = new PrismaClient();

// Middleware para injetar o PrismaClient em todas as requisições
app.use((req: Request, res: Response, next) => {
  req.prisma = prisma;
  next();
});

// Middleware para analisar o corpo das requisições
app.use(express.json());

// Rota para buscar relacionamentos para uma tabela específica
app.get('/api/table/relationships/:tableName', async (req: Request, res: Response) => {
  const tableName = req.params.tableName;

  try {
    const relationships = await getRelationshipsForTable(tableName, req.prisma);
    if (!relationships) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    res.status(200).json(relationships);
  } catch (error) {
    console.error(`Erro ao buscar relacionamentos para a tabela ${tableName}:`, error);
    res.status(500).json({ error: `Erro ao buscar relacionamentos para a tabela ${tableName}` });
  }
});

// Rota para buscar todos os nomes de tabelas
app.get('/api/all-tables', async (req: Request, res: Response) => {
  try {
    const tableNames = await getAllTableNames(req.prisma);
    res.status(200).json(tableNames);
  } catch (error) {
    console.error('Erro ao buscar nomes das tabelas:', error);
    res.status(500).json({ error: 'Erro ao buscar nomes das tabelas' });
  }
});

// Rota para buscar atributos de uma tabela específica
app.get('/api/table/attributes/:tableName', async (req: Request, res: Response) => {
  const tableName = req.params.tableName;

  try {
    const attributes = await getTableAttributes(tableName);
    if (!attributes) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    res.status(200).json(attributes);
  } catch (error) {
    console.error(`Erro ao buscar atributos para a tabela ${tableName}:`, error);
    res.status(500).json({ error: `Erro ao buscar atributos para a tabela ${tableName}` });
  }
});

// Rota para gerar relatório
app.post('/api/generate-report', async (req: Request, res: Response) => {
  try {
    await generateReport(req, res); // Passe req e res para generateReport
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

export default app;
