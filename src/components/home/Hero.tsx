import { Star } from '@/components/Icon';

// The search is a plain GET form to /menus, so it works before JavaScript loads.
export function Hero({ stats }: { stats: { value: string; label: string; star?: boolean }[] }) {
  return (
    <div className="s-hero">
      <section className="hero">
        <div className="hero-bg">
          <div className="overlay" />
          <div className="pattern" />
        </div>

        <div className="hero-content">
          <div className="badge">
            <span className="dot" />
            Cuisine africaine, européenne, asiatique &amp; bien plus
          </div>

          <h1>Commandez vos<br /><em>plats préférés,</em><br />livrés rapidement</h1>

          <p className="sub">Découvrez des saveurs du monde entier — directement chez vous.</p>

          <form className="search-bar" action="/menus">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" name="search" placeholder="Rechercher un plat..." aria-label="Rechercher un plat" />
            <button type="submit">Commander</button>
          </form>

          <div className="stats">
            {stats.map((s, i) => (
              <div key={s.label} style={{ display: 'contents' }}>
                {i > 0 && <div className="divider" />}
                <div className="stat"><span className="num">{s.value}{s.star && <> <Star size={20} /></>}</span><span className="lbl">{s.label}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
