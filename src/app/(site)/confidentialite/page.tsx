import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Politique de confidentialité' };

// Describes what the site actually stores; the client should review and complete it.
export default function PrivacyPage() {
  return (
    <div className="content-page">
      <div className="inner">
        <h1>Politique de <em>confidentialité</em></h1>
        <p className="lead">Ce que le site enregistre, et pourquoi.</p>

        <h2>Commandes</h2>
        <p>
          Pour préparer et livrer votre commande, nous enregistrons votre nom, votre téléphone, votre adresse de livraison, votre email s&apos;il est
          indiqué, et le détail de la commande. Ces informations sont transmises au restaurant concerné et à notre logiciel de gestion.
        </p>

        <h2>Compte client (facultatif)</h2>
        <p>Si vous créez un compte, nous enregistrons votre nom, votre email, votre téléphone et un mot de passe chiffré, pour retrouver vos commandes.</p>

        <h2>Candidatures</h2>
        <p>Les CV et lettres envoyés via « Candidature spontanée » ne sont accessibles qu&apos;à l&apos;équipe de recrutement de Bonici.</p>

        <h2>Cookies et stockage</h2>
        <p>
          Le site utilise un seul cookie, uniquement si vous vous connectez, pour maintenir votre session. Votre panier et les liens de suivi de vos
          commandes récentes sont conservés dans votre navigateur. Aucun cookie publicitaire ni outil de suivi n&apos;est utilisé.
        </p>

        <h2>Vos droits</h2>
        <p>Pour consulter, corriger ou supprimer vos données, contactez le restaurant ou Bonici Africa (voir la page Contact).</p>
      </div>
    </div>
  );
}
