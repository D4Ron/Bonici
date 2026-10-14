"""
Builds docs/Bonici-Deploiement.pdf, the deployment guide handed to whoever puts
bonici.africa in service.

Conventions carried over from the previous Kapi Consult deliverables:
- Structure of the company's "Fiche de déploiement" (SmartHub/OSEOR): Git
  repositories, technologies and versions, procedure, configuration files,
  database and accounts, prerequisites, points of attention.
- Written like the TriCV guide: for a reader with server access but no
  knowledge of the code, in French, saying *why* whenever the why changes what
  to do, with a check before going live and an appendix listing every setting.
- House style of the client-facing notes (ImmoTg / Diwa): Helvetica, 9.5pt body,
  11.5pt navy headings, borderless tables with hairline rules, shaded callouts
  with a red left bar.

The script is versioned next to the PDF so the guide is regenerated when the
procedure changes instead of drifting:

    python docs/build-deployment-pdf.py
"""

import os
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# --- palette (house style) ------------------------------------------------
INK = colors.HexColor("#0e0f12")
MUTED = colors.HexColor("#6b6f78")
NAVY = colors.HexColor("#16385e")
GREEN = colors.HexColor("#1c6b45")
RED = colors.HexColor("#a8321e")
SHADE = colors.HexColor("#f4f2eb")
RULE = colors.HexColor("#d8d8d8")

MARGIN = 57  # pt
PAGE_W, PAGE_H = A4
CONTENT_W = PAGE_W - 2 * MARGIN

DATE = "14 octobre 2026"
TITLE = "Bonici — Déploiement"
SUBTITLE = f"Site bonici.africa · Guide de déploiement · {DATE}"
REPO = "https://github.com/D4Ron/Bonici"

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Bonici-Deploiement.pdf")

S = {
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=19, leading=23, textColor=INK, spaceAfter=3),
    "sub": ParagraphStyle("sub", fontName="Helvetica", fontSize=9.5, leading=13, textColor=MUTED),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=NAVY,
                         spaceBefore=12, spaceAfter=5, keepWithNext=True),
    "h3": ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=9.5, leading=12.5, textColor=INK,
                         spaceBefore=8, spaceAfter=3, keepWithNext=True),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.5, leading=13.4, textColor=INK,
                           alignment=TA_LEFT, spaceAfter=5),
    "bullet": ParagraphStyle("bullet", fontName="Helvetica", fontSize=9.5, leading=13.2, textColor=INK,
                             leftIndent=12, bulletIndent=2, spaceAfter=2.5),
    "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=8.8, leading=11.6, textColor=INK),
    "cellb": ParagraphStyle("cellb", fontName="Helvetica-Bold", fontSize=8.8, leading=11.6, textColor=INK),
    "mono": ParagraphStyle("mono", fontName="Courier", fontSize=8.4, leading=11.8, textColor=NAVY),
    "callout": ParagraphStyle("callout", fontName="Helvetica", fontSize=9, leading=13.2, textColor=INK),
    "foot": ParagraphStyle("foot", fontName="Helvetica", fontSize=8, leading=11, textColor=MUTED),
}


def P(text, style="body"):
    # French typography: guillemets never wrap away from their content.
    return Paragraph(text.replace("« ", "«&nbsp;").replace(" »", "&nbsp;»"), S[style])


def C(text):
    """Inline code."""
    return f"<font face='Courier' size='8.4' color='#16385e'>{escape(text)}</font>"


def bullets(items):
    return [Paragraph(i.replace("« ", "«&nbsp;").replace(" »", "&nbsp;»"), S["bullet"], bulletText="•") for i in items]


def table(rows, widths, header=True):
    """Borderless table: bold header with a rule under it, hairline rows.
    Cells given as plain strings become paragraphs (bold in the header row)."""
    data = []
    for r, row in enumerate(rows):
        data.append([
            c if not isinstance(c, str) else P(c, "cellb" if (header and r == 0) else "cell")
            for c in row
        ])
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
    ]
    if header:
        style += [("LINEBELOW", (0, 0), (-1, 0), 0.9, INK), ("LINEBELOW", (0, 1), (-1, -2), 0.4, RULE)]
    else:
        style += [("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE)]
    t = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    t.setStyle(TableStyle(style))
    return t


def code(*lines, heading=None):
    """Commands to copy as-is: shaded, monospace, never reflowed."""
    body = "<br/>".join(escape(l).replace(" ", "&nbsp;") if l else "&nbsp;" for l in lines)
    t = Table([[Paragraph(body, S["mono"])]], colWidths=[CONTENT_W], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f6f7f9")),
        ("BOX", (0, 0), (-1, -1), 0.4, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    head = [P(heading, "h3")] if heading else []
    return KeepTogether(head + [Spacer(1, 2), t, Spacer(1, 7)])  # a heading never ends a page alone


def callout(title, text, bar=RED):
    """Shaded block with a coloured left bar (house style)."""
    inner = P(f"<b>{title}</b><br/>{text}", "callout")
    outer = Table([[inner]], colWidths=[CONTENT_W], hAlign="LEFT")
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SHADE),
        ("LINEBEFORE", (0, 0), (0, -1), 2.4, bar),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return KeepTogether([Spacer(1, 3), outer, Spacer(1, 8)])


def todo(text):
    return P(f"<font color='#a8321e'><b>{text}</b></font>", "cell")


def ok(text):
    return P(f"<font color='#1c6b45'><b>{text}</b></font>", "cell")


def chrome(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 30, f"{TITLE} · {DATE}")
    canvas.drawRightString(PAGE_W - MARGIN, 30, f"page {doc.page}")
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN, 42, PAGE_W - MARGIN, 42)
    canvas.restoreState()


def section(title):
    return [CondPageBreak(110), P(title, "h2")]


# --- content ------------------------------------------------------------------
story = []

story.append(P(TITLE, "h1"))
story.append(P(SUBTITLE, "sub"))
story.append(Spacer(1, 8))
story.append(Table([[""]], colWidths=[CONTENT_W], rowHeights=[0.9],
                   style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), INK)]), hAlign="LEFT"))
story.append(Spacer(1, 12))

story.append(P(
    "Ce document s'adresse à la personne qui installe et met en service le nouveau site de Bonici Africa. "
    "Il suppose un accès administrateur à un serveur Linux et à la zone DNS du domaine, et <b>aucune "
    "connaissance du code</b>. Chaque étape dit ce qu'il faut faire et, quand cela change la décision, pourquoi."))
story.append(P(
    "Le site remplace l'ancienne application Angular / Django. Il comprend le site public (menus des sept "
    "restaurants, commande sans compte, suivi de commande, avis Google, bon plan, candidatures) et "
    "l'administration (<b>/admin</b>) pour la direction et les gérants de restaurant. Deux fichiers du dépôt "
    f"l'accompagnent : {C('README.md')} (développement) et {C('.env.example')} (toutes les variables, commentées)."))

# 1. Dépôt ------------------------------------------------------------------------
story += section("1. Dépôt Git")
story.append(table([
    ["Composant", "Dépôt", "Branche"],
    ["Site public, administration, API et base (un seul projet)", f"<b>{REPO}</b>", "main"],
], [170, 230, CONTENT_W - 400]))
story.append(Spacer(1, 6))
story.append(P(
    "Tout est dans un seul dépôt et se déploie d'un bloc : il n'y a ni frontend ni backend séparés à "
    "installer. Le guide lui-même et le script qui le produit sont dans " + C("docs/") + "."))

# 2. Technologies ------------------------------------------------------------------
story += section("2. Technologies et versions")
story.append(table([
    ["Technologie", "Version", "Rôle"],
    ["Next.js (App Router)", "16.3.8", "Site public, administration et actions serveur"],
    ["React", "19.3", "Interface"],
    ["TypeScript", "5.9", "Langage de tout le projet"],
    ["Node.js", "24 (image node:24-alpine)", "Exécution de l'application"],
    ["PostgreSQL", "16 (image postgres:16-alpine)", "Base de données"],
    ["Prisma", "6.19.3", "Accès à la base et migrations"],
    ["Caddy", "2 (image caddy:2-alpine)", "Reverse proxy, HTTPS automatique (Let's Encrypt)"],
    ["Docker / Docker Compose", "Docker 24+ avec le plugin compose v2", "Installation et exploitation"],
    ["Zod · bcryptjs · Nodemailer", "4.6 · 3.0 · 7.0", "Validation · mots de passe · envoi d'emails"],
    ["Sass", "1.105", "Feuilles de style (reprises de l'ancien site)"],
    ["Vitest", "4.1", "Tests (prix, statuts de commande, droits)"],
    ["Odoo (facultatif)", "14 à 19, testé sur 18", "Réception des commandes en bons de commande"],
], [130, 150, CONTENT_W - 280]))

# 3. Architecture ------------------------------------------------------------------
story += section("3. Ce qui tourne, et ce qui est exposé")
story.append(P(
    "Le site tourne entièrement dans Docker, sur un seul serveur. Quatre services, dont un seul est joignable "
    "depuis Internet :"))
story.append(table([
    ["Service", "Rôle", "Exposé sur Internet"],
    ["<b>proxy</b> (Caddy)", "Reçoit tout le trafic, obtient et renouvelle le certificat HTTPS, transmet à l'application",
     ok("Oui — ports 80 et 443")],
    ["<b>app</b> (Next.js)", "Le site et l'administration", "Non — 127.0.0.1:3000 uniquement"],
    ["<b>db</b> (PostgreSQL)", "La base de données", "Non — réseau Docker interne"],
    ["<b>migrate</b>", "À chaque démarrage : applique les migrations et charge les données de base, puis s'arrête",
     "Non"],
], [100, 230, CONTENT_W - 330]))
story.append(Spacer(1, 6))
story.append(callout(
    "Pourquoi l'application n'écoute que sur 127.0.0.1",
    "Docker ouvre les ports qu'il publie <b>en contournant le pare-feu ufw</b>. Un port publié sur toutes les "
    "interfaces serait donc joignable depuis Internet même avec ufw activé — en HTTP, sans chiffrement. "
    f"C'est pourquoi {C('compose.yaml')} publie l'application sur 127.0.0.1 seulement : tout le trafic public "
    "passe par Caddy, en HTTPS."))
story.append(P(
    "Deux volumes Docker contiennent les données à conserver : <b>db_data</b> (la base : commandes, carte, "
    "comptes, avis) et <b>uploads</b> (photos ajoutées dans l'administration, documents d'appels d'offre, CV "
    "des candidatures). Le reste se reconstruit depuis le dépôt."))

# 4. Prérequis --------------------------------------------------------------------
story += section("4. Prérequis serveur")
story.append(table([
    ["Prérequis", "Valeur"],
    ["Système", "Linux, Ubuntu 22.04 ou 24.04 LTS (VPS)"],
    ["RAM", "2 Go minimum, 4 Go recommandés (la construction de l'image est la phase la plus gourmande)"],
    ["CPU", "2 vCPU"],
    ["Stockage", "20 Go (images Docker, base, photos, sauvegardes locales)"],
    ["Accès", "SSH avec un utilisateur sudo"],
    ["Ports à ouvrir", "22 (SSH), 80 et 443 (web) — rien d'autre"],
    ["Domaine", "Accès à la zone DNS de bonici.africa"],
    ["Facultatif", "Un compte SMTP (emails « mot de passe oublié ») ; un accès Odoo (section 9)"],
], [110, CONTENT_W - 110]))

# 5. Procédure --------------------------------------------------------------------
story += section("5. Procédure de déploiement")

story.append(code(
    "curl -fsSL https://get.docker.com | sudo sh",
    "sudo usermod -aG docker $USER      # puis se déconnecter / reconnecter",
    "",
    "sudo ufw allow OpenSSH",
    "sudo ufw allow 80",
    "sudo ufw allow 443",
    "sudo ufw enable",
    heading="5.1 — Préparer le serveur",
))

story.append(P("5.2 — Faire pointer le domaine", "h3"))
story.append(P(
    "Chez le registrar, faire pointer le domaine vers l'adresse IP publique du serveur. À faire <b>avant</b> le "
    "premier démarrage : Caddy a besoin que le domaine mène au serveur pour obtenir le certificat HTTPS."))
story.append(table([
    ["Type", "Nom", "Valeur"],
    ["A", "bonici.africa (ou @)", "IP du serveur"],
    ["A", "www", "IP du serveur"],
], [50, 170, CONTENT_W - 220]))
story.append(Spacer(1, 4))
story.append(P(f"Vérifier depuis le serveur : {C('dig +short bonici.africa')} doit renvoyer son IP. La propagation "
               "prend de quelques minutes à quelques heures."))
story.append(callout(
    "Basculer depuis l'ancien site",
    "L'ancien site est servi sur ce même domaine : la bascule a lieu au moment où le DNS change. Installer et "
    "vérifier d'abord le nouveau serveur, au besoin sur un sous-domaine de test (DOMAIN=nouveau.bonici.africa), "
    "puis changer le DNS. <b>Aucune donnée n'est à migrer</b> : l'ancienne base ne contenait aucun plat, aucune "
    "commande réelle ni aucun avis (vérifié en octobre 2026). La carte et les avis sont chargés par le nouveau site.",
    bar=NAVY))

story.append(code(
    "git clone https://github.com/D4Ron/Bonici.git bonici",
    "cd bonici",
    "cp .env.example .env",
    "chmod 600 .env",
    "nano .env",
    heading="5.3 — Récupérer le site et le configurer",
))
story.append(P(
    f"Le fichier {C('.env')} porte les secrets de cette installation : il n'est jamais versionné "
    f"(exclu par {C('.gitignore')}). Les valeurs ci-dessous sont obligatoires ; toutes les autres sont décrites "
    "en annexe."))
story.append(table([
    ["Variable", "Ce qu'elle protège ou règle", "Comment la produire"],
    ["<b>POSTGRES_PASSWORD</b>", "L'accès à la base de données.", C("openssl rand -base64 24")],
    ["<b>ADMIN_EMAIL</b><br/><b>ADMIN_PASSWORD</b>",
     "Le premier compte administrateur, créé au premier démarrage si aucun administrateur n'existe.",
     "Un mot de passe provisoire d'au moins 8 caractères, transmis à son titulaire hors du fichier. "
     "À changer dès la première connexion."],
    ["<b>SITE_URL</b>", "Les liens envoyés par email (mot de passe oublié).", C("https://bonici.africa")],
    ["<b>DOMAIN</b>", "Le domaine pour lequel Caddy demande le certificat.", C("bonici.africa")],
], [128, 160, CONTENT_W - 288]))
story.append(Spacer(1, 4))
story.append(P(f"{C('DATABASE_URL')} est ignorée en production : Docker la construit à partir de POSTGRES_*. "
               "La laisser telle quelle."))

story.append(code("docker compose -f compose.yaml --profile prod up -d --build", heading="5.4 — Premier démarrage"))
story.append(callout(
    "Toujours « -f compose.yaml » en production",
    f"Sans cette option, Docker ajoute automatiquement {C('compose.override.yaml')}, la configuration de "
    "développement : rechargement à chaud, code monté depuis le disque, base de données exposée sur le port 5433. "
    "Le profil <b>prod</b> démarre Caddy, qui n'existe pas en développement."))
story.append(P("La première construction prend 5 à 15 minutes. Suivre son avancement :"))
story.append(code(
    "docker compose -f compose.yaml logs -f migrate",
    "#   doit finir par : Seed done: 7 branches, 53 dishes in 20 categories, 59 new reviews.",
    "docker compose -f compose.yaml logs -f proxy",
    "#   doit contenir : certificate obtained successfully",
    "docker compose -f compose.yaml ps",
    "#   app : Up (healthy)",
))

# 6. Base de données ----------------------------------------------------------------
story += section("6. Base de données et comptes")
story.append(table([
    ["Paramètre", "Valeur"],
    ["Type", "PostgreSQL 16, dans le conteneur db"],
    ["Nom de la base / utilisateur", "POSTGRES_DB / POSTGRES_USER du .env (bonici / bonici par défaut)"],
    ["Port", "5432, réseau Docker interne uniquement"],
    ["Création", "Automatique au premier démarrage du conteneur — aucune commande à lancer"],
    ["Schéma", f"Géré par les migrations Prisma ({C('prisma/migrations')}), appliquées automatiquement à chaque démarrage"],
], [150, CONTENT_W - 150]))

story.append(P("Données chargées au premier démarrage", "h3"))
story.extend(bullets([
    "<b>Les 7 restaurants</b> avec adresse, téléphone et coordonnées GPS : Ramatou, 2 Lions, Adjololo, Tam Tam "
    "(Lomé), Aného, Kpalimé, Kara.",
    "<b>La carte</b> : 53 articles en 20 catégories, transcrits des menus PDF de Bonici, avec tailles et parfums "
    "(pizzas Moyenne / Grande, poisson Petit / Moyen / Grand, jus, bières…). Le Red Bull n'est proposé qu'à Aného, "
    "Kara et Ramatou, comme sur leur menu.",
    "<b>Les 59 avis Google</b> des fiches Ramatou, Aného et 2 Lions. Le site n'affiche que ceux de 4 étoiles et plus "
    "avec un commentaire ; la note moyenne les compte tous.",
    "<b>Le compte administrateur</b> défini par ADMIN_EMAIL / ADMIN_PASSWORD.",
]))
story.append(callout(
    "Le chargement ne réécrase jamais l'administration",
    "Il est rejoué à chaque démarrage mais n'ajoute que ce qui manque : la carte n'est chargée que dans une base "
    "sans aucun plat, et un restaurant déjà présent n'est pas modifié. Les prix, photos et disponibilités saisis "
    "dans l'administration survivent donc aux mises à jour.", bar=NAVY))

story.append(P("Comptes", "h3"))
story.append(table([
    ["Compte", "Création", "Ce qu'il voit"],
    ["Administrateur", "Au premier démarrage (ADMIN_EMAIL), puis Admin › Utilisateurs",
     "Tout : commandes de tous les restaurants, carte, promotions, avis, contenus, candidatures, Odoo"],
    ["Gérant de restaurant", "Admin › Utilisateurs › rôle « Gérant », rattaché à un restaurant",
     "Les commandes et la disponibilité de la carte de son seul restaurant"],
    ["Client", "Facultatif, par le client lui-même (Inscription)", "Ses propres commandes"],
], [100, 175, CONTENT_W - 275]))
story.append(Spacer(1, 4))
story.append(P(
    "Il n'existe <b>aucun mot de passe par défaut partagé</b> : le seul compte créé automatiquement est celui du "
    ".env. Les clients n'ont pas besoin de compte pour commander — c'était le principal défaut de l'ancien site."))

# 7. Contrôle ------------------------------------------------------------------------
story += section("7. Contrôle avant l'ouverture au public")
story.append(P(
    "Un site qui démarre n'est pas un site prêt. Dans l'ordre, une fois le premier démarrage terminé :"))
story.append(table([
    ["#", "Vérification", "Attendu"],
    ["1", f"Ouvrir {C('https://bonici.africa')}", "Cadenas HTTPS ; www.bonici.africa redirige vers le domaine principal"],
    ["2", f"Ouvrir {C('https://bonici.africa/api/health')}", C('{"ok":true}')],
    ["3", "Menus : choisir un restaurant, ajouter une pizza en taille Grande, commander sans compte",
     "La commande s'affiche avec son lien de suivi"],
    ["4", "Se connecter à /admin avec le compte du .env", "La commande test apparaît ; la passer en « Annulée »"],
    ["5", "Admin › Utilisateurs › votre compte : nouveau mot de passe", "Le mot de passe provisoire n'est plus valable"],
    ["6", "Créer un compte Gérant par restaurant", "Chaque gérant ne voit que son restaurant"],
    ["7", "« Mot de passe oublié » avec une adresse réelle", "Email reçu (si SMTP configuré)"],
    ["8", "Mettre en place les sauvegardes (section 10) et en restaurer une", "La restauration fonctionne"],
], [18, 250, CONTENT_W - 268]))
story.append(Spacer(1, 6))
story.append(P("Informations encore attendues de Bonici", "h3"))
story.append(table([
    ["Élément", "Où le saisir", "État"],
    ["Adresse exacte de Bonici Tam Tam (latitude / longitude)", "Admin › Restaurants › Tam Tam", todo("À fournir")],
    ["Horaires de chaque restaurant (actuellement « Jusqu'à 23h »)", "Admin › Restaurants", todo("À fournir")],
    ["Confirmation des tailles (pizzas, poisson)", "Admin › Plats", todo("À confirmer")],
    ["Description de la Salade fermière", "Admin › Plats", todo("À fournir")],
    ["Texte des CGU ; relecture de la politique de confidentialité", "Pages /cgu et /confidentialite (code)", todo("À fournir")],
    ["Photos réelles des plats (les actuelles sont génériques)", "Admin › Plats › Image", todo("Progressif")],
    ["Les 7 restaurants, la carte, les avis Google, les numéros", "—", ok("Chargés")],
], [215, 165, CONTENT_W - 380]))

# 8. Mises à jour --------------------------------------------------------------------
story += section("8. Mises à jour et retour arrière")
story.append(code(
    "cd ~/bonici",
    "# sauvegarder d'abord (section 10)",
    "git pull",
    "docker compose -f compose.yaml --profile prod up -d --build",
))
story.append(P(
    "Les migrations de la base s'appliquent toutes seules au redémarrage : il n'y a pas de commande à ne pas "
    "oublier. Pendant la reconstruction, l'ancienne version reste en ligne ; la coupure se limite au redémarrage "
    "du conteneur, quelques secondes."))
story.append(code(
    "git log --oneline -5          # repérer le commit précédent",
    "git checkout <commit>",
    "docker compose -f compose.yaml --profile prod up -d --build",
    heading="Revenir à la version précédente",
))
story.append(callout(
    "Une migration appliquée ne se défait pas",
    "Revenir au code précédent ne retire pas une modification de la base déjà faite. Si une mise à jour a changé "
    "la base et pose problème, la seule voie sûre est de restaurer la sauvegarde faite juste avant — d'où la "
    "sauvegarde avant chaque mise à jour."))

# 9. Odoo ------------------------------------------------------------------------------
story += section("9. Odoo (facultatif)")
story.append(P(
    "Si Bonici utilise Odoo, chaque commande du site peut y être créée automatiquement comme <b>bon de commande</b> "
    "(application Ventes) : client retrouvé par son téléphone ou créé, lignes avec remises, frais de livraison, "
    "référence WEB-<i>n°</i>. Une annulation sur le site annule aussi le bon dans Odoo."))
story.extend(bullets([
    "Dans Odoo : Préférences › Sécurité du compte › <b>Nouvelle clé API</b>, pour un utilisateur ayant les droits Ventes.",
    "Créer deux produits : un produit générique « Plat (site web) » et « Frais de livraison ». Noter leurs ID.",
    f"Dans {C('.env')} : ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, ODOO_FALLBACK_PRODUCT_ID, ODOO_DELIVERY_PRODUCT_ID.",
    f"Redémarrer ({C('docker compose -f compose.yaml --profile prod up -d')}) puis vérifier Admin › <b>Odoo</b> : « Connecté ».",
    "Pour un suivi fin des ventes et du stock, renseigner sur chaque plat son ID produit Odoo (Admin › Plats).",
]))
story.append(callout(
    "Les prix du site sont TTC",
    "Par défaut, aucune taxe n'est ajoutée par Odoo : sinon la TVA de 18 % s'ajouterait au montant que le client a "
    "réellement payé, et la comptabilité ne correspondrait plus à la caisse (problème constaté et corrigé lors des "
    "tests sur Odoo 18). Pour déclarer la TVA, créer dans Odoo une taxe « incluse dans le prix » et mettre son ID "
    "dans ODOO_LINE_TAX_IDS. Si les totaux diffèrent malgré tout, la commande n'est pas créée dans Odoo et l'erreur "
    "s'affiche dans l'administration."))
story.append(P(
    "Si Odoo est indisponible, <b>les commandes continuent de fonctionner</b> : elles sont marquées « échec » et se "
    "renvoient depuis Admin › Odoo › « Synchroniser maintenant », sans risque de doublon."))

# 10. Sauvegardes --------------------------------------------------------------------
story += section("10. Sauvegardes et restauration")
story.append(P(
    "Deux choses sont à sauvegarder, et perdre l'une sans l'autre laisse un site incohérent (des plats dont la "
    "photo a disparu, des candidatures sans CV) : la base, et le volume des fichiers envoyés. Au minimum chaque "
    "jour, et avant chaque mise à jour."))
story.append(P(
    f"Le dépôt fournit {C('scripts/backup.sh')}, qui fait les deux : il exporte la base, archive le volume des "
    f"fichiers, et supprime les sauvegardes de plus de 14 jours. Tout est écrit dans {C('~/sauvegardes')}. "
    "Le lancer une fois à la main pour vérifier :"))
story.append(code("~/bonici/scripts/backup.sh"))
story.append(P(f"Puis l'automatiser chaque nuit à 3 h ({C('crontab -e')}, une seule ligne) :"))
story.append(code("0 3 * * * $HOME/bonici/scripts/backup.sh >> $HOME/sauvegardes/backup.log 2>&1"))
story.append(callout(
    "Pourquoi un script plutôt qu'une longue ligne de cron",
    "Une ligne de crontab ne peut pas être coupée en plusieurs lignes, et une commande de sauvegarde complète ne "
    "tient pas sur une ligne lisible : recopiée avec une coupure, elle ne s'exécute jamais, et rien ne le signale. "
    f"Le script s'arrête au contraire à la première erreur et laisse une trace dans {C('backup.log')}. "
    f"Copier régulièrement {C('~/sauvegardes')} hors du serveur : une sauvegarde sur la même machine ne protège "
    "pas d'une panne du serveur.", bar=NAVY))
story.append(code(
    "gunzip -c ~/sauvegardes/bonici-AAAA-MM-JJ.sql.gz \\",
    "  | docker compose -f compose.yaml exec -T db psql -U bonici -d bonici",
    heading="Restaurer",
))
story.append(callout(
    "Une sauvegarde jamais restaurée n'est pas une sauvegarde",
    "La restaurer une fois sur une installation d'essai, avant d'en avoir besoin. C'est le seul moyen de savoir "
    "qu'elle est complète."))

# 11. Exploitation ------------------------------------------------------------------
story += section("11. Exploitation courante")
story.append(table([
    ["Besoin", "Commande"],
    ["Voir l'état des services", C("docker compose -f compose.yaml ps")],
    ["Logs du site", C("docker compose -f compose.yaml logs -f --tail=100 app")],
    ["Redémarrer le site", C("docker compose -f compose.yaml restart app")],
    ["Renvoyer les commandes vers Odoo", C("docker compose -f compose.yaml run --rm migrate npm run odoo:sync")],
    ["Espace disque Docker / nettoyage", C("docker system df") + " · " + C("docker image prune")],
], [165, CONTENT_W - 165]))

# 12. Points d'attention / dépannage -------------------------------------------------
story += section("12. Points d'attention et dépannage")
story.extend(bullets([
    "<b>Le DNS avant le démarrage.</b> Si le domaine ne mène pas encore au serveur, Caddy ne peut pas obtenir le "
    "certificat et réessaie en boucle ; une fois le DNS propagé : "
    + C("docker compose -f compose.yaml restart proxy") + ".",
    "<b>Le fichier .env n'est jamais copié dans l'image.</b> Après l'avoir modifié, relancer "
    + C("docker compose -f compose.yaml --profile prod up -d") + " pour que les conteneurs le relisent.",
    "<b>Changer POSTGRES_PASSWORD après le premier démarrage ne suffit pas</b> : PostgreSQL l'a déjà enregistré dans "
    "le volume. Le changer aussi dans la base (" + C("ALTER USER bonici PASSWORD '...'") + ") ou repartir d'un volume vide.",
    "<b>Sans SMTP</b>, les liens « mot de passe oublié » ne partent pas : ils s'affichent dans " + C("logs app") + ". "
    "Le reste du site n'est pas affecté.",
    "<b>Les CV des candidatures sont des données personnelles</b> : ils ne sont accessibles qu'aux administrateurs, "
    "jamais par une adresse publique, et font partie de la sauvegarde des fichiers.",
]))
story.append(Spacer(1, 4))
story.append(table([
    ["Symptôme", "Cause probable et solution"],
    ["Pas de HTTPS, erreur de certificat", "DNS pas encore propagé, ou ports 80/443 fermés : vérifier " + C("dig") +
     " et " + C("sudo ufw status") + ", puis redémarrer proxy."],
    ["Page « Un problème est survenu »", "La base est indisponible : " + C("ps") + " puis " + C("logs db") + " et " + C("logs app") + "."],
    ["Le site ne démarre pas, migrate en erreur", C("logs migrate") + " — le plus souvent un .env incomplet ou un mot de passe de base modifié (voir ci-dessus)."],
    ["Commandes « échec » dans Admin › Odoo", "Le message s'affiche sur la commande (clé API, ID produit, totaux) ; corriger puis « Synchroniser maintenant »."],
    ["Un plat n'apparaît pas dans un restaurant", "Admin › Restaurants › Carte : le plat doit être coché « à la carte » et « disponible »."],
], [170, CONTENT_W - 170]))

# Annexe -------------------------------------------------------------------------------
story.append(PageBreak())
story.append(P("Annexe — Toutes les variables du fichier .env", "h2"))
story.append(P(
    "Le corps du guide dit quoi faire, dans l'ordre. Cette annexe dit <i>tout</i> ce qui se règle, pour la personne "
    "qui reprend une installation existante. Une variable absente de ce tableau est une variable que l'application "
    "ne lit pas."))


def env_block(title, rows):
    return [P(title, "h3"), table([["Variable", "Ce qu'elle fait", "Ce qu'il faut y mettre ici"]] + rows,
                                  [158, 150, CONTENT_W - 308]), Spacer(1, 6)]


story += env_block("A.1 — Base de données", [
    ["<b>POSTGRES_USER</b> / <b>POSTGRES_DB</b>", "Utilisateur et nom de la base, créés au premier démarrage.", "bonici / bonici."],
    ["<b>POSTGRES_PASSWORD</b>", "Mot de passe de la base.", "<b>Obligatoire.</b> Aléatoire et long (5.3). Voir les points d'attention avant de le changer."],
    ["<b>DATABASE_URL</b>", "Adresse de la base pour l'application.", "Ignorée en production (construite par Docker). Sert au développement sans Docker."],
])
story += env_block("A.2 — Site", [
    ["<b>SITE_URL</b>", "Adresse publique, utilisée dans les liens des emails.", "https://bonici.africa"],
    ["<b>DOMAIN</b>", "Domaine du certificat HTTPS (Caddy).", "bonici.africa — www est redirigé automatiquement."],
    ["<b>APP_PORT</b>", "Port local de l'application, derrière Caddy.", "3000 par défaut. À changer seulement si le port est pris."],
    ["<b>UPLOAD_DIR</b>", "Dossier des fichiers envoyés.", "Fixé par Docker (/app/uploads, volume uploads). Ne pas modifier."],
    ["<b>CONTACT_EMAIL</b>", "Email affiché sur la page Contact et dans le pied de page.", "Facultatif. Vide : aucun email affiché."],
])
story += env_block("A.3 — Premier administrateur", [
    ["<b>ADMIN_EMAIL</b>", "Adresse du compte créé au premier démarrage.", "Celle du responsable du site."],
    ["<b>ADMIN_PASSWORD</b>", "Son mot de passe provisoire.", "8 caractères minimum. Ignoré dès qu'un administrateur existe : le changer ensuite dans l'administration, pas ici."],
])
story += env_block("A.4 — Email (mot de passe oublié)", [
    ["<b>SMTP_HOST</b> / <b>SMTP_PORT</b>", "Serveur d'envoi.", "Celui de l'hébergeur de messagerie ; port 587 (ou 465). Vide : les emails sont écrits dans les logs."],
    ["<b>SMTP_USER</b> / <b>SMTP_PASSWORD</b>", "Compte d'envoi.", "Chez Gmail : un mot de passe d'application, jamais celui du compte."],
    ["<b>MAIL_FROM</b>", "Expéditeur affiché.", "Bonici &lt;no-reply@bonici.africa&gt;"],
])
story += env_block("A.5 — Odoo (facultatif)", [
    ["<b>ODOO_URL</b>, <b>ODOO_DB</b>", "Adresse et base Odoo.", "Vides : intégration désactivée, les commandes restent sur le site."],
    ["<b>ODOO_USERNAME</b>, <b>ODOO_API_KEY</b>", "Compte et clé API (ou mot de passe).", "Un utilisateur ayant les droits Ventes."],
    ["<b>ODOO_FALLBACK_PRODUCT_ID</b>", "Produit utilisé pour un plat sans ID produit Odoo.", "ID du produit « Plat (site web) »."],
    ["<b>ODOO_DELIVERY_PRODUCT_ID</b>", "Produit des frais de livraison.", "ID du produit « Frais de livraison »."],
    ["<b>ODOO_CONFIRM_ORDERS</b>", "Confirmer le bon dans Odoo ou le laisser en devis.", "true (défaut)."],
    ["<b>ODOO_LINE_TAX_IDS</b>", "Taxes appliquées aux lignes.", "Vide (aucune taxe ajoutée) ou l'ID d'une taxe incluse dans le prix (section 9)."],
])

story.append(Spacer(1, 10))
story.append(P(
    f"Dépôt : {REPO} · Guide généré par {C('docs/build-deployment-pdf.py')} — le modifier et le relancer quand la "
    "procédure change, plutôt que de corriger le PDF à la main.", "foot"))


# --- build ---------------------------------------------------------------------
def build():
    doc = BaseDocTemplate(
        OUT, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN, topMargin=MARGIN - 6, bottomMargin=MARGIN,
        title=TITLE, author="Kapi Consult", subject="Guide de déploiement du site bonici.africa",
    )
    frame = Frame(MARGIN, MARGIN, CONTENT_W, PAGE_H - 2 * MARGIN + 6, id="main",
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="page", frames=[frame], onPage=chrome)])
    doc.build(story)
    print(f"written: {OUT}")


if __name__ == "__main__":
    build()
