'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon, Star } from '@/components/Icon';

interface Restaurant {
  id: number;
  slug: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  openingHours: string;
  googleMapsUrl: string;
  googleReviewUrl: string;
  latitude: number | null;
  longitude: number | null;
  services: string;
  rating: { average: number; count: number } | null;
}

/** Great-circle distance in km. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const formatKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('fr-FR', { maximumFractionDigits: km < 10 ? 1 : 0 })} km`);

export function RestaurantList({ restaurants }: { restaurants: Restaurant[] }) {
  const [search, setSearch] = useState('');
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const locate = () => {
    if (!navigator.geolocation) { setLocError("Votre navigateur ne permet pas la localisation."); return; }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setLocError("Position indisponible : autorisez la localisation ou cherchez par ville."); setLocating(false); },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = restaurants
      .filter((r) => !term || [r.name, r.address, r.city].some((v) => v.toLowerCase().includes(term)))
      .map((r) => ({ ...r, km: me && r.latitude !== null && r.longitude !== null ? distanceKm(me, { lat: r.latitude, lng: r.longitude }) : null }));
    if (me) rows.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
    return rows;
  }, [restaurants, search, me]);

  return (
    <div className="s-restaurants">
      <div className="restaurants-page">
        <div className="hero">
          <h1>Nos <em>Restaurants</em></h1>
          <p>Trouvez le BONICI le plus proche de vous</p>
          <div className="search-bar">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou ville" aria-label="Rechercher un restaurant" />
          </div>
          <button className="btn-locate" onClick={locate} disabled={locating}>
            <Icon name="pin" size={16} /> {locating ? 'Localisation…' : me ? 'Trié du plus proche au plus loin' : 'Le plus proche de moi'}
          </button>
          {locError && <p className="locate-error">{locError}</p>}
        </div>

        <div className="restaurants-list" key={me ? 'near' : 'all'}>
          {list.map((r, i) => (
            <div className={`restaurant-card reveal${me && i === 0 && r.km !== null ? ' nearest' : ''}`} style={{ ['--i' as string]: i }} key={r.id}>
              {me && i === 0 && r.km !== null && <span className="nearest-badge">Le plus proche</span>}
              <h3>{r.name}</h3>
              <p className="address"><Icon name="pin" size={16} /> {r.address}, {r.city}{r.km !== null && <strong className="distance"> · {formatKm(r.km)}</strong>}</p>
              {r.phone && <p className="phone"><Icon name="phone" size={16} /> <a href={`tel:+228${r.phone.replace(/\D/g, '')}`} style={{ color: 'inherit' }}>{r.phone}</a></p>}
              {r.openingHours && <p className="meta"><Icon name="clock" size={16} /> {r.openingHours}</p>}
              {r.services && <p className="meta">{r.services}</p>}
              {r.rating && <p className="rating"><span><Star size={14} /> {r.rating.average.toLocaleString('fr-FR')}</span> · {r.rating.count} avis Google</p>}

              <div className="buttons">
                {r.googleMapsUrl && (
                  <a href={r.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn-maps"><Icon name="map" size={16} /> Itinéraire</a>
                )}
                <Link href={`/menus?restaurant=${r.slug}`} className="btn-order"><Icon name="utensils" size={16} /> Voir le menu</Link>
                {r.googleReviewUrl && (
                  <a href={r.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn-write-review"><Icon name="star" size={16} /> Donner mon avis</a>
                )}
              </div>
            </div>
          ))}

          {list.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon"><Icon name="store" size={48} /></div>
              <h3>Aucun restaurant trouvé</h3>
              <p>Aucun restaurant ne correspond à votre recherche</p>
              <button onClick={() => setSearch('')}>Voir tous les restaurants</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
