import React from 'react';
import Modal from './Modal';
import { Button } from './ui';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = true, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      {message && <p className="text-sm text-gray-600">{message}</p>}
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
          {loading ? 'Please wait...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
