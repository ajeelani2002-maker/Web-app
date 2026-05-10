import { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Note, Collection, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { 
  Plus, 
  LogOut, 
  Search, 
  Trash2, 
  Edit3, 
  FileText, 
  ExternalLink,
  Clock,
  LayoutGrid,
  List as ListIcon,
  PlusCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NoteModal from './NoteModal';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const q = query(
      collection(db, Collection.NOTES),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(notesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, Collection.NOTES);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this secret?')) return;
    try {
      await deleteDoc(doc(db, Collection.NOTES, noteId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${Collection.NOTES}/${noteId}`);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(search.toLowerCase()) || 
    note.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => signOut(auth);

  return (
    <div id="dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome, {user.displayName || user.email?.split('@')[0]}</h2>
          <p className="text-neutral-400">Your private vault is secure. {notes.length} items stored.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="new-note-btn"
            onClick={() => { setEditingNote(null); setIsModalOpen(true); }}
            className="flex-1 sm:flex-none bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            New Note
          </button>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 p-3 rounded-xl transition-all text-neutral-400 hover:text-red-400"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            id="search-notes"
            type="text"
            placeholder="Search your vault..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-neutral-800 text-indigo-400' : 'text-neutral-500 hover:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-neutral-800 text-indigo-400' : 'text-neutral-500 hover:text-white'}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-neutral-500">Unlocking notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-neutral-800 rounded-3xl"
        >
          <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-6">
            <PlusCircle className="w-8 h-8 text-neutral-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No notes found</h3>
          <p className="text-neutral-500 max-w-xs text-center mb-8">
            Start by creating your first secure note to keep it safe in the vault.
          </p>
          <button
             onClick={() => setIsModalOpen(true)}
             className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-2 transition-colors"
          >
            Create my first note <ExternalLink className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <motion.div 
          layout
          className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "flex flex-col gap-4"
          }
        >
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative bg-neutral-900/40 backdrop-blur-sm border border-neutral-800 p-6 rounded-2xl hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/5 ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}
              >
                <div className={viewMode === 'list' ? 'flex-1 pr-8' : 'mb-4'}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-bold text-white truncate">{note.title}</h4>
                  </div>
                  <p className={`text-neutral-400 text-sm line-clamp-2 ${viewMode === 'list' ? 'max-w-xl' : ''}`}>
                    {note.content}
                  </p>
                </div>

                <div className={`flex items-center gap-3 ${viewMode === 'list' ? 'shrink-0' : 'mt-4 pt-4 border-t border-neutral-800'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 mr-auto">
                    <Clock className="w-3 h-3" />
                    {note.updatedAt?.toDate().toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingNote(note); setIsModalOpen(true); }}
                      className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal */}
      <NoteModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingNote(null); }} 
        note={editingNote}
        user={user}
      />
    </div>
  );
}
