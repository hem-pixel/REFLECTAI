import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Database,
  Key,
  Trash2,
  Download,
  CheckCircle2,
  FileJson,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { JournalEntry, UserProfile } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface PrivacyViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  onDeleteAllData: () => Promise<void>;
  onExportAll: (format: 'json' | 'txt') => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({
  user,
  entries,
  onDeleteAllData,
  onExportAll,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAllData();
      setIsDeleteModalOpen(false);
      setActionSuccess('All your reflections and data have been completely erased.');
    } catch (err) {
      console.error('Failed to erase all data:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 pb-36 md:pb-8 max-w-4xl mx-auto w-full space-y-8 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif text-[#282220] tracking-tight mb-1">
          Privacy & Security Center
        </h1>
        <p className="text-xs sm:text-sm text-[#6e6259]">
          Manage your personal data, review security guarantees, and exercise full data sovereignty.
        </p>
      </div>

      {actionSuccess && (
        <div className="rounded-xl border border-[#b8dab8] bg-[#eef7ee] p-3 text-xs text-[#2e592e] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 1. Security Architecture Checklist */}
      <section className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#9b4d36]" />
          <h2 className="text-base font-semibold text-[#282220]">
            Security Guarantees & Controls
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#9b4d36] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-[#282220]">Google OAuth Authentication</h3>
                <p className="text-[11px] text-[#6e6259] leading-relaxed mt-0.5">
                  Identity is federated directly through Google Firebase Auth. We never manage, see, or store passwords.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#9b4d36] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-[#282220]">User-Isolated Firestore Storage</h3>
                <p className="text-[11px] text-[#6e6259] leading-relaxed mt-0.5">
                  Saved under <code className="text-[10px] bg-[#f2ebe1] text-[#282220] px-1 rounded">/users/{user.uid.slice(0, 8)}.../interactions</code>.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#9b4d36] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-[#282220]">Server-Side Gemini Proxy</h3>
                <p className="text-[11px] text-[#6e6259] leading-relaxed mt-0.5">
                  AI requests are mediated through our Express backend with zero API key exposure to browser inspect tools.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#9b4d36] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-[#282220]">Strict Firestore Security Rules</h3>
                <p className="text-[11px] text-[#6e6259] leading-relaxed mt-0.5">
                  Cross-user reads, updates, and deletes are mathematically prohibited at the cloud database level.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Data Portability & Export */}
      <section className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-[#9b4d36]" />
          <h2 className="text-base font-semibold text-[#282220]">
            Export Your Journal Data
          </h2>
        </div>
        <p className="text-xs text-[#6e6259] leading-relaxed">
          Download a complete copy of all your journal entries, AI conversations, and micro-habits for personal archival or offline backup.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => onExportAll('json')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] px-4 py-2.5 text-xs font-semibold text-[#282220] hover:bg-[#f2ebe1] transition-colors cursor-pointer"
          >
            <FileJson className="h-4 w-4 text-[#9b4d36]" />
            <span>Export Complete Backup (JSON)</span>
          </button>

          <button
            onClick={() => onExportAll('txt')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] px-4 py-2.5 text-xs font-semibold text-[#282220] hover:bg-[#f2ebe1] transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4 text-[#9b4d36]" />
            <span>Export Readable Archive (TXT)</span>
          </button>
        </div>
      </section>

      {/* 3. Right to Erasure / Danger Zone */}
      <section className="rounded-2xl border border-[#ffdad6] bg-[#fff8f7] p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-[#ba1a1a]">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-base font-semibold text-[#ba1a1a]">
            Delete All Reflections (Right to Erasure)
          </h2>
        </div>
        <p className="text-xs text-[#93000a] leading-relaxed">
          Permanently erase all {entries.length} reflections and conversation histories from Google Cloud Firestore. This operation cannot be undone.
        </p>

        <div className="pt-2">
          <button
            id="delete-all-data-btn"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ba1a1a] px-4 py-2.5 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#93000a] transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete All My Data</span>
          </button>
        </div>
      </section>

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Erase All Reflection History?"
        message={`This will permanently delete all ${entries.length} journal sessions stored under your account in Cloud Firestore. This action is irreversible.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Everything'}
        confirmVariant="danger"
        requireTextMatch="DELETE"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
