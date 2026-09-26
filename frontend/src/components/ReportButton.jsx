import { useState } from 'react';
import { Flag } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Button, Field, FormError, Modal } from './UI';
export default function ReportButton({ targetType, targetId }) {
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState('Inaccurate'),
    [details, setDetails] = useState(''),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    notify = useToast();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api('/reports', {
        method: 'POST',
        body: { targetType, targetId, reason, details },
      });
      notify(data.message);
      setOpen(false);
      setDetails('');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="text-btn muted" onClick={() => setOpen(true)}>
        <Flag size={14} />
        Report
      </button>
      {open && (
        <Modal title="Report content" onClose={() => !busy && setOpen(false)}>
          <p className="muted">
            Help keep AcadHub accurate and useful. A moderator will review your report.
          </p>
          <form onSubmit={submit}>
            <FormError error={error} />
            <Field label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              {['Inaccurate', 'Copyright', 'Inappropriate', 'Duplicate', 'Spam', 'Other'].map(
                (v) => (
                  <option key={v}>{v}</option>
                ),
              )}
            </Field>
            <Field
              label="What should we know?"
              multiline
              rows={4}
              minLength={10}
              maxLength={2000}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              hint="Include enough detail for a moderator to investigate."
            />
            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button busy={busy}>Submit report</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
