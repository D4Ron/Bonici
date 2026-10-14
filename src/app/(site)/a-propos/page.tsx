import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'À propos' };

export default function AboutPage() {
  return (
    <div className="content-page">
      <div className="inner">
        <h1 className="reveal">À propos de <em>Bonici</em></h1>
        <p className="lead reveal">
          C&apos;est BON ICI ! Pizzas, burgers, chawarmas, poulets rôtis, poissons braisés, pâtes, jus frais et cocktails : Bonici Africa
          vous accueille dans sept restaurants au Togo — Ramatou, 2 Lions, Adjololo et Tam Tam à Lomé, et à Aného, Kpalimé et Kara.
        </p>
        <div className="card reveal">
          <h3>Sur place, à emporter ou en livraison</h3>
          <p>
            Commandez en ligne sans créer de compte, choisissez la livraison ou le retrait au restaurant, et suivez votre commande
            en direct jusqu&apos;à ce qu&apos;elle soit prête.
          </p>
          <p style={{ marginTop: 12 }}><Link href="/menus" className="btn-primary">Voir les menus</Link></p>
        </div>
      </div>
    </div>
  );
}
