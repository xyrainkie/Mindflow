import React, { useState, useEffect } from 'react';
import { Todo, TodoPriority } from '../types';
import {
  PlusIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
  CalendarIcon,
  ChevronLeftIcon
} from './Icons';

interface TodoListProps {
  onBack?: () => void;
}

const TodoList: React.FC<TodoListProps> = ({ onBack }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TodoPriority>(TodoPriority.MEDIUM);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Load todos from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // Save todos to localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now().toString(),
        title: newTodo.trim(),
        description: newDescription.trim(),
        completed: false,
        priority: newPriority,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setTodos([todo, ...todos]);
      setNewTodo('');
      setNewDescription('');
      setNewPriority(TodoPriority.MEDIUM);
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed, updatedAt: Date.now() }
        : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
  };

  const saveEdit = () => {
    if (editingTodo && editTitle.trim()) {
      setTodos(todos.map(todo =>
        todo.id === editingTodo
          ? {
              ...todo,
              title: editTitle.trim(),
              description: editDescription.trim(),
              updatedAt: Date.now()
            }
          : todo
      ));
      setEditingTodo(null);
      setEditTitle('');
      setEditDescription('');
    }
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setEditTitle('');
    setEditDescription('');
  };

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case TodoPriority.URGENT:
        return 'bg-red-100 text-red-700 border-red-300';
      case TodoPriority.HIGH:
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case TodoPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case TodoPriority.LOW:
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: TodoPriority) => {
    switch (priority) {
      case TodoPriority.URGENT:
        return '紧急';
      case TodoPriority.HIGH:
        return '高';
      case TodoPriority.MEDIUM:
        return '中';
      case TodoPriority.LOW:
        return '低';
      default:
        return '中';
    }
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'pending':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-emerald-200 to-teal-200">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg border-b-4 border-black p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {onBack && (
              <button
                onClick={onBack}
                className="mr-4 p-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-3xl font-black text-gray-800 flex items-center">
              <span className="text-3xl mr-2">✅</span>
              待办清单
            </h1>
          </div>
          <div className="flex items-center space-x-4 text-sm font-medium">
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg border-2 border-blue-200">
              总计: {stats.total}
            </div>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg border-2 border-green-200">
              完成: {stats.completed}
            </div>
            <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg border-2 border-orange-200">
              待办: {stats.pending}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Todo Form */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-6 sticky top-6">
              <h2 className="text-xl font-black text-gray-800 mb-4">添加新任务</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="任务标题..."
                  className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-200 font-medium"
                />

                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="任务描述（可选）..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-200 font-medium resize-none"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    优先级
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TodoPriority)}
                    className="w-full px-4 py-3 border-2 border-black rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-200 font-medium"
                  >
                    <option value={TodoPriority.LOW}>低优先级</option>
                    <option value={TodoPriority.MEDIUM}>中优先级</option>
                    <option value={TodoPriority.HIGH}>高优先级</option>
                    <option value={TodoPriority.URGENT}>紧急</option>
                  </select>
                </div>

                <button
                  onClick={addTodo}
                  disabled={!newTodo.trim()}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-black py-3 rounded-2xl border-4 border-black disabled:border-gray-400 transition-colors flex items-center justify-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  添加任务
                </button>
              </div>
            </div>
          </div>

          {/* Todo List */}
          <div className="lg:col-span-2">
            {/* Filter Tabs */}
            <div className="bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-2 mb-6">
              <div className="flex space-x-2">
                {['all', 'pending', 'completed'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption as 'all' | 'pending' | 'completed')}
                    className={`
                      flex-1 py-3 px-4 rounded-2xl font-medium transition-all
                      ${filter === filterOption
                        ? 'bg-black text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {filterOption === 'all' ? '全部' : filterOption === 'pending' ? '待办' : '已完成'}
                  </button>
                ))}
              </div>
            </div>

            {/* Todo Items */}
            <div className="space-y-4">
              {filteredTodos.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-12 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">
                    {filter === 'completed' ? '没有已完成的任务' :
                     filter === 'pending' ? '没有待办任务' : '还没有任务'}
                  </h3>
                  <p className="text-gray-600">
                    {filter === 'all' ? '添加你的第一个任务开始吧！' :
                     '切换到其他筛选条件查看更多任务'}
                  </p>
                </div>
              ) : (
                filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-6 transition-all ${
                      todo.completed ? 'opacity-75' : ''
                    }`}
                  >
                    {editingTodo === todo.id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-4 py-2 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-green-200 font-medium"
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2 border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-green-200 font-medium resize-none"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEdit}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl border-2 border-green-600"
                          >
                            保存
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-xl border-2 border-gray-400"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-4">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                            todo.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {todo.completed && <CheckIcon className="w-4 h-4 text-white" />}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`text-lg font-bold text-gray-800 ${
                                todo.completed ? 'line-through text-gray-500' : ''
                              }`}>
                                {todo.title}
                              </h3>
                              {todo.description && (
                                <p className={`mt-1 text-gray-600 ${
                                  todo.completed ? 'line-through' : ''
                                }`}>
                                  {todo.description}
                                </p>
                              )}
                              <div className="flex items-center mt-3 space-x-3 text-sm">
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                                  {getPriorityLabel(todo.priority)}
                                </span>
                                <span className="text-gray-500 flex items-center">
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  {new Date(todo.createdAt).toLocaleDateString('zh-CN')}
                                </span>
                              </div>
                            </div>

                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => startEdit(todo)}
                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoList;