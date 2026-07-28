import { submitTicket } from '@/lib/actions';

export default function SubmitTicketButton({ ticketId }: { ticketId: string }) {
  return (
    <form action={submitTicket.bind(null, ticketId)} className="inline">
      <button className="btn-primary text-xs px-3 py-1">Submit ticket</button>
    </form>
  );
}
