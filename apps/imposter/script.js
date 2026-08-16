// =========================
// ORIGINAL VARIABLES
// =========================

let players = [];
let assignments = [];
let currentIndex = 0;
let word = "";
let imposters = 1;

let votes = {};
let votingTurnIndex = 0;
let voteCounts = {};
let starterIndex = 0;

let randomMode = false;
let sharedDecks = [];
let selectedSharedDeckId = "";
let selectedTopicName = "";
const sharedDeckStorageKey = "imposter:selectedSharedDeckId";

// 🆕 ROUND SYSTEM
let round = 1;
let totalRounds = 1;


// =========================
// 🔥 WORD BANK (UNCHANGED)
// =========================
const wordBank = {
  English: {

    Movies: [
      "Titanic","Avatar","Inception","Gladiator","Frozen","Joker","Matrix","Batman","Spiderman","Superman",
      "Iron Man","Avengers","Interstellar","Lion King","Harry Potter","Jurassic Park","Shrek","Toy Story","Up","Cars",
      "Finding Nemo","Aladdin","Coco","Moana","Deadpool","Thor","Hulk","Black Panther","Doctor Strange","Dune",
      "Top Gun","Rocky","Rambo","Godfather","Scarface","Jaws","E.T.","Terminator","Transformers","Fast and Furious",
      "Mission Impossible","Pirates Caribbean","Frozen 2","Inside Out","Minions","Despicable Me","Kung Fu Panda","Madagascar","Ice Age","Megamind"
    ],

    Food: [
      "Pizza","Burger","Pasta","Sushi","Taco","Biryani","Sandwich","Fries","Noodles","Salad",
      "Steak","Chicken","Rice","Bread","Cheese","Chocolate","Ice Cream","Cake","Donut","Pancake",
      "Waffle","Soup","Dumpling","Curry","Hotdog","Kebab","Nachos","Popcorn","Apple","Banana",
      "Orange","Mango","Strawberry","Grapes","Watermelon","Coffee","Tea","Milk","Juice","Smoothie",
      "Egg","Fish","Shrimp","Lobster","Butter","Jam","Honey","Peanut Butter","Cereal","Oatmeal"
    ],

    Brands: [
      "Apple","Google","Microsoft","Amazon","Tesla","Nike","Adidas","Coca Cola","Pepsi","McDonalds",
      "Starbucks","Netflix","Disney","Samsung","Sony","Intel","BMW","Mercedes","Toyota","Honda",
      "Uber","Airbnb","Spotify","Snapchat","Instagram","Facebook","Twitter","YouTube","PayPal","Visa",
      "Mastercard","Zara","H&M","Gucci","Louis Vuitton","Rolex","Puma","Dell","HP","Lenovo",
      "LG","Panasonic","Philips","Nvidia","AMD","Red Bull","KFC","Burger King","Subway","Dominos"
    ],

    FamousPeople: [
      "Einstein","Newton","Elon Musk","Bill Gates","Steve Jobs","Taylor Swift","Drake","Rihanna","Beyonce","Kanye West",
      "Messi","Ronaldo","Neymar","LeBron James","Michael Jordan","Serena Williams","Roger Federer","Usain Bolt","Virat Kohli","MS Dhoni",
      "Barack Obama","Donald Trump","Joe Biden","Narendra Modi","Mahatma Gandhi","Nelson Mandela","Martin Luther King","Winston Churchill","Cleopatra","Napoleon",
      "Leonardo da Vinci","Picasso","Shakespeare","J.K. Rowling","Stephen King","Albert Camus","Mark Twain","Charles Darwin","Galileo","Hawking",
      "Ariana Grande","Ed Sheeran","Bruno Mars","Justin Bieber","Selena Gomez","Zendaya","Tom Cruise","Leonardo DiCaprio","Will Smith","Dwayne Johnson"
    ],

    Countries: [
      "USA","India","China","Japan","Germany","France","UK","Canada","Australia","Brazil",
      "Russia","Italy","Spain","Mexico","South Korea","Indonesia","Turkey","Saudi Arabia","Argentina","South Africa",
      "Egypt","Nigeria","Kenya","Thailand","Vietnam","Malaysia","Singapore","Philippines","Pakistan","Bangladesh",
      "Netherlands","Belgium","Switzerland","Sweden","Norway","Denmark","Finland","Poland","Ukraine","Greece",
      "Portugal","Ireland","New Zealand","Chile","Colombia","Peru","Iran","Iraq","Israel","UAE"
    ],

    Books: [
      "Harry Potter","Lord of the Rings","Hobbit","1984","Animal Farm","To Kill a Mockingbird","Great Gatsby","Moby Dick","War and Peace","Crime and Punishment",
      "Pride and Prejudice","Jane Eyre","Wuthering Heights","Dracula","Frankenstein","Sherlock Holmes","Da Vinci Code","Angels and Demons","Twilight","Hunger Games",
      "Divergent","Maze Runner","Percy Jackson","Game of Thrones","The Alchemist","The Little Prince","The Kite Runner","Life of Pi","The Book Thief","The Road",
      "The Shining","It","Carrie","The Stand","Green Mile","Eragon","Narnia","Charlotte's Web","Matilda","Charlie and the Chocolate Factory",
      "Diary of a Wimpy Kid","Goosebumps","Anne Frank","The Giver","Bridge to Terabithia","Holes","Hatchet","Wonder","The Outsiders","Catch-22"
    ],

    TVShows: [
      "Friends","Breaking Bad","Game of Thrones","Stranger Things","The Office","Brooklyn Nine Nine","Sherlock","Money Heist","Dark","Narcos",
      "Suits","House of Cards","The Crown","The Witcher","Black Mirror","Peaky Blinders","Lost","Prison Break","Dexter","The Boys",
      "The Mandalorian","Loki","WandaVision","Euphoria","Gossip Girl","Riverdale","How I Met Your Mother","Big Bang Theory","Modern Family","Rick and Morty",
      "South Park","Family Guy","Simpsons","The Walking Dead","Vikings","The Flash","Arrow","Supernatural","Smallville","Lucifer",
      "Grey's Anatomy","House","Scrubs","CSI","NCIS","The Good Doctor","Shameless","Westworld","True Detective","Ozark"
    ]
  },

  Spanish: {
    "Los colores": [
      "rojo","roja","anaranjado","anaranjada","amarillo","amarilla","verde","azul","morado","morada",
      "rosado","rosada","blanco","blanca","negro","negra","gris","marrón"
    ],

    "Los meses del año": [
      "enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre",
      "noviembre","diciembre"
    ],

    "Los días de la semana": [
      "lunes","martes","miércoles","jueves","viernes","sábado","domingo"
    ],

    "Las estaciones": [
      "primavera","verano","otoño","invierno"
    ],

    "El tiempo": [
      "sol","lluvia","nieve","viento","nube","niebla","tormenta","granizo","trueno","relámpago",
      "calor","frío","soleado","soleada","lluvioso","lluviosa","nublado","nublada","nevado","nevada",
      "ventoso","ventosa","húmedo","húmeda","fresco","fresca","caluroso","calurosa"
    ],

    "Las materias escolares": [
      "español","inglés","francés","matemáticas","ciencias","biología","química","física",
      "historia","geografía","educación física","arte","música","informática","literatura","filosofía"
    ],

    "Las partes de la escuela": [
      "aula","biblioteca","gimnasio","cafetería","baño","pasillo","oficina","laboratorio",
      "patio","auditorio","cancha de fútbol","sala de profesores","recepción","estacionamiento","entrada"
    ],

    "Las actividades en la escuela": [
      "estudiar","leer","escribir","escuchar","hablar","preguntar","contestar","aprender",
      "enseñar","hacer la tarea","tomar apuntes","sacar buenas notas","participar",
      "trabajar en grupo","presentar","dibujar","calcular","investigar",
      "usar la computadora","almorzar","llegar"
    ],

    "Las frutas": [
      "manzana","plátano","naranja","fresa","uva","mango","piña","melón","sandía","durazno",
      "pera","limón","lima","papaya","coco","cereza","kiwi","aguacate","guayaba","mandarina"
    ],

    "Las verduras": [
      "zanahoria","brócoli","lechuga","tomate","cebolla","ajo","papa","maíz","pepino","pimiento",
      "espinaca","apio","guisantes","frijoles","calabaza","champiñón","berenjena","chile","rábano","coliflor"
    ],

    "Las proteínas": [
      "pollo","carne de res","cerdo","pescado","camarón","atún","salmón","huevo","jamón","pavo",
      "queso","frijoles","lentejas","garbanzos","tofu","nueces","cacahuates","crema de maní","yogur","leche"
    ],

    "Las bebidas": [
      "agua","agua mineral","jugo","leche","té","café","chocolate caliente","refresco",
      "limonada","batido","té helado"
    ],

    "Los medios de transporte": [
      "coche","autobús","metro","tren","avión","bicicleta","motocicleta","taxi","barco","caminar"
    ],

    "Los lugares de vacaciones": [
      "ciudad","playa","montañas","museo","monumento","parque nacional","campo","lago","río","isla",
      "castillo","ruinas","templo","catedral","mercado","zoológico","parque de atracciones",
      "hotel","aeropuerto","centro histórico"
    ],

    "Las actividades de vacaciones": [
      "viajar","visitar","explorar","caminar","nadar","bucear","esquiar","escalar","acampar","descansar",
      "tomar fotos","conocer","comprar recuerdos","probar la comida","bailar","cantar",
      "montar en bicicleta","pasear","ver un espectáculo","hacer surf","hacer senderismo"
    ],

  },

  French: {
    Movies: [
      "Titanic","Avatar","Inception","Gladiator","La Reine des Neiges","Joker","Matrix","Batman","Spiderman","Superman",
      "Iron Man","Avengers","Interstellar","Le Roi Lion","Harry Potter","Jurassic Park","Shrek","Toy Story","Là-haut","Cars",
      "Le Monde de Nemo","Aladdin","Coco","Moana","Deadpool","Thor","Hulk","Black Panther","Doctor Strange","Dune",
      "Top Gun","Rocky","Rambo","Le Parrain","Scarface","Les Dents de la Mer","E.T.","Terminator","Transformers","Fast and Furious",
      "Mission Impossible","Pirates des Caraïbes","Frozen 2","Vice Versa","Minions","Moi Moche et Méchant","Kung Fu Panda","Madagascar","L’Âge de Glace","Megamind"
      ],

      Food: [
      "pizza","burger","pâtes","sushi","taco","biryani","sandwich","frites","nouilles","salade",
      "steak","poulet","riz","pain","fromage","chocolat","glace","gâteau","donut","crêpe",
      "gaufre","soupe","ravioli","curry","hotdog","kebab","nachos","popcorn","pomme","banane",
      "orange","mangue","fraise","raisin","pastèque","café","thé","lait","jus","smoothie",
      "œuf","poisson","crevette","homard","beurre","confiture","miel","beurre de cacahuète","céréales","avoine"
      ],

      Brands: [
        "Apple","Google","Microsoft","Amazon","Tesla","Nike","Adidas","Coca Cola","Pepsi","McDonalds",
        "Starbucks","Netflix","Disney","Samsung","Sony","Intel","BMW","Mercedes","Toyota","Honda",
        "Uber","Airbnb","Spotify","Snapchat","Instagram","Facebook","Twitter","YouTube","PayPal","Visa",
        "Mastercard","Zara","H&M","Gucci","Louis Vuitton","Rolex","Puma","Dell","HP","Lenovo",
        "LG","Panasonic","Philips","Nvidia","AMD","Red Bull","KFC","Burger King","Subway","Dominos"
      ],

      FamousPeople: [
        "Einstein","Newton","Elon Musk","Bill Gates","Steve Jobs","Taylor Swift","Drake","Rihanna","Beyonce","Kanye West",
        "Messi","Ronaldo","Neymar","LeBron James","Michael Jordan","Serena Williams","Roger Federer","Usain Bolt","Virat Kohli","MS Dhoni",
        "Barack Obama","Donald Trump","Joe Biden","Narendra Modi","Mahatma Gandhi","Nelson Mandela","Martin Luther King","Winston Churchill","Cleopatra","Napoleon",
        "Leonardo da Vinci","Picasso","Shakespeare","J.K. Rowling","Stephen King","Albert Camus","Mark Twain","Charles Darwin","Galileo","Hawking",
        "Ariana Grande","Ed Sheeran","Bruno Mars","Justin Bieber","Selena Gomez","Zendaya","Tom Cruise","Leonardo DiCaprio","Will Smith","Dwayne Johnson"
      ],

      Countries: [
        "États-Unis","Inde","Chine","Japon","Allemagne","France","Royaume-Uni","Canada","Australie","Brésil",
        "Russie","Italie","Espagne","Mexique","Corée du Sud","Indonésie","Turquie","Arabie Saoudite","Argentine","Afrique du Sud",
        "Égypte","Nigeria","Kenya","Thaïlande","Vietnam","Malaisie","Singapour","Philippines","Pakistan","Bangladesh",
        "Pays-Bas","Belgique","Suisse","Suède","Norvège","Danemark","Finlande","Pologne","Ukraine","Grèce",
        "Portugal","Irlande","Nouvelle-Zélande","Chili","Colombie","Pérou","Iran","Irak","Israël","Émirats Arabes Unis"
      ],

      Books: [
        "Harry Potter","Le Seigneur des Anneaux","Le Hobbit","1984","La Ferme des Animaux","Ne tirez pas sur l’oiseau moqueur","Gatsby le Magnifique","Moby Dick","Guerre et Paix","Crime et Châtiment",
        "Orgueil et Préjugés","Jane Eyre","Les Hauts de Hurlevent","Dracula","Frankenstein","Sherlock Holmes","Le Code Da Vinci","Anges et Démons","Twilight","Hunger Games",
        "Divergente","Le Labyrinthe","Percy Jackson","Game of Thrones","L’Alchimiste","Le Petit Prince","Les Cerfs-volants de Kaboul","L’Histoire de Pi","La Voleuse de livres","La Route",
        "Shining","Ça","Carrie","La Tour Sombre","La Ligne Verte","Eragon","Narnia","Charlotte aux fraises","Matilda","Charlie et la Chocolaterie",
        "Journal d’un dégonflé","Chair de Poule","Journal d’Anne Frank","Le Passeur","Un pont vers Terabithia","Holes","Hatchet","Wonder","Les Outsiders","Catch-22"
      ],

      TVShows: [
        "Friends","Breaking Bad","Game of Thrones","Stranger Things","The Office","Brooklyn 99","Sherlock","La Casa de Papel","Dark","Narcos",
        "Suits","House of Cards","The Crown","The Witcher","Black Mirror","Peaky Blinders","Lost","Prison Break","Dexter","The Boys",
        "The Mandalorian","Loki","WandaVision","Euphoria","Gossip Girl","Riverdale","How I Met Your Mother","The Big Bang Theory","Modern Family","Rick et Morty",
        "South Park","Family Guy","Les Simpson","The Walking Dead","Vikings","The Flash","Arrow","Supernatural","Smallville","Lucifer",
        "Grey’s Anatomy","Dr House","Scrubs","CSI","NCIS","The Good Doctor","Shameless","Westworld","True Detective","Ozark"
      ],
  }
};

const spanishHardVocabularyPromise = fetch("./spanish-hard-vocab.txt")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load Spanish hard vocabulary: ${response.status}`);
    }

    return response.text();
  })
  .then((text) => {
    const ignoredHeadings = new Set([
      "El medio ambiente",
      "Las fiestas y celebraciones en los países hispanohablantes",
      "La inmigración",
      "Los deportes",
      "El arte",
      "La música",
      "El cine y las películas",
      "Los libros y la literatura",
      "La tecnología",
      "La salud",
      "La educación",
      "Sustantivos",
      "Verbos",
      "Adjetivos"
    ]);

    return Array.from(
      new Set(
        text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line && !ignoredHeadings.has(line))
      )
    );
  })
  .catch(() => []);

function updateCategories() {
  const language = document.getElementById("language").value;
  const topicSelect = document.getElementById("topicSelect");

  if (topicSelect) {
    topicSelect.innerHTML = "";
    const categories = Object.keys(wordBank[language] || {});

    categories.forEach((cat, index) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      if (index === 0) option.selected = true;
      topicSelect.appendChild(option);
    });

    selectedTopicName = topicSelect.value || categories[0] || "";
  }

  document.getElementById("word").value = "";
  updateWordMode();
}

function getLanguageWords(language) {
  return Object.values(wordBank[language] || {})
    .flat()
    .map((word) => String(word).trim())
    .filter(Boolean);
}

function getDifficultyWords(language, difficulty, overrides = {}) {
  if (language === "Spanish" && difficulty === "hard" && overrides.spanishHardWords?.length) {
    return overrides.spanishHardWords;
  }

  const unique = Array.from(new Set(getLanguageWords(language)));
  const threshold = difficulty === "hard" ? 8 : difficulty === "medium" ? 6 : 4;
  const filtered = unique.filter((word) => (difficulty === "hard" ? word.length >= threshold : word.length <= threshold));
  return filtered.length > 0 ? filtered : unique;
}

function getCustomVocabulary() {
  const textarea = document.getElementById("customVocab");
  if (!textarea) return [];
  return textarea.value
    .split(/[\n,]/g)
    .map((word) => word.trim())
    .filter(Boolean);
}

function parseDeckWords(text) {
  if (!text) return [];

  return Array.from(
    new Set(
      text
        .split(/\r?\n|[•·\-–—•]|[,;|]/g)
        .map((entry) => entry.trim())
        .map((entry) => entry.replace(/^\s*(?:\d+[\).\-\:]?|[a-zA-Z][\).\-\:])\s*/g, ""))
        .map((entry) => entry.replace(/\s+/g, " ").trim())
        .filter((entry) => {
          if (!entry) return false;
          if (entry.length < 2) return false;
          return /[a-zA-ZÀ-ÿ]/.test(entry);
        })
    )
  );
}

function getSelectedSharedDeck() {
  return sharedDecks.find((entry) => entry.id === selectedSharedDeckId) || null;
}

function pickRandomFromList(items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items[Math.floor(Math.random() * items.length)] || "";
}

function updateWordMode() {
  const wordWrap = document.getElementById("wordWrap");
  const topicWrap = document.getElementById("topicWrap");
  const difficultyWrap = document.getElementById("difficultyWrap");
  const customWrap = document.getElementById("customWrap");
  const deckWrap = document.getElementById("deckWrap");

  wordWrap.style.display = "grid";
  topicWrap.style.display = "grid";
  difficultyWrap.style.display = "grid";
  customWrap.style.display = "grid";
  deckWrap.style.display = "grid";
}

function useTopicMode() {
  const modeSelect = document.getElementById("modeSelect");
  if (modeSelect) {
    modeSelect.value = "topic";
  }
  const topicSelect = document.getElementById("topicSelect");
  selectedTopicName = topicSelect?.value || selectedTopicName;
  updateWordMode();
}

function useDeckMode() {
  const modeSelect = document.getElementById("modeSelect");
  if (modeSelect) {
    modeSelect.value = "custom";
  }
  updateWordMode();
}

// =========================
// SCREEN SWITCH
// =========================

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}


// =========================
// RANDOM WORD SYSTEM
// =========================

function loadSharedDecks() {
  fetch("/api/decks", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((payload) => {
      sharedDecks = Array.isArray(payload?.decks) ? payload.decks : [];
      const queryDeckId = new URLSearchParams(window.location.search).get("deckId");
      const storedDeckId = window.localStorage.getItem(sharedDeckStorageKey);
      if (queryDeckId) {
        selectedSharedDeckId = queryDeckId;
      } else if (storedDeckId) {
        selectedSharedDeckId = storedDeckId;
      }
      renderSharedDeckOptions();
      if (selectedSharedDeckId) {
        selectSharedDeck(selectedSharedDeckId);
      }
      updateWordMode();
    })
    .catch(() => {
      sharedDecks = [];
      renderSharedDeckOptions();
      updateWordMode();
    });
}

function renderSharedDeckOptions() {
  const deckSelect = document.getElementById("sharedDeckSelect");
  if (!deckSelect) return;

  deckSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = sharedDecks.length ? "Choose a shared deck" : "No shared decks yet";
  deckSelect.appendChild(placeholder);

  sharedDecks.forEach((deck) => {
    const option = document.createElement("option");
    option.value = deck.id;
    option.textContent = deck.title || deck.fileName || "Shared deck";
    deckSelect.appendChild(option);
  });

  deckSelect.value = selectedSharedDeckId || "";
}

function selectSharedDeck(deckId) {
  selectedSharedDeckId = deckId;
  if (selectedSharedDeckId) {
    window.localStorage.setItem(sharedDeckStorageKey, selectedSharedDeckId);
  } else {
    window.localStorage.removeItem(sharedDeckStorageKey);
  }

  const deck = getSelectedSharedDeck();
  const status = document.getElementById("sharedDeckStatus");

  if (!deck || !deck.text) {
    if (status) {
      status.textContent = "Pick a deck already uploaded in the hub sidebar.";
    }
    return;
  }

  if (status) {
    const parsedWords = parseDeckWords(deck.text);
    status.textContent = `${deck.title || deck.fileName || "Shared deck"} selected (${parsedWords.length} items ready).`;
  }
  const modeSelect = document.getElementById("modeSelect");
  if (modeSelect) {
    modeSelect.value = "custom";
  }
  updateWordMode();
}

// =========================
// SETUP FLOW
// =========================

async function goToPlayers() {
  const mode = document.getElementById("modeSelect").value;
  const language = document.getElementById("language").value;
  const difficulty = document.getElementById("difficultySelect").value;
  const sharedDeck = getSelectedSharedDeck();
  const deckWords = sharedDeck?.text ? parseDeckWords(sharedDeck.text) : [];
  const typedWord = document.getElementById("word").value.trim();

  if (typedWord) {
    word = typedWord;
  } else if (mode === "topic") {
    const topicSelect = document.getElementById("topicSelect");
    const currentTopic = topicSelect?.value || selectedTopicName || "";
    const words = (wordBank[language] && wordBank[language][currentTopic]) || [];
    word = pickRandomFromList(words);
  } else if (mode === "difficulty") {
    const spanishHardWords = language === "Spanish" && difficulty === "hard"
      ? await spanishHardVocabularyPromise
      : [];
    const words = getDifficultyWords(language, difficulty, { spanishHardWords });
    word = words[Math.floor(Math.random() * words.length)] || "";
  } else if (mode === "custom") {
    const customWordsText = getCustomVocabulary();
    const activeDeckWords = deckWords.length ? deckWords : [];
    const chosenDeckWords = activeDeckWords.length ? activeDeckWords : customWordsText;
    word = pickRandomFromList(chosenDeckWords);
  }

  imposters = parseInt(document.getElementById("imposters").value);

  // 🔥 STRICT CHECK
  if (!word || word.length === 0) {
    alert("Enter a word, select a topic, or choose a deck");
    return;
  }

  show("playersScreen");
}

// =========================
// PLAYER SETUP (UPDATED)
// =========================

function addPlayer() {
  const input = document.getElementById("playerName");
  const name = input.value.trim();

  if (!name) return;

  players.push(name); // ✅ ONLY push clean name

  input.value = "";

  renderPlayers();
}

// 🆕 REMOVE PLAYER
function removePlayer(index) {
  players.splice(index, 1);
  renderPlayers();
}

function renderPlayers() {
  let html = "";

  players.forEach((p, i) => {
    html += `
      <div class="playerTag">
        ${p}
        <button type="button" class="removePlayerBtn" onclick="removePlayer(${i})" aria-label="Remove ${p}">X</button>
      </div>
    `;
  });

  document.getElementById("playersList").innerHTML = html;
}


// =========================
// GAME START (UPDATED)
// =========================

function startGame() {
  if (players.length < 3) {
    alert("Need at least 3 players");
    return;
  }

  // 🆕 ROUND CALCULATION
  totalRounds = players.length - 3;
  round = 1;

  setupRound();
}

// 🆕 SETUP EACH ROUND
function setupRound() {

  assignments = [...players].map(() => word);

  let shuffled = [...players]
    .map((p, i) => ({ p, i }))
    .sort(() => 0.5 - Math.random());

  for (let i = 0; i < imposters; i++) {
    assignments[shuffled[i].i] = "IMPOSTER";
  }

  currentIndex = 0;

  show("passScreen");
  updatePlayer();
}


// =========================
// PASS PHONE
// =========================

function updatePlayer() {
  document.getElementById("currentPlayer").innerText =
    players[currentIndex] + ` (Round ${round}/${totalRounds})`;

  document.getElementById("wordDisplay").innerText = "";
}

function revealWord() {
  document.getElementById("wordDisplay").innerText =
    assignments[currentIndex];
}

function hideWord() {
  document.getElementById("wordDisplay").innerText = "";
}

function nextPlayer() {
  currentIndex++;

  if (currentIndex >= players.length) {
    pickStarter();
    return;
  }

  updatePlayer();
}


// =========================
// START ROUND
// =========================

function pickStarter() {
  starterIndex = Math.floor(Math.random() * players.length);

  document.getElementById("starter").innerText =
    players[starterIndex] + " starts!";

  show("startScreen");
}


// =========================
// VOTING SYSTEM (UNCHANGED)
// =========================

function goToVoting() {
  votes = {};
  voteCounts = {};
  votingTurnIndex = 0;

  players.forEach(p => voteCounts[p] = 0);

  renderVoting();
  show("voteScreen");
}

function renderVoting() {
  let currentVoter = players[votingTurnIndex];

  document.getElementById("votingPlayer").innerText =
    currentVoter + " vote";

  let html = "";

  players.forEach(p => {
    let dots = "⚪".repeat(voteCounts[p]);

    html += `
      <div class="voteBox" onclick="castVote('${p}')">
        ${p}
        <div>${dots}</div>
      </div>
    `;
  });

  document.getElementById("voteGrid").innerHTML = html;
}

function castVote(target) {
  let voter = players[votingTurnIndex];

  votes[voter] = target;
  voteCounts[target]++;

  votingTurnIndex++;

  if (votingTurnIndex >= players.length) {
    finishVoting();
    return;
  }

  renderVoting();
}


// =========================
// RESULTS (UNCHANGED LOGIC)
// =========================

function finishVoting() {
  let max = Math.max(...Object.values(voteCounts));
  let top = Object.keys(voteCounts).filter(p => voteCounts[p] === max);

  // TIE
  if (top.length > 1) {
    document.getElementById("resultText").innerHTML = `
      <div class="resultBox">
        <h1>TIE</h1>
        <p>No one was eliminated</p>
      </div>
    `;

    document.getElementById("continueBtn").style.display = "block";
    show("resultScreen");
    return;
  }

  let eliminated = top[0];
  let index = players.indexOf(eliminated);
  let isImposter = assignments[index] === "IMPOSTER";

  players.splice(index, 1);
  assignments.splice(index, 1);

  let impostersLeft = assignments.filter(a => a === "IMPOSTER").length;
  let normalPlayersLeft = assignments.length - impostersLeft;

  if (isImposter) {

    if (impostersLeft === 0) {
      document.getElementById("resultText").innerHTML = `
        <div class="resultBox">
          <h1>${eliminated} was the IMPOSTER</h1>
          <h2>ALL IMPOSTERS ELIMINATED</h2>
          <p>YOU WIN</p>
        </div>
      `;

      document.getElementById("continueBtn").style.display = "none";
      show("resultScreen");
      return;
    }

    document.getElementById("resultText").innerHTML = `
      <div class="resultBox">
        <h1>${eliminated} was an IMPOSTER</h1>
        <h2>BUT WAIT</h2>
        <p>There is still an imposter among you</p>
      </div>
    `;

    document.getElementById("continueBtn").style.display = "block";
    show("resultScreen");
    return;
  }

  if (impostersLeft >= normalPlayersLeft) {

    let imposterNames = players.filter((p, i) => assignments[i] === "IMPOSTER");

    document.getElementById("resultText").innerHTML = `
      <div class="resultBox">
        <h2>There are more imposters than players</h2>
        <h1>IMPOSTERS WIN</h1>
        <p>Imposters were: ${imposterNames.join(", ")}</p>
      </div>
    `;

    document.getElementById("continueBtn").style.display = "none";
    show("resultScreen");
    return;
  }

  document.getElementById("resultText").innerHTML = `
    <div class="resultBox">
      <h1>${eliminated} was NOT the imposter</h1>
    </div>
  `;

  document.getElementById("continueBtn").style.display = "block";
  show("resultScreen");
}

// =========================
// CONTINUE
// =========================

function continueRound() {
  starterIndex = (starterIndex + 1) % players.length;

  document.getElementById("starter").innerText =
    players[starterIndex] + " starts!";

  show("startScreen");
}

// =========================
// 🆕 RESTART SAME PLAYERS
// =========================

function restartSamePlayers() {
  show("playersScreen");
}


// =========================
// EXIT
// =========================

function restartGame() {
  // reset round/game state ONLY
  round = 1;
  assignments = [];
  currentIndex = 0;
  votes = {};
  voteCounts = {};
  votingTurnIndex = 0;

  // KEEP players array intact
  if (selectedSharedDeckId) {
    window.localStorage.setItem(sharedDeckStorageKey, selectedSharedDeckId);
  }
  updateWordMode();
  show("playersScreen");
}

updateCategories();
updateWordMode();
loadSharedDecks();
