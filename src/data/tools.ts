export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sessionKey: string;
  greeting: string;
  systemPrompt?: string;
  caps?: string[];
  commands?: string[];
  permissions?: Record<string, boolean>;
}

const WEBSITE_SYSTEM_PROMPT = `Tu es un assistant specialise dans la creation de sites web. Tu parles en francais.

## Ton role
Tu guides l'utilisateur etape par etape pour creer et deployer un site web complet.

## Etapes a suivre
1. **Comprendre le besoin** : pose des questions pour comprendre le type de site (portfolio, restaurant, blog, landing page...), le contenu souhaite, les couleurs/style preferes.
2. **Proposer un design** : decris le design que tu vas creer (sections, layout, palette de couleurs).
3. **Generer le code** : cree les fichiers HTML/CSS/JS directement dans /home/nodi/sites/<nom-du-site>/
4. **Donner l'URL** : le site est immediatement accessible.

## Deploiement sur le Nodi
Les sites sont heberges directement sur le Nodi. Pour creer un nouveau site :
\`\`\`bash
mkdir -p /home/nodi/sites/<nom-du-site>
# creer index.html, style.css, etc. dans ce dossier
\`\`\`
Le site est immediatement accessible a : {{BOX_URL}}/sites/<nom-du-site>/

## Modifier un site existant
Pour voir les sites existants :
\`\`\`bash
ls /home/nodi/sites/
\`\`\`
Pour modifier un site, lis les fichiers existants puis edite-les :
\`\`\`bash
cat /home/nodi/sites/<nom-du-site>/index.html
# puis reecris le fichier avec les modifications
\`\`\`
Les modifications sont visibles immediatement (pas besoin de redemarrer quoi que ce soit).

## Regles importantes
- Ne demande JAMAIS a l'utilisateur ou heberger le site. Deploie toujours directement sur le Nodi.
- Le nom du site doit etre en minuscules, sans espaces (utilise des tirets). Exemple : mon-portfolio, coco-garage.
- Apres la creation ou modification des fichiers, donne l'URL finale a l'utilisateur : {{BOX_URL}}/sites/<nom-du-site>/
- Cree des sites modernes, responsives, avec un bon design.
- Utilise du HTML/CSS moderne (flexbox, grid, variables CSS).
- Inclus toujours un meta viewport pour le responsive.
`;

export const TOOLS: ToolDefinition[] = [
  {
    id: "website",
    name: "Creer un site web",
    description: "Je te guide pour creer et deployer ton site internet, etape par etape.",
    icon: "\u{1F310}",
    color: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    sessionKey: "tool-website",
    greeting:
      "Salut ! Je vais t'aider a creer ton site web. Dis-moi : c'est pour quoi ? (portfolio, business, blog, autre ?)",
    systemPrompt: WEBSITE_SYSTEM_PROMPT,
    caps: ["system"],
    commands: ["system.run"],
    permissions: {
      "system.execute": true,
      "file.read": true,
      "file.write": true,
      "web.fetch": true,
    },
  },
  {
    id: "search",
    name: "Recherche web",
    description: "Je cherche des infos sur le web pour toi et je te fais un resume.",
    icon: "\u{1F50D}",
    color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    sessionKey: "tool-search",
    greeting:
      "Je suis pret a chercher sur le web pour toi. Qu'est-ce que tu veux savoir ?",
  },
  {
    id: "script",
    name: "Automatisation",
    description: "Je cree des scripts et des taches automatiques sur ton Nodi.",
    icon: "\u26A1",
    color: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    sessionKey: "tool-script",
    greeting:
      "On va automatiser quelque chose ! Decris-moi ce que tu veux automatiser et je m'en occupe.",
  },
  {
    id: "files",
    name: "Gestionnaire de fichiers",
    description: "Je t'aide a organiser, lire et modifier des fichiers sur ton Nodi.",
    icon: "\u{1F4C1}",
    color: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    sessionKey: "tool-files",
    greeting:
      "Je peux t'aider avec tes fichiers. Tu veux lister, lire ou modifier quelque chose ?",
  },
];
