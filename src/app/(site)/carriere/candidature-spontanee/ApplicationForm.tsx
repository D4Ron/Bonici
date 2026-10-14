'use client';

import { useActionState, useState } from 'react';
import { submitApplication } from '@/app/actions/careers';
import { Icon } from '@/components/Icon';

const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function ApplicationForm() {
  const [state, action, pending] = useActionState(submitApplication, undefined);
  const [cvName, setCvName] = useState('');
  const [letterName, setLetterName] = useState('');
  const err = state?.fieldErrors ?? {};

  if (state?.success) {
    return (
      <div className="candidature-form">
        <div className="success-message">
          <span className="success-icon"><Icon name="checkCircle" size={28} /></span>
          Votre candidature a bien été envoyée. Nous vous répondrons dans les meilleurs délais.
        </div>
      </div>
    );
  }

  const field = (name: string, label: string, type = 'text') => (
    <div className="form-group">
      <label htmlFor={name}>{label} <span className="required">*</span></label>
      <input id={name} name={name} type={type} className={`form-control${err[name] ? ' error' : ''}`} required />
      {err[name] && <span className="error-message"><Icon name="alert" size={14} /> {err[name]}</span>}
    </div>
  );

  return (
    <form className="candidature-form reveal" action={action}>
      <div className="form-row">
        {field('lastName', 'Nom')}
        {field('firstName', 'Prénom')}
      </div>
      <div className="form-row">
        {field('email', 'Email', 'email')}
        {field('phone', 'Téléphone', 'tel')}
      </div>

      <div className="form-group">
        <label htmlFor="message">Message <span className="required">*</span></label>
        <textarea id="message" name="message" className={`form-control${err.message ? ' error' : ''}`} rows={5} placeholder="Parlez-nous de votre motivation..." required />
        {err.message && <span className="error-message"><Icon name="alert" size={14} /> {err.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="cv">CV <span className="required">*</span></label>
        <input id="cv" name="cv" type="file" className="form-control" accept={ACCEPT} required onChange={(e) => setCvName(e.target.files?.[0]?.name ?? '')} />
        {cvName && <span className="file-info"><Icon name="paperclip" size={14} /> <span className="file-name">{cvName}</span></span>}
        {err.cv && <span className="error-message"><Icon name="alert" size={14} /> {err.cv}</span>}
        <span className="hint">Formats acceptés : PDF, DOC, DOCX — 10 Mo maximum</span>
      </div>

      <div className="form-group">
        <label htmlFor="letter">Lettre de motivation</label>
        <input id="letter" name="letter" type="file" className="form-control" accept={ACCEPT} onChange={(e) => setLetterName(e.target.files?.[0]?.name ?? '')} />
        {letterName && <span className="file-info"><Icon name="paperclip" size={14} /> <span className="file-name">{letterName}</span></span>}
        <span className="hint">Optionnel — Formats acceptés : PDF, DOC, DOCX</span>
      </div>

      {state?.error && <div className="error-message-global"><Icon name="alert" size={14} /> {state.error}</div>}

      <div className="form-actions">
        <button type="submit" className="btn-submit" disabled={pending}>
          {pending ? <><span className="spinner" /> Envoi en cours...</> : 'Envoyer ma candidature'}
        </button>
      </div>
    </form>
  );
}
