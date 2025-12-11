import { Response } from 'express';
import { prisma } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const createSchema = z.object({
  amount: z.number().finite(),
  currency: z.string().min(1).max(8).default('CNY'),
  category: z.string().min(1).max(64),
  note: z.string().max(512).optional(),
  occurredAt: z.string().datetime().optional()
});

export const listTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10);
    const limit = parseInt(String(req.query.limit || '50'), 10);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user!.id },
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId: req.user!.id } })
    ]);

    res.json({ items, total, page, limit });
  } catch (e) {
    res.status(500).json({ error: '获取交易列表失败' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: '请求参数不合法' });
      return;
    }
    const data = parsed.data;
    const tx = await prisma.transaction.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        note: data.note ?? null,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
        userId: req.user!.id,
      },
    });
    res.status(201).json({ message: '创建成功', transaction: tx });
  } catch (e) {
    res.status(500).json({ error: '创建交易失败' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const parsed = createSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: '请求参数不合法' });
      return;
    }
    const data = parsed.data;
    const tx = await prisma.transaction.update({
      where: { id },
      data: {
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
        ...(data.occurredAt !== undefined ? { occurredAt: new Date(data.occurredAt) } : {}),
      },
    });
    res.json({ message: '更新成功', transaction: tx });
  } catch (e) {
    res.status(500).json({ error: '更新交易失败' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    await prisma.transaction.delete({ where: { id } });
    res.json({ message: '删除成功' });
  } catch (e) {
    res.status(500).json({ error: '删除交易失败' });
  }
};
