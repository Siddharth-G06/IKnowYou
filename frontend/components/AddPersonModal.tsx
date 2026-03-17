'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Loader2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { createPerson } from '@/lib/api';


const CATEGORIES = ['Family', 'Friend', 'Professional', 'Colleague'];

interface AddPersonForm {
  fullName: string;
  nickname?: string;
  gender: string;
  categories: string[];
  notes?: string;
  photo?: FileList;
}

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'Failed to fetch') {
      return 'Cannot connect to backend. Ensure backend is running on http://localhost:8000.';
    }
    return err.message;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = String((err as { message: unknown }).message ?? '');
    if (msg === 'Failed to fetch') {
      return 'Cannot connect to backend. Ensure backend is running on http://localhost:8000.';
    }
    return msg || 'An error occurred';
  }
  return 'An error occurred';
}

export default function AddPersonModal({ isOpen, onClose, onSuccess }: AddPersonModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddPersonForm>({
    defaultValues: {
      fullName: '',
      nickname: '',
      gender: '',
      categories: [],
      notes: '',
    },
  });

  const selectedGender = watch('gender');

  React.useEffect(() => {
    if (!isOpen) {
      setError(null);
      reset({
        fullName: '',
        nickname: '',
        gender: '',
        categories: [],
        notes: '',
      });
      setSelectedCategories([]);
    }
  }, [isOpen, reset]);

  const toggleCategory = (category: string) => {
    setError(null);
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const onSubmit = async (data: AddPersonForm) => {
    if (!data.gender) {
      setError('Please select a gender.');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('Please select at least one category.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createPerson({
        name: data.fullName,
        nickname: data.nickname,
        gender: data.gender,
        categories: selectedCategories,
        notes: data.notes,
      });

      toast.success(`${data.fullName} has been successfully added to your network.`);

      reset();
      setSelectedCategories([]);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 flex flex-col overflow-hidden border border-border shadow-2xl bg-card rounded-t-2xl sm:rounded-3xl max-h-[90dvh]">
        <DialogHeader className="px-6 inset-x-0 top-0 pt-6 pb-4 border-b border-border/40 bg-card z-10 shrink-0 shadow-sm relative">
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground font-serif">Add Person</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1.5 text-sm">
            Create a new person in your network to start visualizing connections.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto w-full p-6 space-y-7 styled-scrollbar">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-top-1 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}

            <div className="grid gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                  Full Name <span className="text-destructive text-lg leading-none">*</span>
                </Label>
                <Controller
                  control={control}
                  name="fullName"
                  rules={{
                    required: 'Full name is required',
                    validate: (value) => value.trim().length > 0 || 'Full name is required',
                  }}
                  render={({ field }) => (
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        setError(null);
                        field.onChange(e.target.value);
                      }}
                      onBlur={field.onBlur}
                      className="h-12 w-full rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground px-3 text-base shadow-sm transition-all focus-visible:border-amber focus-visible:ring-4 focus-visible:ring-amber/20 focus-visible:outline-none"
                    />
                  )}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive font-semibold tracking-wide">{errors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="nickname" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                    Nickname
                  </Label>
                  <Controller
                    control={control}
                    name="nickname"
                    render={({ field }) => (
                      <input
                        id="nickname"
                        type="text"
                        placeholder="e.g. Ramu"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        className="h-12 w-full rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground px-3 text-base shadow-sm transition-all focus-visible:border-amber focus-visible:ring-4 focus-visible:ring-amber/20 focus-visible:outline-none"
                      />
                    )}
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="gender" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                    Gender
                  </Label>
                  <Select
                    value={selectedGender || undefined}
                    onValueChange={(value: string | null) => {
                      if (!value) return;
                      setError(null);
                      setValue('gender', value, { shouldDirty: true, shouldValidate: true });
                    }}
                  >
                    <SelectTrigger className="h-12 bg-background/50 border-input rounded-xl focus:ring-amber/20 focus:ring-4 focus:border-amber transition-all shadow-sm">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover shadow-xl relative z-[100]">
                      <SelectItem value="Male" className="cursor-pointer rounded-lg focus:bg-amber/10 focus:text-amber">Male</SelectItem>
                      <SelectItem value="Female" className="cursor-pointer rounded-lg focus:bg-amber/10 focus:text-amber">Female</SelectItem>
                      <SelectItem value="Other" className="cursor-pointer rounded-lg focus:bg-amber/10 focus:text-amber">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                  Category
                </Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
                          isSelected
                            ? 'bg-amber/15 border-amber/40 text-amber shadow-sm shadow-amber/10 scale-[1.02]'
                            : 'bg-background hover:bg-muted/50 border-input text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                  Notes
                </Label>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field }) => (
                    <textarea
                      id="notes"
                      placeholder="Works in Dubai, loves cricket..."
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      className="min-h-[110px] w-full resize-none rounded-xl border border-input bg-background p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground shadow-sm transition-all focus-visible:border-amber focus-visible:ring-4 focus-visible:ring-amber/20 focus-visible:outline-none"
                    />
                  )}
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="photo" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                  Photo
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    {...register('photo')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo')?.click()}
                    className="h-28 w-full flex flex-col gap-3 rounded-xl border-dashed border-2 border-border/60 bg-muted/10 hover:border-amber hover:bg-amber/5 transition-all outline-none focus-visible:ring-4 focus-visible:ring-amber/20"
                  >
                    <div className="p-3 bg-background rounded-full shadow-sm border border-border/40 text-muted-foreground group-hover:text-amber transition-colors">
                      <Upload size={20} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Click to upload photo</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-muted/20 inset-x-0 bottom-0 p-5 px-6 border-t border-border/40 shrink-0 flex items-center justify-end gap-3 rounded-b-2xl sm:rounded-b-3xl">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl px-5 text-muted-foreground hover:text-foreground hover:bg-muted font-semibold transition-colors h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 rounded-xl bg-amber hover:bg-amber-light text-primary-foreground font-bold px-7 min-w-[140px] shadow-lg shadow-amber/20 transition-all active:scale-95"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-foreground/70" />
                  <span>Adding...</span>
                </div>
              ) : (
                'Add Person'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
