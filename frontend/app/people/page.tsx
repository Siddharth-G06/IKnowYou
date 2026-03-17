'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  LayoutGrid,
  List,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PersonCard from '@/components/PersonCard';
import PeopleListRow from '@/components/PeopleListRow';
import { Person } from '@/lib/types';
import AddPersonModal from '@/components/AddPersonModal';
import AddRelationshipModal from '@/components/AddRelationshipModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getPersons, deletePerson } from '@/lib/api';


export default function PeoplePage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch people
  const fetchPeople = async () => {
    setLoading(true);
    try {
      const data = await getPersons();
      setPeople(data as unknown as Person[]);
      setError(null);
    } catch (err) {
      setError('Could not load people. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter people
  const filteredPeople = useMemo(() => {
    return people.filter(p =>
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );
  }, [people, debouncedSearch]);

  const confirmDelete = async () => {
    if (!personToDelete) return;
    setIsDeleting(true);
    try {
      await deletePerson(personToDelete.id);

      // Optimistic update
      setPeople(prev => prev.filter(p => p.id !== personToDelete.id));
      setDeleteConfirmOpen(false);
      setPersonToDelete(null);
    } catch {
      alert('Failed to delete person');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Users className="text-amber" size={28} strokeWidth={2.5} />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">People</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Manage your network of <span className="text-foreground">{people.length}</span> people
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-amber transition-colors" size={16} />
            <Input
              placeholder="Search by name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/30 border-muted-foreground/20 focus:border-amber h-10 rounded-xl"
            />
          </div>

          <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-muted-foreground/10">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-background shadow-sm text-amber' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-background shadow-sm text-amber' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List size={18} />
            </button>
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber hover:bg-amber-light text-black font-bold h-10 px-6 rounded-xl shadow-lg shadow-amber/10"
          >
            <Plus size={18} className="mr-2" strokeWidth={3} />
            Add Person
          </Button>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className={view === 'grid' ? "h-48 rounded-2xl" : "h-16 rounded-xl"} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border border-dashed border-muted-foreground/20">
          <AlertTriangle className="text-destructive mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2">{error}</h3>
          <Button onClick={fetchPeople} variant="outline" className="rounded-xl">Try Again</Button>
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-3xl border border-dashed border-muted-foreground/20 text-center px-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 text-muted-foreground">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">No people found</h3>
          <p className="text-muted-foreground max-w-xs mb-8 italic">
            {searchQuery ? `No results for "${searchQuery}". Try a different search term.` : "Your inner circle is empty. Start adding people to build your graph."}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-amber hover:bg-amber-light text-black font-bold px-8 rounded-xl h-12">
              Add Your First Person
            </Button>
          )}
        </div>
      ) : (
        <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
          {filteredPeople.map((person) => (
            view === 'grid' ? (
              <PersonCard
                key={person.id}
                person={person}
                onDelete={(p) => {
                  setPersonToDelete(p);
                  setDeleteConfirmOpen(true);
                }}
                onAddRelationship={(p) => {
                  setSelectedPerson(p);
                  setIsRelModalOpen(true);
                }}
                onEdit={() => {
                  // TODO: Implement edit
                }}
              />
            ) : (
              <PeopleListRow
                key={person.id}
                person={person}
                onDelete={(p) => {
                  setPersonToDelete(p);
                  setDeleteConfirmOpen(true);
                }}
                onAddRelationship={(p) => {
                  setSelectedPerson(p);
                  setIsRelModalOpen(true);
                }}
              />
            )
          ))}
        </div>
      )}

      {/* Modals & Dialogs */}
      <AddPersonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchPeople}
      />

      {selectedPerson && (
        <AddRelationshipModal
          isOpen={isRelModalOpen}
          onClose={() => setIsRelModalOpen(false)}
          toPerson={selectedPerson}
          onSuccess={fetchPeople}
        />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{personToDelete?.name}</strong> and all their associated relationships from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground focus:ring-destructive"
            >
              {isDeleting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Delete Person
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
