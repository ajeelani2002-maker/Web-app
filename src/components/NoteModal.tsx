import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Note, Collection, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  user: User;
}

export default function NoteModal({ isOpen, onClose, note, user }: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
    setError(null);
  }, [note, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (note) {
        // Update existing note
        const noteRef = doc(db, Collection.NOTES, note.id);
        await updateDoc(noteRef, {
          title: title.trim(),
          content: content.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new note
        await addDoc(collection(db, Collection.NOTES), {
          userId: user.uid,
          title: title.trim(),
          content: content.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err: unknown) {
      handleFirestoreError(err, note ? OperationType.UPDATE : OperationType.CREATE, Collection.NOTES);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h3 className="text-xl font-bold text-white">
            {note ? 'Edit Secret' : 'Create New Secret'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400 ml-1 uppercase tracking-wider">Title</label>
            <input
              type="text"
              placeholder="Give your secret a name..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400 ml-1 uppercase tracking-wider">Content</label>
            <textarea
              placeholder="What's the secret? It will be stored securely."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              required
              maxLength={10000}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white font-semibold px-8 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {note ? 'Save Changes' : 'Secure Note'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
