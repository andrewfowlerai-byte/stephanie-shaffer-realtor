import type { Contact, Stage } from './types';

export type FollowupChannel = 'email' | 'phone' | 'text' | 'meeting';
export type FollowupUrgency = 'high' | 'medium' | 'low';
export type FollowupEmailType = 'follow_up' | 'intro' | 'proposal' | 'check_in';

export interface FollowupSuggestion {
  contact: Contact;
  when: string;          // Human label: "Today", "Tomorrow", "This week", "Next week"
  channel: FollowupChannel;
  approach: string;      // One-line instruction for HOW to reach out
  emailType: FollowupEmailType; // Maps to the /api/draft-email endpoint
  urgency: FollowupUrgency;
  reason: string;        // One-line WHY this contact is being surfaced
  overdue: boolean;
  daysSinceCreated: number;
}

/**
 * Rule-based follow-up suggester. Looks at each contact's stage + age in the
 * CRM + their next_followup date, and returns a structured suggestion if
 * action makes sense today.
 *
 * Returns null for contacts that don't need immediate attention.
 */
export function suggestFollowup(contact: Contact, today: Date = new Date()): FollowupSuggestion | null {
  const stage = contact.stage;
  const created = new Date(contact.created_at);
  const daysSinceCreated = Math.floor((today.getTime() - created.getTime()) / 86400000);
  const overdue = !!(contact.next_followup && contact.next_followup <= todayYYYYMMDD(today));
  const hasEmail = !!(contact.email && contact.email.trim());
  const hasPhone = !!(contact.phone && contact.phone.trim());

  // Stage-specific rules. Tuned for a high-touch consultancy where the
  // primary risk is silence after a proposal goes out.
  switch (stage as Stage) {
    case 'Prospect': {
      if (daysSinceCreated >= 2 && daysSinceCreated <= 14) {
        return {
          contact,
          when: 'Today',
          channel: hasEmail ? 'email' : hasPhone ? 'phone' : 'email',
          approach: 'Send a warm intro. Lead with what you noticed about their business. End with a soft ask for a 15-minute call.',
          emailType: 'intro',
          urgency: daysSinceCreated >= 5 ? 'high' : 'medium',
          reason: `${daysSinceCreated} day${daysSinceCreated === 1 ? '' : 's'} since added, no outreach logged.`,
          overdue,
          daysSinceCreated,
        };
      }
      return null;
    }

    case 'Contacted': {
      if (overdue || daysSinceCreated >= 4) {
        return {
          contact,
          when: overdue ? 'Today' : 'Tomorrow',
          channel: hasPhone ? 'phone' : 'email',
          approach: 'Soft follow-up. Reference your last message. Add new value (a useful link, a quick observation). End with a low-friction CTA.',
          emailType: 'follow_up',
          urgency: overdue || daysSinceCreated >= 7 ? 'high' : 'medium',
          reason: overdue
            ? 'Follow-up date has passed.'
            : `${daysSinceCreated} days since added with no movement.`,
          overdue,
          daysSinceCreated,
        };
      }
      return null;
    }

    case 'In Conversation': {
      if (overdue || daysSinceCreated >= 5) {
        return {
          contact,
          when: overdue ? 'Today' : 'This week',
          channel: 'meeting',
          approach: 'Move it to a call. Confirm budget, timeline, and the decision-makers. 15 to 30 minutes is enough.',
          emailType: 'proposal',
          urgency: overdue ? 'high' : 'medium',
          reason: overdue
            ? 'Follow-up date has passed.'
            : 'Conversation has cooled. Time to schedule.',
          overdue,
          daysSinceCreated,
        };
      }
      return null;
    }

    case 'Proposal Out': {
      if (overdue || daysSinceCreated >= 3) {
        return {
          contact,
          when: 'Today',
          channel: hasPhone ? 'phone' : 'email',
          approach: 'Acknowledge the silence and ask if there are specific concerns. Offer a quick walk-through. Do NOT discount.',
          emailType: 'follow_up',
          urgency: 'high',
          reason: overdue
            ? 'Proposal follow-up date has passed.'
            : `Proposal has been out ${daysSinceCreated} day${daysSinceCreated === 1 ? '' : 's'}.`,
          overdue,
          daysSinceCreated,
        };
      }
      return null;
    }

    case 'Client': {
      if (daysSinceCreated >= 14 && (overdue || daysSinceCreated % 14 === 0)) {
        return {
          contact,
          when: 'This week',
          channel: 'email',
          approach: 'Quick check-in. Share a recent win or a relevant resource. No ask.',
          emailType: 'check_in',
          urgency: 'low',
          reason: 'Routine retention touch.',
          overdue,
          daysSinceCreated,
        };
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Rank a list of contacts by suggestion urgency, return the top N with a
 * suggestion attached. Null suggestions are filtered out.
 */
export function topFollowupSuggestions(contacts: Contact[], n = 6, today: Date = new Date()): FollowupSuggestion[] {
  const urgencyRank: Record<FollowupUrgency, number> = { high: 0, medium: 1, low: 2 };
  return contacts
    .map((c) => suggestFollowup(c, today))
    .filter((s): s is FollowupSuggestion => s !== null)
    .sort((a, b) => {
      // Overdue first, then by urgency, then by days since created (older first)
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (urgencyRank[a.urgency] !== urgencyRank[b.urgency]) {
        return urgencyRank[a.urgency] - urgencyRank[b.urgency];
      }
      return b.daysSinceCreated - a.daysSinceCreated;
    })
    .slice(0, n);
}

function todayYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
