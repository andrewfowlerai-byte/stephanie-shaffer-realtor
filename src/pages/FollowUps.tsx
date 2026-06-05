import { useState } from 'react';
import type { Contact } from '../lib/types';
import SuggestedFollowups from '../components/SuggestedFollowups';
import ContactModal from '../components/ContactModal';

interface FollowUpsProps {
  contacts: Contact[];
  loading: boolean;
  addContact: (data: Omit<Contact, 'id' | 'created_at'>) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
}

/**
 * "Who to reach out to today." Sprint 1 surfaces the existing rule-based
 * suggestions over the full contact list. Sprint 3 re-keys the engine to
 * realtor categories + birthdays + closing anniversaries and adds per-contact
 * email and text drafts.
 */
export default function FollowUps({ contacts, loading, addContact, updateContact }: FollowUpsProps) {
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-flame-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-midnight-900">Follow-ups</h1>
        <p className="text-sm text-silver-600 mt-0.5">Who to reach out to, and why, right now.</p>
      </div>

      <SuggestedFollowups
        contacts={contacts}
        onEditContact={(c) => setEditingContact(c)}
        onDraftEmail={(c) => setEditingContact(c)}
      />

      {editingContact && (
        <ContactModal
          contact={editingContact}
          onSave={addContact}
          onUpdate={updateContact}
          onClose={() => setEditingContact(null)}
        />
      )}
    </div>
  );
}
