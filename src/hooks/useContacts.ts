import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Contact } from '../lib/types';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setContacts(data ?? []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addContact = async (data: Omit<Contact, 'id' | 'created_at'>) => {
    console.log('[addContact] inserting', data);
    const { data: inserted, error } = await supabase
      .from('contacts')
      .insert([data])
      .select();
    console.log('[addContact] response', { error, inserted });
    if (error) {
      console.error('[addContact] insert failed:', error.message, error.details);
      throw error;
    }
    if (!inserted || inserted.length === 0) {
      console.error('[addContact] insert returned no row — likely RLS blocking the read-back');
    }
    await refresh();
    console.log('[addContact] refresh complete; total contacts now:', contacts.length);
  };

  const updateContact = async (id: string, data: Partial<Contact>) => {
    const { error } = await supabase.from('contacts').update(data).eq('id', id);
    if (error) throw error;
    await refresh();
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  };

  return { contacts, loading, refresh, addContact, updateContact, deleteContact };
}
