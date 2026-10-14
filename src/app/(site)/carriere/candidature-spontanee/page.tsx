import type { Metadata } from 'next';
import { ApplicationForm } from './ApplicationForm';

export const metadata: Metadata = { title: 'Candidature spontanée' };

export default function ApplicationPage() {
  return (
    <div className="s-candidature">
      <div className="candidature-page">
        <div className="page-header reveal">
          <h2>Candidature spontanée</h2>
          <p>Rejoignez l&apos;équipe BONICI Africa : envoyez-nous votre candidature</p>
        </div>
        <ApplicationForm />
      </div>
    </div>
  );
}
