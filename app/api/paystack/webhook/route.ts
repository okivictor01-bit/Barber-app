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

    // Look up the pending transaction, then create the ticket + mark success.
    const { data: tx, error: findErr } = await supabase
      .from('transactions')
      .select('id, business_id, customer_id, amount, service_id, service_name')
      .eq('paystack_reference', reference)
      .single();

    if (findErr || !tx) {
      console.error('Webhook: transaction not found for reference', reference);
      return NextResponse.json({ received: true });
    }

    // Create the paid ticket (pending — customer still needs to hit "submit")
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
      })
      .select()
      .single();

    if (ticketErr) {
      console.error('Webhook: failed to create ticket', ticketErr);
    }

    // Mark transaction success — DB trigger (handle_successful_transaction)
    // auto-handles the loyalty count + free ticket generation on every 3rd paid transaction.
    const { error: updateErr } = await supabase
      .from('transactions')
      .update({
        status: 'success',
        paid_at: new Date().toISOString(),
        ticket_id: ticket?.id ?? null,
        paystack_fee: paystackFeeNaira,
      })
      .eq('id', tx.id);

    if (updateErr) {
      console.error('Webhook: failed to update transaction', updateErr);
    }
  }

  return NextResponse.json({ received: true });
}
