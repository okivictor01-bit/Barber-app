import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  const valid = await verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === 'charge.success') {
    const { reference, fees } = event.data;
    // Paystack reports its own processing fee in kobo on the webhook payload.
    const paystackFeeNaira = typeof fees === 'number' ? fees / 100 : null;

    const supabase = createAdminClient();

    const { data: tx, error: findErr } = await supabase
      .from('transactions')
      .select('id, business_id, customer_id, amount, service_id, service_name, status')
      .eq('paystack_reference', reference)
      .single();

    if (findErr || !tx) {
      console.error('Webhook: transaction not found for reference', reference);
      return NextResponse.json({ received: true });
    }

    // Paystack retries webhook deliveries (and can occasionally send the
    // same event more than once) — this is expected behavior on their end,
    // not an error. Without a guard, a retry would create a second ticket
    // for the same payment. Two layers of protection here:
    //
    // 1. If this transaction is already marked success, we've clearly
    //    already processed it — stop immediately.
    // 2. The claim below is a CONDITIONAL update (only succeeds if status
    //    is still 'pending'). This is atomic at the database level, so even
    //    if two webhook deliveries hit this code at almost the exact same
    //    instant, only one can win the race and proceed.
    if (tx.status === 'success') {
      return NextResponse.json({ received: true });
    }

    const { data: claimed, error: claimErr } = await supabase
      .from('transactions')
      .update({
        status: 'success',
        paid_at: new Date().toISOString(),
        paystack_fee: paystackFeeNaira,
      })
      .eq('id', tx.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (claimErr) {
      console.error('Webhook: failed to claim transaction', claimErr);
      return NextResponse.json({ received: true });
    }

    if (!claimed) {
      // Another delivery of this same event already claimed and is
      // handling it — nothing more to do here.
      return NextResponse.json({ received: true });
    }

    // We won the claim — this is the only place that will ever create a
    // ticket for this payment. Create it, then link both directions.
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .insert({
        business_id: tx.business_id,
        customer_id: tx.customer_id,
        status: 'pending',
        is_free: false,
        amount: tx.amount,
        service_id: tx.service_id,
        service_name: tx.service_name,
        transaction_id: tx.id,
      })
      .select()
      .single();

    if (ticketErr) {
      console.error('Webhook: failed to create ticket', ticketErr);
    } else if (ticket) {
      await supabase.from('transactions').update({ ticket_id: ticket.id }).eq('id', tx.id);
    }
  }

  return NextResponse.json({ received: true });
}
