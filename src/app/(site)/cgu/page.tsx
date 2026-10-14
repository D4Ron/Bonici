import type { Metadata } from 'next';

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

// TODO(client): the legal text must come from Bonici; nothing below is a substitute for it.
export default function TermsPage() {
  return (
    <div className="content-page">
      <div className="inner">
        <h1>Conditions générales <em>d&apos;utilisation</em></h1>
        <div className="pending-text">
          Le texte des conditions générales d&apos;utilisation et de vente de Bonici Africa sera publié ici prochainement.
        </div>
        <h2>En résumé</h2>
        <ul>
          <li>Les commandes passées sur le site sont préparées par le restaurant choisi et payées en espèces à la livraison ou au retrait.</li>
          <li>Les prix affichés sont en francs CFA (FCFA), toutes taxes comprises ; les frais de livraison sont indiqués avant la validation.</li>
          <li>Une commande peut être annulée depuis sa page de suivi tant que le restaurant ne l&apos;a pas acceptée ; ensuite, appelez le restaurant.</li>
        </ul>
      </div>
    </div>
  );
}
