'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Check, ChevronsUpDown, Loader2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  toPerson: Person; // The person we are adding a relationship TO (e.g. the one currently viewed)
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
    if (msg === 'Failed to fetch') {
      return 'Connectivity issue: Could not reach the API server. Please ensure the backend is running.';
    }
    return msg || 'An error occurred';
  }
  return 'An error occurred';
}

const RELATIONSHIP_GROUPS = [
  {
    label: 'Direct Family',
    options: ['father', 'mother', 'brother', 'sister', 'spouse', 'son', 'daughter'],
  },
  {
    label: 'Extended Family',
    options: ['uncle', 'aunt', 'cousin', 'grandfather', 'grandmother', 'nephew', 'niece'],
  },
  {
    label: 'Professional',
    options: ['colleague', 'manager', 'mentor', 'client'],
  },
  {
    label: 'Social',
    options: ['friend', 'acquaintance'],
  },
];

export default function AddRelationshipModal({
  isOpen,
  onClose,
  toPerson,
  onSuccess,
}: AddRelationshipModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [openSearch, setOpenSearch] = React.useState(false);
  const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<AddRelationshipForm>();

  const selectedRelType = watch('relationshipType');

  React.useEffect(() => {
    if (isOpen) {
      fetchPeople();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchPeople = async () => {
    try {
      const data = await getPersons();
      // Filter out the person we are adding the relationship TO
      setPeople((data as unknown as Person[]).filter((p: Person) => p.id !== toPerson.id));
    } catch (err) {
      console.error('Failed to fetch people', err);
    }
  };

  const onSubmit = async (data: AddRelationshipForm) => {
    if (!selectedPerson) {
      setError('Please select a person');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createRelationship({
        from_id: selectedPerson.id,
        to_id: toPerson.id,
        type: data.relationshipType,
        indian_name: data.indianName,
      });

      alert('Relationship added successfully');

      reset();
      setSelectedPerson(null);
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
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground font-serif">Add Relationship</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1.5 text-sm">
            Define how someone is related to <strong className="text-foreground">{toPerson.name}</strong>.
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
              {/* From Person Searchable Dropdown */}
              <div className="space-y-2.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                  From Person <span className="text-destructive text-lg leading-none">*</span>
                </Label>
                <Popover open={openSearch} onOpenChange={setOpenSearch}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSearch}
                        className="w-full justify-between h-12 bg-background/50 border-input rounded-xl focus:border-amber focus:ring-amber/20 focus:ring-4 transition-all text-base shadow-sm px-4 font-normal"
                      >
                        {selectedPerson ? (
                          <span className="text-foreground font-medium">{selectedPerson.name}</span>
                        ) : (
                          <span className="text-muted-foreground">Select person...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    }
                  />
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-border bg-popover shadow-xl z-[100]">
                    <Command>
                      <CommandInput placeholder="Search person..." className="h-11 border-b border-border/50 bg-transparent text-base" />
                      <CommandList className="max-h-[200px] styled-scrollbar">
                        <CommandEmpty className="p-4 text-sm text-center text-muted-foreground">No person found.</CommandEmpty>
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
                              className="h-11 cursor-pointer rounded-lg mx-1 my-0.5"
                            >
                              <Check
                                className={cn(
                                  'mr-3 h-4 w-4 text-amber',
                                  selectedPerson?.id === person.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span className="font-medium">{person.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Relationship Type */}
              <div className="space-y-2.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                  Relationship Type <span className="text-destructive text-lg leading-none">*</span>
                </Label>
                <Select onValueChange={(value: string | null) => value && setValue('relationshipType', value)}>
                  <SelectTrigger className="h-12 bg-background/50 border-input rounded-xl focus:ring-amber/20 focus:ring-4 focus:border-amber transition-all shadow-sm px-4">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover shadow-xl z-[100] max-h-[250px] styled-scrollbar">
                    {RELATIONSHIP_GROUPS.map((group) => (
                      <SelectGroup key={group.label} className="mb-2">
                        <SelectLabel className="text-amber font-bold text-[10px] uppercase tracking-widest px-3 py-2 bg-amber/5 md:bg-transparent">{group.label}</SelectLabel>
                        {group.options.map((opt) => (
                          <SelectItem key={opt} value={opt} className="capitalize cursor-pointer rounded-lg mx-1 focus:bg-amber/10 focus:text-amber">
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Indian Relationship Name */}
              <div className="space-y-2.5">
                <Label htmlFor="indianName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                  Indian Relationship Name <span className="text-muted-foreground font-normal tracking-normal normal-case ml-1">(Optional)</span>
                </Label>
                <Input
                  id="indianName"
                  placeholder="e.g. Chithappa, Mama, Athai"
                  {...register('indianName')}
                  className="h-12 bg-background/50 border-input rounded-xl focus-visible:border-amber focus-visible:ring-amber/20 focus-visible:ring-4 transition-all text-base shadow-sm"
                />
              </div>

              {/* Direction Note */}
              {selectedPerson && selectedRelType && (
                <div className="bg-amber/5 border border-amber/20 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm mt-2">
                  <Info size={18} className="text-amber shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    <span className="font-bold text-foreground">Summary: </span>
                    <span className="text-foreground font-semibold decoration-amber/30 underline-offset-4">{selectedPerson.name}</span> is the{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide mx-0.5">{selectedRelType}</span> of{' '}
                    <span className="text-foreground font-semibold decoration-amber/30 underline-offset-4">{toPerson.name}</span>.
                  </p>
                </div>
              )}
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
              className="h-11 rounded-xl bg-amber hover:bg-amber-light text-primary-foreground font-bold px-7 min-w-[170px] shadow-lg shadow-amber/20 transition-all active:scale-95"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-foreground/70" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Add Relationship'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
