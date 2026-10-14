// Bonici's menu, transcribed from the client's PDFs (Bonici/menus-pdf, October 2026).
// Two versions exist: menu A (2 Lions, Adjololo, Kpalimé, Tam Tam) and menu B (Aného, Kara,
// Ramatou). They are identical except that menu B also sells Red Bull.
// Photos are generic Unsplash pictures (see public/images/menu/CREDITS.md).

export interface MenuEntry {
  name: string;
  price?: number; // single price
  variants?: [label: string, price: number][]; // sizes / flavours
  description?: string;
  image: string; // file in public/images/menu, without extension
  featured?: boolean;
  onlyMenuB?: boolean;
}

export interface MenuSection {
  slug: string;
  name: string;
  items: MenuEntry[];
}

// The PDFs give pizzas two prices and the fish three; we read them as sizes.
const PIZZA = (m: number, g: number): [string, number][] => [['Moyenne', m], ['Grande', g]];

export const MENU: MenuSection[] = [
  {
    slug: 'pizzas', name: 'Pizzas', items: [
      { name: 'Pizza Bonici', variants: PIZZA(6000, 6500), description: 'Sauce tomate et crème fraîche, saucisson de DABA, poulet, oignon, poivron', image: 'pizza-bonici', featured: true },
      { name: 'Pizza Royale poulet', variants: PIZZA(5000, 5500), description: 'Sauce tomate, champignons, poulet, olive noire, emmental, mozzarella', image: 'pizza-royale-poulet' },
      { name: 'Pizza Royale jambon', variants: PIZZA(5000, 5500), description: 'Sauce tomate, champignons, jambon de dinde, olive noire, emmental, mozzarella', image: 'pizza-royale-jambon' },
      { name: 'Pizza Reine', variants: PIZZA(6000, 6500), description: 'Sauce tomate, champignons, jambon de dinde, bacon, olive noire, emmental, mozzarella', image: 'pizza-reine' },
      { name: 'Pizza Bolognaise', variants: PIZZA(4500, 5000), description: 'Sauce tomate, champignons, jambon de dinde, bacon, olive noire, emmental, mozzarella', image: 'pizza-bolognaise' },
      { name: 'Pizza Margherita', variants: PIZZA(3500, 4000), description: 'Sauce tomate, olive noire, emmental, mozzarella', image: 'pizza-margherita' },
      { name: 'Pizza Fruits de mer', variants: PIZZA(6500, 7000), description: 'Sauce crème, fromage, oignon haché, crevettes, calamar, poisson', image: 'pizza-fruits-de-mer' },
      { name: 'Chef Pizza', price: 7000, description: 'La recette du chef : demandez-la au restaurant', image: 'chef-pizza' },
    ],
  },
  {
    slug: 'burgers', name: 'Burgers', items: [
      { name: 'Cheese burger', price: 2000, description: 'Pain burger, tomate, laitue, oignon, sauce burger, steak, cheddar', image: 'cheese-burger' },
      { name: 'Double cheese', price: 3500, description: 'Pain burger, tomate, laitue, oignon, sauce burger, 2 steaks, 2 cheddars', image: 'double-cheese' },
      { name: 'Bonici burger', price: 2000, description: 'Pain burger, carotte, chou, mayo, steak, cheddar', image: 'bonici-burger', featured: true },
      { name: 'Burger', price: 1500, image: 'burger' },
    ],
  },
  {
    slug: 'sandwichs', name: 'Sandwichs', items: [
      { name: 'Sandwich viande', price: 2000, description: 'Oignon, viande hachée, curry, sauce vinaigrette', image: 'sandwich-viande' },
      { name: 'Sandwich poulet', price: 2000, description: 'Laitue, chiffonnade de poulet, tomate, œuf dur, sauce vinaigrette', image: 'sandwich-poulet' },
      { name: 'Sandwich au thon', price: 2000, image: 'sandwich-thon' },
      { name: 'Sandwich poisson', price: 1500, image: 'sandwich-poisson' },
    ],
  },
  {
    slug: 'chawarmas', name: 'Chawarmas', items: [
      { name: 'Chawarma viande', price: 1500, description: 'Pain chawarma, chou, carotte, viande de bœuf, sauce', image: 'chawarma-viande' },
      { name: 'Chawarma poulet', price: 1500, description: 'Pain chawarma, chou, carotte, poulet, sauce', image: 'chawarma-poulet', featured: true },
    ],
  },
  {
    slug: 'entrees', name: 'Entrées', items: [
      { name: 'Salade DIWA', price: 2500, image: 'salade-diwa' },
      // The PDF repeats the chawarma ingredients under this salad; left blank until Bonici confirms.
      { name: 'Salade fermière', price: 2500, image: 'salade-fermiere' },
    ],
  },
  {
    slug: 'oeufs', name: 'Nos œufs', items: [
      { name: 'Œuf au plat tourné', price: 2000, image: 'oeuf' },
    ],
  },
  {
    slug: 'poulets-croustillants', name: 'Poulets croustillants', items: [
      { name: 'Pilon de poulet avec frites', price: 3500, image: 'pilon-frites', featured: true },
    ],
  },
  {
    slug: 'poulets', name: 'Nos poulets', items: [
      { name: 'Demi poulet rôti', price: 3500, image: 'demi-poulet' },
      { name: 'Poulet entier rôti', price: 6500, image: 'poulet-entier', featured: true },
      { name: 'Cuisse de poulet', price: 3000, image: 'cuisse-poulet' },
    ],
  },
  {
    slug: 'poissons', name: 'Nos poissons', items: [
      { name: 'Poisson entier braisé', variants: [['Petit', 5000], ['Moyen', 7000], ['Grand', 10000]], image: 'poisson-braise', featured: true },
    ],
  },
  {
    slug: 'garnitures', name: 'Garnitures', items: [
      {
        name: 'Supplément de garniture',
        variants: [['Riz pilaf', 1000], ['Aloco', 1000], ['Pommes sautées', 1000], ['Pommes frites', 1000], ['Riz au gras', 1000], ['Légumes sautés', 1000]],
        description: 'Une portion de garniture en plus : riz pilaf, aloco, pommes sautées, pommes frites, riz au gras ou légumes sautés',
        image: 'garniture',
      },
    ],
  },
  {
    slug: 'pates', name: 'Nos pâtes', items: [
      { name: 'Spaghetti à la viande de bœuf et légumes', price: 2000, image: 'spaghetti-viande' },
      { name: 'Spaghetti au poulet, crème et champignons', price: 2500, description: 'Crème fraîche, émincé de poulet, champignons, curry', image: 'spaghetti-poulet' },
      { name: 'Spaghetti bolognaise', price: 2500, description: 'Carottes, oignons, poivrons, sauce tomate et viande hachée', image: 'spaghetti-bolognaise', featured: true },
      { name: 'Spaghetti omelette', price: 2000, image: 'spaghetti-omelette' },
    ],
  },
  {
    slug: 'boissons-chaudes', name: 'Boissons chaudes', items: [
      { name: 'Thé', variants: [['Vert', 500], ['Jaune', 500], ['Verveine', 500]], image: 'the' },
      { name: 'Café expresso', price: 1000, image: 'expresso' },
      { name: 'Café au lait', price: 1500, image: 'cafe-au-lait' },
      { name: 'Cappuccino', price: 1500, image: 'cappuccino' },
    ],
  },
  {
    slug: 'jus', name: 'Jus frais', items: [
      { name: 'Jus frais', variants: [['Orange', 1000], ['Ananas', 1000], ['Bissap', 1000], ['Gingembre', 1000], ['Pastèque', 1000]], image: 'jus-frais' },
      { name: 'Taste Nature', variants: [['0,5 L', 2000], ['1 L', 3000]], image: 'taste-nature' },
    ],
  },
  {
    slug: 'cocktails-sans-alcool', name: 'Cocktails sans alcool', items: [
      { name: 'Mojito light', price: 2500, description: 'Feuille de menthe, tranche de citron, sucre de canne, soda', image: 'mojito-light' },
      { name: 'Bora Bora', price: 2500, description: "Jus d'ananas, jus de citron, jus de fruit de la passion, sirop de grenadine", image: 'bora-bora' },
      { name: 'Jus Bonici', price: 2000, description: "Jus d'orange, jus de pastèque, sirop de fraise", image: 'jus-bonici' },
      { name: 'Ginger Milk', price: 2000, description: "Jus de gingembre, jus d'ananas, lait concentré, poudre de cannelle", image: 'ginger-milk' },
      { name: 'Ice chocolate', price: 2000, description: 'Café, poudre de cacao, lait liquide, glaçons', image: 'ice-chocolate' },
    ],
  },
  {
    slug: 'cocktails-avec-alcool', name: 'Cocktails avec alcool', items: [
      { name: 'Mojito', price: 3500, description: 'Feuille de menthe, tranche de citron, sucre de canne, rhum blanc, soda', image: 'mojito' },
      { name: 'Monaco', price: 2000, description: 'Bière brune, soda, sirop de grenadine', image: 'monaco' },
      { name: 'Sex on the Beach', price: 3500, description: 'Vodka, liqueur de pêche, jus de fruit de la passion, sirop de grenadine', image: 'sex-on-the-beach' },
      { name: 'Douceur du diable', price: 3500, description: 'Gingembre, lait de coco, curaçao bleu, rhum blanc', image: 'douceur-du-diable' },
    ],
  },
  {
    slug: 'aperitifs', name: 'Apéritifs', items: [
      { name: 'Shot Jägermeister', price: 1500, image: 'shot' },
      { name: 'Red Bull', price: 1500, image: 'energy-drink', onlyMenuB: true },
    ],
  },
  {
    slug: 'boissons-importees', name: 'Boissons importées', items: [
      { name: 'Boisson importée', variants: [['Heineken', 1500], ['Desperados', 1500], ['Smirnoff', 1500]], image: 'bieres-importees' },
    ],
  },
  {
    slug: 'sucreries', name: 'Sucreries', items: [
      {
        name: 'Sucrerie',
        variants: ['Lakta', 'Youzou', 'Chap Cola', 'Chap Limonade', 'World Cola', 'Youki Orange', 'Sport Actif', 'Tonic', 'Pompom', 'Cocktail de fruits', 'Chap Cocktail', 'Chap Lemon']
          .map((l): [string, number] => [l, 600]),
        image: 'sucreries',
      },
    ],
  },
  {
    slug: 'bieres', name: 'Bières', items: [
      {
        name: 'Bière',
        variants: ['Beaufort', 'Djama Panaché', 'Djama Lager', 'Djama Pilsner', 'Lager', 'Pils', 'Guinness', 'Chill']
          .map((l): [string, number] => [l, 800]),
        image: 'bieres',
      },
    ],
  },
  {
    slug: 'eaux', name: 'Eaux', items: [
      { name: 'Eau minérale', variants: [['0,5 L', 500], ['1,5 L', 1000]], image: 'eau-minerale' },
      { name: 'Eau gazeuse', price: 1500, image: 'eau-gazeuse' },
    ],
  },
];

/** Branches selling menu B (the only difference: Red Bull). */
export const MENU_B_BRANCHES = ['aneho', 'kara', 'ramatou'];
