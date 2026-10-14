const STEPS = [
  {
    title: 'Choisissez votre Bonici',
    text: 'Sélectionnez le restaurant BONICI le plus proche de chez vous.',
    icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></>,
  },
  {
    title: 'Composez votre commande',
    text: 'Parcourez le menu et ajoutez vos plats — sans créer de compte.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.656-.437 1.243-1.095 1.243H3.225c-.658 0-1.165-.587-1.095-1.243l1.263-12c.064-.615.585-1.057 1.194-1.057h13.574c.609 0 1.13.442 1.194 1.057Z" />,
  },
  {
    title: 'Livraison ou à emporter',
    text: 'Suivez votre commande en direct, puis savourez vos plats.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.22-1.113-.615-1.53a15.04 15.04 0 0 0-2.084-1.637 2.056 2.056 0 0 0-1.58-.86H4.5v16.5h5.25m0-11.177h5.25v11.177m-5.25 0v3.375" />,
  },
];

export function HowItWorks() {
  return (
    <div className="s-how">
      <section className="how-it-works">
        <div className="container">
          <div className="section-header reveal">
            <h2>Comment ça marche</h2>
            <p>Votre commande en trois étapes simples</p>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step reveal" style={{ ['--i' as string]: i }} key={s.title}>
                <div className="step-icon">
                  <svg className="step-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
