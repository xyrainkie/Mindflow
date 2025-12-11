import { Response } from 'express';
import { prisma } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

enum Category {
  ALL = 'ALL',
  WORK = 'WORK',
  KNOWLEDGE = 'KNOWLEDGE',
  LIFE = 'LIFE',
  MEMO = 'MEMO'
}

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;

    const where: any = {
      userId: req.user!.id,
    };

    if (category && category !== 'ALL') {
      where.category = category as Category;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive' as const
          }
        },
        {
          content: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: {
        updatedAt: 'desc'
      },
    });

    const notesWithFormattedDates = notes.map((note: any) => ({
      ...note,
      createdAt: note.createdAt.getTime(),
      updatedAt: note.updatedAt.getTime(),
      tags: [] // Simplified: empty tags for now
    }));

    res.json({
      notes: notesWithFormattedDates,
      pagination: {
        page: 1,
        limit: 100,
        total: notes.length,
        pages: 1
      }
    });

  } catch (error) {
    console.error('获取笔记错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};

export const getNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: '笔记ID是必需的' });
      return;
    }

    const note = await prisma.note.findFirst({
      where: {
        id: id!,
        userId: req.user!.id,
      },
    });

    if (!note) {
      res.status(404).json({ error: '笔记不存在' });
      return;
    }

    const noteWithFormattedDates = {
      ...note,
      createdAt: note.createdAt.getTime(),
      updatedAt: note.updatedAt.getTime(),
      tags: [] // Simplified: empty tags for now
    };

    res.json(noteWithFormattedDates);

  } catch (error) {
    console.error('获取单个笔记错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category = Category.MEMO } = req.body;

    const note = await prisma.note.create({
      data: {
        title: title || '',
        content,
        category,
        userId: req.user!.id,
      },
    });

    const noteWithFormattedDates = {
      ...note,
      createdAt: note.createdAt.getTime(),
      updatedAt: note.updatedAt.getTime(),
      tags: [] // Simplified: empty tags for now
    };

    res.status(201).json({
      message: '笔记创建成功',
      note: noteWithFormattedDates
    });

  } catch (error) {
    console.error('创建笔记错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;

    if (!id) {
      res.status(400).json({ error: '笔记ID是必需的' });
      return;
    }

    const existingNote = await prisma.note.findFirst({
      where: {
        id: id!,
        userId: req.user!.id,
      },
    });

    if (!existingNote) {
      res.status(404).json({ error: '笔记不存在' });
      return;
    }

    const updatedNote = await prisma.note.update({
      where: { id: id! },
      data: {
        title,
        content,
        category,
      },
    });

    const noteWithFormattedDates = {
      ...updatedNote,
      createdAt: updatedNote.createdAt.getTime(),
      updatedAt: updatedNote.updatedAt.getTime(),
      tags: [] // Simplified: empty tags for now
    };

    res.json({
      message: '笔记更新成功',
      note: noteWithFormattedDates
    });

  } catch (error) {
    console.error('更新笔记错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: '笔记ID是必需的' });
      return;
    }

    const existingNote = await prisma.note.findFirst({
      where: {
        id: id!,
        userId: req.user!.id,
      },
    });

    if (!existingNote) {
      res.status(404).json({ error: '笔记不存在' });
      return;
    }

    await prisma.note.delete({
      where: { id: id! }
    });

    res.json({ message: '笔记删除成功' });

  } catch (error) {
    console.error('删除笔记错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};