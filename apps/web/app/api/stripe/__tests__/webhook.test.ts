import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import { POST } from '../webhook/route';

const constructEventMock = vi.fn();

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => constructEventMock(...args),
    },
  },
}));

const fromMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => ({ from: fromMock }),
}));

vi.mock('next/headers', () => ({
  headers: async () => new Map([['stripe-signature', 'sig_test']]),
}));

type QueryResult = { error: { code?: string; message: string } | null };

interface TableMock {
  upsert?: (row: unknown) => Promise<QueryResult>;
  insert?: (row: unknown) => Promise<QueryResult>;
  update?: (row: unknown) => { eq: (col: string, val: string) => Promise<QueryResult> };
}

function mockTables(tables: Record<string, TableMock>) {
  fromMock.mockImplementation((table: string) => {
    const handler = tables[table];
    if (!handler) throw new Error(`unexpected table: ${table}`);
    return handler;
  });
}

function postWebhook() {
  return POST(
    new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    }),
  );
}

const okInsert = async (): Promise<QueryResult> => ({ error: null });

describe('POST /api/stripe/webhook', () => {
  it('returns a non-2xx status when the checkout.session.completed premium upsert fails, so Stripe retries', async () => {
    constructEventMock.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { userId: 'user_1', plan: 'monthly' },
          customer: 'cus_1',
        },
      },
    } as unknown as Stripe.Event);

    mockTables({
      stripe_webhook_events: { insert: okInsert },
      user_premium: {
        upsert: async () => ({ error: { message: 'db unavailable' } }),
      },
    });

    const response = await postWebhook();

    expect(response.status).toBe(500);
  });

  it('returns a non-2xx status when the subscription-deleted premium update fails, so Stripe retries', async () => {
    constructEventMock.mockReturnValue({
      id: 'evt_deleted',
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_1' } },
    } as unknown as Stripe.Event);

    mockTables({
      stripe_webhook_events: { insert: okInsert },
      user_premium: {
        update: () => ({
          eq: async () => ({ error: { message: 'db unavailable' } }),
        }),
      },
    });

    const response = await postWebhook();

    expect(response.status).toBe(500);
  });

  it('does not reprocess an event whose id has already been recorded', async () => {
    constructEventMock.mockReturnValue({
      id: 'evt_dup',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { userId: 'user_1', plan: 'monthly' },
          customer: 'cus_1',
        },
      },
    } as unknown as Stripe.Event);

    const upsertSpy = vi.fn();
    mockTables({
      stripe_webhook_events: {
        insert: async () => ({ error: { code: '23505', message: 'duplicate key' } }),
      },
      user_premium: { upsert: upsertSpy },
    });

    const response = await postWebhook();

    expect(response.status).toBe(200);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('revokes premium when a subscription becomes past_due', async () => {
    constructEventMock.mockReturnValue({
      id: 'evt_2',
      type: 'customer.subscription.updated',
      data: { object: { status: 'past_due', customer: 'cus_2' } },
    } as unknown as Stripe.Event);

    const eqSpy = vi.fn(async () => ({ error: null }));
    const updateSpy = vi.fn(() => ({ eq: eqSpy }));
    mockTables({
      stripe_webhook_events: { insert: okInsert },
      user_premium: { update: updateSpy },
    });

    const response = await postWebhook();

    expect(response.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ is_premium: false }),
    );
    expect(eqSpy).toHaveBeenCalledWith('stripe_customer_id', 'cus_2');
  });

  it('restores premium when a subscription recovers to active', async () => {
    constructEventMock.mockReturnValue({
      id: 'evt_3',
      type: 'customer.subscription.updated',
      data: { object: { status: 'active', customer: 'cus_3' } },
    } as unknown as Stripe.Event);

    const eqSpy = vi.fn(async () => ({ error: null }));
    const updateSpy = vi.fn(() => ({ eq: eqSpy }));
    mockTables({
      stripe_webhook_events: { insert: okInsert },
      user_premium: { update: updateSpy },
    });

    const response = await postWebhook();

    expect(response.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ is_premium: true }),
    );
    expect(eqSpy).toHaveBeenCalledWith('stripe_customer_id', 'cus_3');
  });
});
