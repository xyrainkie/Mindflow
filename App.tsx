import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useNotes } from './hooks/useNotes';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import Dashboard from './components/Dashboard';
import AppNavigation from './components/AppNavigation';
import TodoList from './components/TodoList';
import AIChat from './components/AIChat';
import PomodoroTimer from './components/PomodoroTimer';
import { Category, AppModule } from './types';
import { MenuIcon, UserIcon, LogOutIcon } from './components/Icons';

const AppContent: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const {
    notes,
    loading: notesLoading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    createNote,
    updateNote,
    deleteNote
  } = useNotes();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<AppModule>(AppModule.DASHBOARD);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200">
        <div className="bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-center font-bold">加载中...</p>
        </div>
      </div>
    );
  }

  // Always proceed without showing login UI; guest login handled in useAuth

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: "",
        content: "",
        category: selectedCategory === Category.ALL ? Category.MEMO : selectedCategory,
        tags: []
      });
      setSelectedNoteId(newNote.id);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleUpdateNote = async (id: string, noteData: any) => {
    try {
      await updateNote(id, noteData);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const activeNote = notes.find(n => n.id === selectedNoteId);

  const renderCurrentModule = () => {
    switch (activeModule) {
      case AppModule.DASHBOARD:
        return <Dashboard activeModule={activeModule} onModuleChange={setActiveModule} />;

      case AppModule.NOTES:
        return (
          <div className="flex h-screen w-screen overflow-hidden bg-transparent">
            <Sidebar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onNewNote={handleCreateNote}
              isOpen={isSidebarOpen}
              onCloseMobile={() => setIsSidebarOpen(false)}
            />

            {/* Main Area */}
            <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative w-full">

              {/* Mobile Header for Sidebar Toggle */}
              <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur border-b-2 border-black">
                 <div className="flex items-center">
                   <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-black">
                     <MenuIcon />
                   </button>
                   <h1 className="text-xl font-black ml-2 tracking-tighter font-sans select-none">
                     <span className="text-primary">o</span>
                     <span className="text-secondary">R</span>
                     <span className="text-accent">A</span>
                     <span className="text-highlight">I</span>
                     <span className="text-fresh">N</span>
                     <span className="text-fun-blue">ginal</span>
                   </h1>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-sm font-medium text-gray-700">{user.username}</span>
                   <button
                     onClick={logout}
                     className="p-2 text-red-600 hover:text-red-700"
                     title="退出登录"
                   >
                     <LogOutIcon />
                   </button>
                 </div>
              </div>

              

              {/* Note List View */}
              <div className={`
                flex-col h-full w-full md:w-auto md:flex shadow-2xl z-10
                ${activeNote ? 'hidden md:flex' : 'flex'}
              `}>
                <NoteList
                  notes={notes}
                  selectedNoteId={selectedNoteId}
                  onSelectNote={(note) => setSelectedNoteId(note.id)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  category={selectedCategory}
                  onCreateNote={handleCreateNote}
                />
              </div>

              {/* Editor View */}
              <div className={`
                flex-1 h-full md:border-l-0 border-black
                ${activeNote ? 'flex' : 'hidden md:flex'}
              `}>
                {activeNote ? (
                  <NoteEditor
                    note={activeNote}
                    onUpdate={(updatedNote) => handleUpdateNote(updatedNote.id, updatedNote)}
                    onDelete={() => handleDeleteNote(activeNote.id)}
                    onBack={() => setSelectedNoteId(null)}
                  />
                ) : (
                  <div className="hidden md:flex flex-col items-center justify-center w-full h-full text-black/30">
                    <div className="w-28 h-28 bg-white border-4 border-black shadow-dopamine rounded-full flex items-center justify-center mb-6 animate-bounce">
                       <span className="text-5xl">🌈</span>
                    </div>
                    <p className="text-xl font-bold tracking-tight">选择或创建一个笔记，开始释放多巴胺！</p>
                  </div>
                )}
              </div>
            </main>
          </div>
        );

      case AppModule.TODOS:
        return <TodoList onBack={() => setActiveModule(AppModule.DASHBOARD)} />;

      case AppModule.AI_CHAT:
        return <AIChat onBack={() => setActiveModule(AppModule.DASHBOARD)} />;

      case AppModule.POMODORO:
        return <PomodoroTimer onBack={() => setActiveModule(AppModule.DASHBOARD)} />;

      default:
        return <Dashboard activeModule={activeModule} onModuleChange={setActiveModule} />;
    }
  };

  return (
    <div className="relative">
      {/* Mobile Navigation Overlay (render only when open) */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <AppNavigation
            activeModule={activeModule}
            onModuleChange={setActiveModule}
            user={user}
            onLogout={logout}
            isMobile={true}
            isOpen={isSidebarOpen}
            onCloseMobile={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-40">
        <AppNavigation
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          isMobile={false}
        />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg border-b-4 border-black p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl transition-colors"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black tracking-tighter font-sans select-none">
              <span className="text-primary">o</span>
              <span className="text-secondary">R</span>
              <span className="text-accent">A</span>
              <span className="text-highlight">I</span>
              <span className="text-fresh">N</span>
              <span className="text-fun-blue">ginal</span>
            </h1>
          <div className="flex items-center space-x-2"></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:pt-0 pt-16">
          {renderCurrentModule()}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
