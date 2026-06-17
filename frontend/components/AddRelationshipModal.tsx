'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Check, ChevronsUpDown, Loader2, ArrowRight, Users, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getPersons, createRelationship } from '@/lib/api';

interface Person {
  id: string;
  name: string;
}

interface AddRelationshipForm {
  fromPersonId: string;
  relationshipType: string;
  indianName?: string;
  toPersonId: string;
}

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  toPerson: Person;
  onSuccess?: () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === 'Failed to fetch') {
      return 'Connectivity issue: Could not reach the API server. Please ensure the backend is running.';
    }
    return err.message;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = String((err as { message: unknown }).message ?? '');
    if (msg === 'Failed to fetch') return 'Connectivity issue: Could not reach the API server. Please ensure the backend is running.';
    return msg || 'An error occurred';
  }
  return 'An error occurred';
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const RELATIONSHIP_GROUPS = [
  { label: 'Direct Family',    emoji: '👨‍👩‍👧', options: ['father', 'mother', 'brother', 'sister', 'spouse', 'son', 'daughter'] },
  { label: 'Extended Family',  emoji: '👴',      options: ['uncle', 'aunt', 'cousin', 'grandfather', 'grandmother', 'nephew', 'niece'] },
  { label: 'Indian Context',   emoji: '🪔',      options: ['chithi', 'chithappa', 'periyamma', 'periyappa', 'mama', 'athai', 'thatha', 'paatti', 'anna', 'akka', 'thambi', 'thangachi'] },
  { label: 'Professional',     emoji: '💼',      options: ['colleague', 'manager', 'mentor', 'client'] },
  { label: 'Social',           emoji: '🤝',      options: ['friend', 'acquaintance'] },
];

const INDIAN_TERMS = new Set(['chithi', 'chithappa', 'periyamma', 'periyappa', 'mama', 'athai', 'thatha', 'paatti', 'anna', 'akka', 'thambi', 'thangachi']);

export default function AddRelationshipModal({
  isOpen,
  onClose,
  toPerson,
  onSuccess,
}: AddRelationshipModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [people, setPeople]       = React.useState<Person[]>([]);
  const [openSearch, setOpenSearch] = React.useState(false);
  const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(null);
  const [error, setError]   = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const { register, handleSubmit, setValue, watch, reset } = useForm<AddRelationshipForm>();
  const selectedRelType = watch('relationshipType');
  const indianName      = watch('indianName');
  const isIndian        = INDIAN_TERMS.has(selectedRelType);
  const displayLabel    = indianName?.trim() || selectedRelType;

  React.useEffect(() => {
    if (isOpen) { fetchPeople(); setSuccess(false); setError(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchPeople = async () => {
    try {
      const data = await getPersons();
      setPeople((data as unknown as Person[]).filter((p: Person) => p.id !== toPerson.id));
    } catch { /* silent */ }
  };

  const onSubmit = async (data: AddRelationshipForm) => {
    if (!selectedPerson) { setError('Please select a person'); return; }
    setIsLoading(true); setError(null);
    try {
      await createRelationship({ from_id: selectedPerson.id, to_id: toPerson.id, type: data.relationshipType, indian_name: data.indianName });
      setSuccess(true);
      setTimeout(() => { reset(); setSelectedPerson(null); onSuccess?.(); onClose(); }, 900);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setIsLoading(false); }
  };

  // ── Field style tokens ───────────────────────────────────────────────────────
  const FIELD_BASE = "h-12 w-full rounded-xl border border-[#2e3140] bg-[#191c25] text-white text-sm px-4 transition-all duration-200";
  const FIELD_FOCUS = "focus:border-amber-500/60 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:border-amber-500/60";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-transparent rounded-2xl max-h-[90dvh]">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#2a2d3a] bg-[#12141a] shadow-[0_0_100px_rgba(0,0,0,0.9)]">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="relative px-6 pt-6 pb-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1d28 0%, #12141a 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 10% 0%, rgba(251,191,36,0.08) 0%, transparent 60%)' }} />

            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Users size={15} className="text-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-amber-400/60 uppercase">New Connection</span>
                </div>
                <h2 className="text-[22px] font-bold text-white tracking-tight">Add Relationship</h2>
                <p className="text-sm text-[#6b7280] mt-0.5">
                  Linking to <span className="text-white font-semibold">{toPerson.name}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-[#1e2130] border border-[#2e3140] flex items-center justify-center text-[#6b7280] hover:text-white hover:border-white/20 transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Connection preview strip */}
            {(selectedPerson || selectedRelType) && (
              <div className="relative mt-5 flex items-center gap-3 bg-[#1a1d28] border border-[#2a2d3a] rounded-xl px-4 py-3">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  selectedPerson ? "bg-amber-500/20 border border-amber-500/40 text-amber-300" : "bg-[#2a2d3a] border border-[#3a3d50] text-[#4b5280]"
                )}>
                  {selectedPerson ? getInitials(selectedPerson.name) : '?'}
                </div>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="flex-1 relative h-px bg-[#2a2d3a]">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 via-amber-400/50 to-amber-500/30" />
                    {displayLabel && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border",
                          isIndian
                            ? "bg-orange-900/60 text-orange-200 border-orange-500/40"
                            : "bg-amber-900/50 text-amber-200 border-amber-500/30"
                        )}>
                          {isIndian && '🪔 '}{displayLabel}
                        </span>
                      </div>
                    )}
                  </div>
                  <ArrowRight size={13} className="text-amber-400/60 shrink-0" />
                </div>
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                  {getInitials(toPerson.name)}
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-[#1e2130]" />

          {/* ── Form ───────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ background: '#12141a' }}>

              {/* Error */}
              {error && (
                <div className="p-3.5 text-sm text-red-300 bg-red-950/60 rounded-xl border border-red-500/30 flex items-start gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0 mt-0.5 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* FROM PERSON */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold tracking-widest text-[#9ca3af] uppercase">
                  From Person <span className="text-red-400">*</span>
                </label>
                <Popover open={openSearch} onOpenChange={setOpenSearch}>
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        className={cn(
                          FIELD_BASE, FIELD_FOCUS,
                          "flex items-center justify-between cursor-pointer",
                          openSearch && "border-amber-500/60 bg-[#1e2230]"
                        )}
                      >
                        {selectedPerson ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-amber-500/25 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold text-amber-300">
                              {getInitials(selectedPerson.name)}
                            </div>
                            <span className="text-white font-medium">{selectedPerson.name}</span>
                          </div>
                        ) : (
                          <span className="text-[#4b5280]">Select person...</span>
                        )}
                        <ChevronsUpDown className="h-4 w-4 text-[#4b5280] shrink-0" />
                      </button>
                    }
                  />
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-[#2a2d3a] bg-[#1a1d28] shadow-2xl z-[100]">
                    <Command className="bg-transparent">
                      <CommandInput
                        placeholder="Search person..."
                        className="h-11 border-b border-[#2a2d3a] bg-transparent text-white text-sm placeholder:text-[#4b5280]"
                      />
                      <CommandList className="max-h-[180px]">
                        <CommandEmpty className="p-4 text-sm text-center text-[#4b5280]">No person found.</CommandEmpty>
                        <CommandGroup>
                          {people.map((person) => (
                            <CommandItem
                              key={person.id}
                              value={person.name}
                              onSelect={() => {
                                setSelectedPerson(person);
                                setValue('fromPersonId', person.id);
                                setOpenSearch(false);
                              }}
                              className="h-10 cursor-pointer rounded-lg mx-1 my-0.5 text-[#d1d5db] hover:text-white hover:bg-[#2a2d3a] aria-selected:bg-[#2a2d3a]"
                            >
                              <div className="flex items-center gap-2.5 flex-1">
                                <div className="w-6 h-6 rounded-full bg-[#2a2d3a] border border-[#3a3d50] flex items-center justify-center text-[10px] font-bold text-[#9ca3af]">
                                  {getInitials(person.name)}
                                </div>
                                <span className="text-sm font-medium">{person.name}</span>
                              </div>
                              <Check className={cn('h-3.5 w-3.5 text-amber-400', selectedPerson?.id === person.id ? 'opacity-100' : 'opacity-0')} />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* RELATIONSHIP TYPE */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold tracking-widest text-[#9ca3af] uppercase">
                  Relationship Type <span className="text-red-400">*</span>
                </label>
                <Select onValueChange={(value: string | null) => value && setValue('relationshipType', value)}>
                  <SelectTrigger
                    className={cn(
                      FIELD_BASE,
                      "flex items-center justify-between",
                      selectedRelType ? "border-amber-500/40 text-white" : "text-[#4b5280]"
                    )}
                  >
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#2a2d3a] bg-[#1a1d28] shadow-2xl z-[100] max-h-[280px] text-white">
                    {RELATIONSHIP_GROUPS.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#6b7280] px-3 py-2 border-b border-[#1e2130] mt-1">
                          <span className="text-sm">{group.emoji}</span>
                          <span>{group.label}</span>
                          {group.label === 'Indian Context' && (
                            <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] bg-orange-900/50 text-orange-300 border border-orange-500/30 font-semibold">Tamil/Hindi</span>
                          )}
                        </SelectLabel>
                        {group.options.map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            className={cn(
                              "capitalize cursor-pointer rounded-lg mx-1 my-0.5 text-sm h-9",
                              "text-[#d1d5db] focus:bg-[#2a2d3a] focus:text-white",
                              INDIAN_TERMS.has(opt) && "text-orange-200/90"
                            )}
                          >
                            {INDIAN_TERMS.has(opt) && <span className="mr-1.5 text-xs">🪔</span>}
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* INDIAN NAME */}
              <div className="space-y-2">
                <label htmlFor="indianName" className="flex items-center gap-2 text-xs font-semibold tracking-widest text-[#9ca3af] uppercase">
                  Indian Name
                  <span className="text-[#4b5280] font-normal normal-case tracking-normal text-[10px]">optional override</span>
                  <Sparkles size={10} className="text-orange-400/60 ml-auto" />
                </label>
                <Input
                  id="indianName"
                  placeholder="e.g. Chithappa, Mama, Athai, Periappa…"
                  {...register('indianName')}
                  className={cn(FIELD_BASE, FIELD_FOCUS, "placeholder:text-[#3a3d50]")}
                />
                <p className="text-[10px] text-[#4b5280] leading-relaxed">
                  This label appears on the graph edge and tree view, overriding the type above.
                </p>
              </div>

            </div>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <div className="px-6 py-4 flex items-center justify-between gap-3 border-t border-[#1e2130] bg-[#0e1016]">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="h-10 px-5 rounded-xl text-[#6b7280] hover:text-white hover:bg-[#1e2130] text-sm font-medium transition-all border border-transparent hover:border-[#2e3140]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || success}
                className={cn(
                  "h-10 rounded-xl px-6 text-sm font-bold min-w-[170px] transition-all duration-300 shadow-lg",
                  success
                    ? "bg-emerald-500 text-white shadow-emerald-500/30"
                    : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25 active:scale-95"
                )}
              >
                {success ? (
                  <div className="flex items-center gap-2"><Check size={14} /><span>Connected!</span></div>
                ) : isLoading ? (
                  <div className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Saving...</span></div>
                ) : (
                  <div className="flex items-center gap-2"><span>Add Relationship</span><ArrowRight size={14} /></div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
