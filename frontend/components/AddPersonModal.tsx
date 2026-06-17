'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Loader2, Upload, X, User, Tag, FileText, ImageIcon, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPerson } from '@/lib/api';

// API expects lowercase literals
const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

// API expects lowercase literals: 'family' | 'friend' | 'professional' | 'colleague'
const CATEGORY_OPTIONS = [
  { label: 'Family', value: 'family', color: 'from-amber-500/30 to-amber-500/10', active: 'bg-amber-500/20 border-amber-500/60 text-amber-400' },
  { label: 'Friend', value: 'friend', color: 'from-indigo-500/30 to-indigo-500/10', active: 'bg-indigo-500/20 border-indigo-500/60 text-indigo-400' },
  { label: 'Professional', value: 'professional', color: 'from-emerald-500/30 to-emerald-500/10', active: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400' },
  { label: 'Colleague', value: 'colleague', color: 'from-purple-500/30 to-purple-500/10', active: 'bg-purple-500/20 border-purple-500/60 text-purple-400' },
];

interface AddPersonForm {
  fullName: string;
  nickname?: string;
  gender: string;
  notes?: string;
  relationshipToUser?: string;
}

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'Failed to fetch') {
      return 'Connectivity issue: Could not reach the API server.';
    }
    return err.message;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = String((err as { message: unknown }).message ?? '');
    return msg || 'An error occurred';
  }
  return 'An error occurred';
}

export default function AddPersonModal({ isOpen, onClose, onSuccess }: AddPersonModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedGender, setSelectedGender] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [genderOpen, setGenderOpen] = React.useState(false);

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<AddPersonForm>({
    defaultValues: { fullName: '', nickname: '', gender: '', notes: '', relationshipToUser: '' },
  });

  React.useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSelectedCategories([]);
      setSelectedGender('');
      setGenderOpen(false);
      reset({ fullName: '', nickname: '', gender: '', notes: '', relationshipToUser: '' });
    }
  }, [isOpen, reset]);

  const toggleCategory = (value: string) => {
    setError(null);
    setSelectedCategories(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  };

  const onSubmit = async (data: AddPersonForm) => {
    if (!selectedGender) { setError('Please select a gender.'); return; }
    if (selectedCategories.length === 0) { setError('Please select at least one category.'); return; }

    setIsLoading(true);
    setError(null);
    try {
      const { getPersons, createRelationship } = await import('@/lib/api');
      const newPerson = await createPerson({
        name: data.fullName,
        nickname: data.nickname,
        gender: selectedGender,           // already lowercase e.g. 'male'
        categories: selectedCategories,   // already lowercase e.g. ['family']
        notes: data.notes,
      });

      if (data.relationshipToUser && typeof newPerson === 'object' && newPerson !== null && 'id' in newPerson) {
        // Find the 'YOU' node
        const persons = await getPersons();
        const youNode = (persons as any[]).find(p => p.name.toLowerCase() === 'you' || p.name.toLowerCase().includes('siddharth')) || (persons as any[])[0];
        if (youNode) {
          await createRelationship({
            from_id: youNode.id,
            to_id: (newPerson as any).id,
            type: data.relationshipToUser.toLowerCase(),
            indian_name: data.relationshipToUser
          });
        }
      }

      // Automatically log a memory so this person becomes semantically searchable in ChromaDB
      const { logMemory } = await import('@/lib/api');
      const memoryText = `I added ${data.fullName} to my network as a ${selectedCategories.join(', ')}.` + (data.notes ? ` Notes: ${data.notes}` : '');
      await logMemory(memoryText);

      toast.success(`${data.fullName} added to your network!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedGenderLabel = GENDER_OPTIONS.find(g => g.value === selectedGender)?.label;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-[520px] flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #13151a 0%, #0f1115 100%)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Add Person</h2>
            <p className="text-sm text-gray-400 mt-1">Add someone new to your network</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all ml-4 shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                <User size={12} /> Full Name <span className="text-red-400">*</span>
              </label>
              <Controller
                control={control}
                name="fullName"
                rules={{ required: 'Full name is required', validate: v => v.trim().length > 0 || 'Full name is required' }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full h-11 rounded-xl px-4 text-white placeholder:text-gray-500 text-sm bg-white/5 border border-white/10 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                )}
              />
              {errors.fullName && <p className="text-xs text-red-400 font-medium">{errors.fullName.message}</p>}
            </div>

            {/* Nickname + Gender row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Nickname */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Nickname</label>
                <input
                  {...register('nickname')}
                  type="text"
                  placeholder="e.g. Ramu"
                  className="w-full h-11 rounded-xl px-4 text-white placeholder:text-gray-500 text-sm bg-white/5 border border-white/10 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Gender — custom dropdown to avoid radix-UI z-index issues */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Gender</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setGenderOpen(o => !o)}
                    className="w-full h-11 rounded-xl px-4 text-sm bg-white/5 border border-white/10 outline-none flex items-center justify-between text-left transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  >
                    <span className={selectedGenderLabel ? 'text-white' : 'text-gray-500'}>
                      {selectedGenderLabel ?? 'Select gender'}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${genderOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {genderOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                      style={{ background: '#13151a' }}>
                      {GENDER_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setSelectedGender(opt.value); setGenderOpen(false); setError(null); }}
                          className={`w-full px-4 py-3 text-sm text-left transition-colors hover:bg-white/10 ${selectedGender === opt.value ? 'text-amber-400 bg-amber-500/10' : 'text-white'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                <Tag size={12} /> Category <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_OPTIONS.map(cat => {
                  const isSelected = selectedCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleCategory(cat.value)}
                      className={`relative flex items-center justify-center py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                        isSelected
                          ? `${cat.active} shadow-sm scale-[1.02]`
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-current opacity-70" />
                      )}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                <FileText size={12} /> Notes
              </label>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    placeholder="Works in Dubai, loves cricket..."
                    className="w-full rounded-xl px-4 py-3 text-white placeholder:text-gray-500 text-sm bg-white/5 border border-white/10 outline-none resize-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                )}
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
                <ImageIcon size={12} /> Photo <span className="text-gray-500 normal-case font-normal tracking-normal">(optional)</span>
              </label>
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center gap-2 h-24 w-full rounded-xl border-2 border-dashed border-white/15 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition-all group"
              >
                <Upload size={20} className="text-gray-500 group-hover:text-amber-500 transition-colors" />
                <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">Click to upload photo</span>
                <input id="photo-upload" type="file" accept="image/*" className="hidden" />
              </label>
            </div>

          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-7 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? 'Adding...' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
