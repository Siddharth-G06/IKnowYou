import useSWR, { useSWRConfig } from 'swr';
import { 
  getPersons, 
  getPerson, 
  createPerson, 
  updatePerson, 
  deletePerson 
} from '@/lib/api';
import { PersonCreate } from '@/types/api';

export function usePersons() {
  const { mutate } = useSWRConfig();
  const { data, error, isLoading } = useSWR('/api/persons', getPersons);

  const addPerson = async (person: PersonCreate) => {
    const newPerson = await createPerson(person);
    mutate('/api/persons');
    return newPerson;
  };

  const removePerson = async (id: string) => {
    await deletePerson(id);
    mutate('/api/persons');
  };

  const editPerson = async (id: string, data: Partial<PersonCreate>) => {
    const updated = await updatePerson(id, data);
    mutate('/api/persons');
    return updated;
  };

  return {
    people: data,
    error,
    isLoading,
    addPerson,
    removePerson,
    editPerson,
    refresh: () => mutate('/api/persons'),
  };
}

export function usePerson(id: string | null) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/persons/${id}` : null,
    () => id ? getPerson(id) : null
  );

  return {
    person: data,
    error,
    isLoading,
  };
}
