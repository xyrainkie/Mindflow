import { useState, useEffect, useMemo } from 'react';
import { Note, Category } from '../types';
import { apiService } from '../services/apiService';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.ALL);
  const [searchQuery, setSearchQuery] = useState('');

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getNotes({
        category: selectedCategory,
        search: searchQuery,
        limit: 100 // Load more notes at once for better UX
      });
      setNotes(response.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载笔记失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [selectedCategory, searchQuery]);

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by Category
    if (selectedCategory !== Category.ALL) {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        (note.title && note.title.toLowerCase().includes(q)) ||
        (note.content && note.content.toLowerCase().includes(q))
      );
    }

    // Sort by Date Desc
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, selectedCategory, searchQuery]);

  const createNote = async (noteData: {
    title: string;
    content: string;
    category: Category;
    tags?: string[];
  }) => {
    try {
      const response = await apiService.createNote(noteData);
      setNotes(prev => [response.note, ...prev]);
      return response.note;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建笔记失败');
      throw err;
    }
  };

  const updateNote = async (id: string, noteData: {
    title: string;
    content: string;
    category: Category;
    tags?: string[];
  }) => {
    try {
      const response = await apiService.updateNote(id, noteData);
      setNotes(prev => prev.map(n => n.id === id ? response.note : n));
      return response.note;
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新笔记失败');
      throw err;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await apiService.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除笔记失败');
      throw err;
    }
  };

  const refreshNotes = () => {
    loadNotes();
  };

  return {
    notes: filteredNotes,
    allNotes: notes,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes
  };
};