// One-off: copies the old Angular component styles into src/styles/legacy,
// wrapping each file in a scope class so they stay as isolated as they were
// under Angular's view encapsulation. Run once; the output is committed.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const oldApp = process.argv[2];
const out = new URL('../src/styles/legacy/', import.meta.url);

const files = {
  navbar: 'components/navbar/navbar.scss',
  hero: 'components/hero/hero.scss',
  categories: 'components/categories/categories.scss',
  popular: 'components/popular-dishes/popular-dishes.scss',
  how: 'components/how-it-works/how-it-works.scss',
  testimonials: 'components/testimonials/testimonials.scss',
  cta: 'components/cta/cta.scss',
  footer: 'components/footer/footer.scss',
  drawer: 'components/cart-sidebar/cart-sidebar.scss',
  home: 'pages/home/home.scss',
  menus: 'pages/menus/menus.scss',
  restaurants: 'pages/restaurants/restaurants.scss',
  cart: 'pages/cart/cart.scss',
  suivi: 'pages/suivi/suivi.scss',
  login: 'pages/auth/login/login.scss',
  register: 'pages/auth/register/register.scss',
  actualites: 'pages/bon-plan/actualites/actualites.scss',
  offres: 'pages/bon-plan/appels-offre/appels-offre.scss',
  candidature: 'pages/carriere/candidature-spontanee/candidature-spontanee.scss',
};

for (const [scope, rel] of Object.entries(files)) {
  const src = readFileSync(join(oldApp, rel), 'utf8');
  const vars = [];
  const body = [];
  for (const line of src.split(/\r?\n/)) {
    if (/^\$[\w-]+\s*:/.test(line)) vars.push(line);
    else if (/^@import url\(/.test(line)) continue; // fonts/icons now loaded in the root layout
    else body.push(line.replace(/:host/g, '&'));
  }
  const scss = `// Ported from Old-site/bonici-frontend-1/src/app/${rel}\n${vars.join('\n')}\n\n.s-${scope} {\n${body.join('\n')}\n}\n`;
  writeFileSync(new URL(`_${scope}.scss`, out), scss);
}
console.log(`Ported ${Object.keys(files).length} stylesheets`);
