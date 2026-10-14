import type { Metadata } from 'next';
import { listRestaurants } from '@/lib/catalog';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = { title: 'Contact' };
export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const restaurants = await listRestaurants();
  const email = process.env.CONTACT_EMAIL;
  return (
    <div className="content-page">
      <div className="inner">
        <h1 className="reveal">Nous <em>contacter</em></h1>
        <p className="lead reveal">Pour une commande, une réservation ou une question, appelez directement le restaurant le plus proche.</p>
        <div className="grid-2">
          {restaurants.map((r, i) => (
            <div className="card reveal" style={{ ['--i' as string]: i }} key={r.id}>
              <h3>{r.name}</h3>
              <p><Icon name="pin" size={16} /> {r.address}, {r.city}</p>
              {r.phone && <p><Icon name="phone" size={16} /> <a href={`tel:+228${r.phone.replace(/\D/g, '')}`}>{r.phone}</a></p>}
              {r.openingHours && <p><Icon name="clock" size={16} /> {r.openingHours}</p>}
              {r.googleMapsUrl && <p><a href={r.googleMapsUrl} target="_blank" rel="noopener noreferrer">Itinéraire Google Maps <Icon name="external" size={13} /></a></p>}
            </div>
          ))}
        </div>
        {email && <p className="reveal" style={{ marginTop: 24 }}>Par email : <a href={`mailto:${email}`} style={{ color: '#C3102F', fontWeight: 600 }}>{email}</a></p>}
      </div>
    </div>
  );
}
