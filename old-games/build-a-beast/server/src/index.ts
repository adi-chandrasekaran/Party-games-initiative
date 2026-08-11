import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { z } from "zod";

type RoomPhase = "lobby" | "building" | "simulating" | "podium";
type PlayerStatus = "lobby" | "building" | "submitted" | "finished";
type Stats = Record<string, number>;

type BeastPart = { id: string; name: string; category: string; description: string; cost: number; stats: Stats };
type ArenaEvent = { id: string; title: string; description: string; statWeights: Stats; danger: number };
type Challenge = { id: string; title: string; mode: "education" | "fun"; subject: string; description: string; minParts: number; maxParts: number; parts: BeastPart[]; events: ArenaEvent[] };
type Player = { id: string; socketId: string; name: string; score: number; status: PlayerStatus; submittedAt?: number };
type BeastBuild = { playerId: string; playerName: string; beastName: string; selectedPartIds: string[]; submittedAt: number };
type TimelineResult = { playerId: string; playerName: string; beastName: string; delta: number; scoreAfter: number; reasons: string[] };
type SimulationStep = { eventId: string; title: string; description: string; results: TimelineResult[] };
type FinalResult = { playerId: string; name: string; beastName: string; score: number; rank: number; partCount: number; summary: string };
type SimulationOutput = { timeline: SimulationStep[]; leaderboard: FinalResult[] };
type Room = { id: string; hostSocketId: string; challenge: Challenge; players: Record<string, Player>; builds: Record<string, BeastBuild>; phase: RoomPhase; createdAt: number; simulation?: SimulationOutput };


const biologyParts: BeastPart[] = [
  { id: "large-ears", name: "Large Heat-Sink Ears", category: "Body", description: "Releases heat quickly. Amazing in hot climates, awkward in freezing ones.", cost: 2, stats: { heat: 4, cold: -2, stealth: -1 } },
  { id: "fat-hump", name: "Fat Storage Hump", category: "Energy", description: "Stores energy and water for long droughts.", cost: 3, stats: { heat: 2, hunger: 4, endurance: 3, speed: -1 } },
  { id: "camouflage", name: "Adaptive Camouflage", category: "Defense", description: "Blends into the environment and helps dodge predators.", cost: 3, stats: { stealth: 5, predator: 4, display: -1 } },
  { id: "night-vision", name: "Night Vision", category: "Senses", description: "Lets your beast hunt or escape when light is low.", cost: 2, stats: { senses: 4, predator: 2, stealth: 1 } },
  { id: "long-legs", name: "Long Spring Legs", category: "Movement", description: "Fast movement across open ground, but harder to hide.", cost: 2, stats: { speed: 5, endurance: 2, stealth: -2, storm: -1 } },
  { id: "burrowing-claws", name: "Burrowing Claws", category: "Movement", description: "Useful for digging shelter, hiding, and surviving storms.", cost: 3, stats: { storm: 5, defense: 2, stealth: 2, speed: -1 } },
  { id: "thick-fur", name: "Thick Fur", category: "Body", description: "Keeps warmth in. Great in cold, dangerous in hot climates.", cost: 2, stats: { cold: 5, heat: -4, defense: 1 } },
  { id: "venom-spines", name: "Venom Spines", category: "Defense", description: "Punishes predators that get too close.", cost: 4, stats: { predator: 5, defense: 4, social: -2 } },
  { id: "bright-feathers", name: "Bright Feathers", category: "Display", description: "Excellent for attracting mates, terrible for staying hidden.", cost: 2, stats: { display: 5, social: 2, stealth: -5, predator: -3 } },
  { id: "wide-feet", name: "Wide Sand Feet", category: "Movement", description: "Good for walking on sand, snow, mud, or unstable ground.", cost: 2, stats: { storm: 3, speed: 2, endurance: 1 } },
  { id: "armored-shell", name: "Armored Shell", category: "Defense", description: "Strong defense, but heavy and slow.", cost: 4, stats: { defense: 6, predator: 3, speed: -3, hunger: -1 } },
  { id: "keen-nose", name: "Keen Nose", category: "Senses", description: "Finds food, water, and danger earlier than others.", cost: 2, stats: { senses: 4, hunger: 3, predator: 1 } },
  { id: "webbed-feet", name: "Webbed Feet", category: "Movement", description: "Helpful in water and swamps, but clumsy on dry rocks.", cost: 2, stats: { flood: 5, speed: -1, storm: 1 } },
  { id: "pack-instinct", name: "Pack Instinct", category: "Social", description: "Works with others, protects young, and survives social stress.", cost: 3, stats: { social: 5, predator: 2, hunger: 1 } }
];

const physicsParts: BeastPart[] = [
  { id: "triangular-truss", name: "Triangular Truss", category: "Structure", description: "Distributes force through stable triangles.", cost: 3, stats: { strength: 5, stability: 5, weight: -1, costEfficiency: 1 } },
  { id: "steel-cables", name: "Steel Cables", category: "Tension", description: "Excellent tensile strength for suspension designs.", cost: 4, stats: { tension: 6, wind: 3, flexibility: 3, costEfficiency: -2 } },
  { id: "wooden-beams", name: "Wooden Beams", category: "Material", description: "Cheap and light, but not ideal for extreme loads.", cost: 1, stats: { costEfficiency: 5, weight: 3, strength: 1, fire: -3 } },
  { id: "concrete-pillars", name: "Concrete Pillars", category: "Compression", description: "Strong in compression and good for heavy decks.", cost: 3, stats: { compression: 6, stability: 4, weight: -4, flood: 2 } },
  { id: "arch-support", name: "Arch Support", category: "Shape", description: "Redirects load into supports instead of the center span.", cost: 3, stats: { load: 5, compression: 5, stability: 2 } },
  { id: "flexible-joints", name: "Flexible Joints", category: "Movement", description: "Absorbs earthquakes and vibration.", cost: 3, stats: { flexibility: 6, earthquake: 5, stability: 1, load: -1 } },
  { id: "wide-foundation", name: "Wide Foundation", category: "Base", description: "Spreads load and resists collapse.", cost: 3, stats: { stability: 6, flood: 2, weight: -2 } },
  { id: "heavy-deck", name: "Heavy Deck", category: "Deck", description: "Looks solid but punishes the structure with extra load.", cost: 2, stats: { load: -5, weight: -6, stability: -2 } },
  { id: "wind-fairing", name: "Wind Fairing", category: "Aerodynamics", description: "Reduces drag and swaying in storms.", cost: 2, stats: { wind: 6, flexibility: 1, costEfficiency: -1 } },
  { id: "rust-proof-coating", name: "Rust-Proof Coating", category: "Maintenance", description: "Protects the bridge from long-term corrosion.", cost: 2, stats: { maintenance: 6, flood: 3, costEfficiency: -1 } },
  { id: "weak-glue", name: "Weak Glue", category: "Mistake", description: "Cheap shortcut. It may fail under real stress.", cost: 0, stats: { costEfficiency: 4, strength: -6, stability: -4, maintenance: -3 } },
  { id: "load-sensors", name: "Load Sensors", category: "Monitoring", description: "Warns when the bridge is under dangerous stress.", cost: 2, stats: { monitoring: 6, maintenance: 3, costEfficiency: -1 } }
];

const csParts: BeastPart[] = [
  { id: "firewall", name: "Firewall", category: "Perimeter", description: "Blocks obvious unwanted traffic.", cost: 2, stats: { exposure: 4, ddos: 2, monitoring: 1 } },
  { id: "mfa", name: "Multi-Factor Authentication", category: "Identity", description: "Protects accounts even when passwords leak.", cost: 3, stats: { authentication: 6, phishing: 5, accessControl: 2 } },
  { id: "encryption", name: "End-to-End Encryption", category: "Data", description: "Protects sensitive data in transit and at rest.", cost: 3, stats: { encryption: 6, dataLeak: 5, performance: -1 } },
  { id: "public-db", name: "Public Database", category: "Mistake", description: "Fast to set up. Terrible idea for private data.", cost: 0, stats: { performance: 3, exposure: -8, dataLeak: -8, accessControl: -5 } },
  { id: "logging-siem", name: "Logging + SIEM", category: "Monitoring", description: "Detects suspicious behavior and helps incident response.", cost: 3, stats: { monitoring: 7, ransomware: 2, insider: 3, performance: -1 } },
  { id: "zero-trust", name: "Zero Trust Gateway", category: "Access", description: "Verifies users and devices before granting access.", cost: 4, stats: { accessControl: 6, authentication: 3, insider: 4, performance: -2 } },
  { id: "backup-server", name: "Offline Backup Server", category: "Recovery", description: "Makes ransomware less catastrophic.", cost: 3, stats: { resilience: 7, ransomware: 6, costEfficiency: -2 } },
  { id: "rate-limiter", name: "Rate Limiter", category: "Traffic", description: "Slows brute-force and DDoS-style abuse.", cost: 2, stats: { ddos: 6, exposure: 2, performance: 1 } },
  { id: "secrets-manager", name: "Secrets Manager", category: "Secrets", description: "Keeps API keys and credentials out of code.", cost: 2, stats: { patching: 2, dataLeak: 4, accessControl: 3 } },
  { id: "unpatched-dependency", name: "Unpatched Dependency", category: "Mistake", description: "A popular library with a known vulnerability.", cost: 0, stats: { patching: -8, exposure: -5, ransomware: -3 } },
  { id: "least-privilege", name: "Least-Privilege IAM", category: "Access", description: "Limits blast radius when something goes wrong.", cost: 2, stats: { accessControl: 6, insider: 5, dataLeak: 2 } },
  { id: "weak-passwords", name: "Weak Password Policy", category: "Mistake", description: "Users can still choose terrible passwords.", cost: 0, stats: { authentication: -7, phishing: -5, exposure: -2 } }
];

const historyParts: BeastPart[] = [
  { id: "river-access", name: "River Access", category: "Geography", description: "Water supports farming, trade, and settlement growth.", cost: 3, stats: { food: 5, trade: 3, stability: 2, flood: -2 } },
  { id: "irrigation", name: "Irrigation System", category: "Agriculture", description: "Turns unreliable rainfall into stable harvests.", cost: 3, stats: { food: 7, stability: 3, innovation: 1 } },
  { id: "trade-routes", name: "Trade Routes", category: "Economy", description: "Brings goods, ideas, and wealth.", cost: 3, stats: { trade: 7, culture: 2, exposure: -2 } },
  { id: "written-laws", name: "Written Laws", category: "Governance", description: "Creates predictable rules and reduces conflict.", cost: 2, stats: { governance: 6, stability: 4, unrest: 2 } },
  { id: "strong-army", name: "Strong Army", category: "Military", description: "Protects borders, but can drain resources.", cost: 4, stats: { military: 7, stability: 1, food: -2, unrest: -1 } },
  { id: "harsh-taxes", name: "Harsh Taxes", category: "Mistake", description: "Raises money quickly but angers people.", cost: 0, stats: { governance: 2, unrest: -7, trade: -3, stability: -4 } },
  { id: "education", name: "Education System", category: "Knowledge", description: "Improves administration, innovation, and culture.", cost: 3, stats: { innovation: 6, governance: 3, culture: 3 } },
  { id: "diplomacy", name: "Diplomacy Network", category: "Foreign Policy", description: "Reduces invasion risk and strengthens alliances.", cost: 2, stats: { military: 2, trade: 3, stability: 3 } },
  { id: "monument-spending", name: "Huge Monument Spending", category: "Culture", description: "Builds prestige, but can starve the economy.", cost: 4, stats: { culture: 6, unrest: -3, food: -3, trade: -1 } },
  { id: "bureaucracy", name: "Central Bureaucracy", category: "Governance", description: "Helps collect taxes, organize projects, and manage crises.", cost: 3, stats: { governance: 7, stability: 2, unrest: 1 } },
  { id: "religious-unity", name: "Religious/Cultural Unity", category: "Culture", description: "Creates shared identity, but can resist new ideas.", cost: 2, stats: { culture: 5, stability: 3, innovation: -1 } },
  { id: "weak-farming", name: "Weak Farming Base", category: "Mistake", description: "A civilization cannot survive if it cannot feed itself.", cost: 0, stats: { food: -8, stability: -4, unrest: -3 } }
];

const chemistryParts: BeastPart[] = [
  { id: "carbon-backbone", name: "Carbon Backbone", category: "Skeleton", description: "A stable base for organic molecules.", cost: 2, stats: { stability: 5, shape: 3, biologicalUse: 2 } },
  { id: "hydroxyl", name: "Hydroxyl Group (-OH)", category: "Functional Group", description: "Increases polarity and hydrogen bonding.", cost: 2, stats: { polarity: 5, solubility: 5, hydrogenBonding: 4, membrane: -2 } },
  { id: "carboxyl", name: "Carboxyl Group (-COOH)", category: "Functional Group", description: "Acidic and reactive; common in biomolecules.", cost: 3, stats: { acidity: 6, polarity: 4, reactivity: 3, solubility: 3 } },
  { id: "amino", name: "Amino Group (-NH2)", category: "Functional Group", description: "Basic group important in amino acids.", cost: 3, stats: { basicity: 6, biologicalUse: 5, polarity: 3, reactivity: 2 } },
  { id: "phosphate", name: "Phosphate Group", category: "Functional Group", description: "High-energy and very polar; common in ATP/DNA.", cost: 4, stats: { energy: 7, polarity: 6, biologicalUse: 5, membrane: -4 } },
  { id: "double-bond", name: "Double Bond", category: "Bond", description: "Adds rigidity and changes shape/reactivity.", cost: 2, stats: { shape: 4, reactivity: 3, stability: -1 } },
  { id: "ionic-bond", name: "Ionic Bond", category: "Bond", description: "Strong in crystals, vulnerable in water.", cost: 2, stats: { stability: 3, solubility: 4, polarity: 5, heat: -1 } },
  { id: "hydrogen-bonding", name: "Hydrogen Bonding Sites", category: "Interaction", description: "Improves water interactions and enzyme recognition.", cost: 2, stats: { hydrogenBonding: 7, solubility: 4, enzymeFit: 3 } },
  { id: "nonpolar-chain", name: "Nonpolar Chain", category: "Tail", description: "Hydrophobic chain that can cross membranes.", cost: 2, stats: { membrane: 6, solubility: -5, polarity: -4, stability: 2 } },
  { id: "benzene-ring", name: "Benzene Ring", category: "Ring", description: "Stable aromatic ring; bulky and nonpolar.", cost: 3, stats: { stability: 6, shape: 4, membrane: 2, solubility: -3 } },
  { id: "weak-bond", name: "Weak Unstable Bond", category: "Mistake", description: "Falls apart under heat or pH stress.", cost: 0, stats: { stability: -8, heat: -6, reactivity: 3 } },
  { id: "bulky-group", name: "Bulky Side Group", category: "Shape", description: "Can help or hurt enzyme fit depending on the test.", cost: 2, stats: { shape: 5, enzymeFit: -2, stability: 1 } }
];

const challengePresets: Challenge[] = [
  {
    id: "desert-survival", title: "Biology: Desert Survival Beast", mode: "education", subject: "Biology / Adaptation",
    description: "Build a creature that can survive heat, drought, predators, sandstorms, and mating season.", minParts: 5, maxParts: 7, parts: biologyParts,
    events: [
      { id: "heat", title: "Extreme Heat", description: "The arena temperature spikes. Cooling adaptations thrive.", statWeights: { heat: 15, endurance: 5, cold: -7 }, danger: 6 },
      { id: "predator", title: "Predator Attack", description: "A fast desert predator hunts the weakest-looking beasts.", statWeights: { predator: 11, stealth: 9, speed: 7, defense: 5, display: -8 }, danger: 7 },
      { id: "drought", title: "Food and Water Shortage", description: "Only beasts with energy storage and strong senses can find resources.", statWeights: { hunger: 14, senses: 8, endurance: 7 }, danger: 8 },
      { id: "sandstorm", title: "Sandstorm", description: "Visibility drops. Shelter, claws, and stable feet matter.", statWeights: { storm: 14, defense: 5, senses: 3, speed: -2 }, danger: 7 },
      { id: "mating", title: "Mating Season", description: "A species cannot survive unless it can reproduce and cooperate.", statWeights: { social: 9, display: 8, stealth: 2 }, danger: 4 }
    ]
  },
  {
    id: "arctic-adaptation", title: "Biology: Arctic Adaptation Beast", mode: "education", subject: "Biology / Ecosystems",
    description: "Build a creature for freezing temperatures, scarce food, snowstorms, and predator pressure.", minParts: 5, maxParts: 7, parts: biologyParts,
    events: [
      { id: "freeze", title: "Deep Freeze", description: "The temperature collapses. Warmth and endurance are essential.", statWeights: { cold: 16, endurance: 6, heat: -6 }, danger: 8 },
      { id: "snow-hunt", title: "Whiteout Hunt", description: "Food is buried under snow. Senses and stable movement matter.", statWeights: { senses: 11, hunger: 9, storm: 6 }, danger: 7 },
      { id: "ice-predator", title: "Ice Predator", description: "A silent predator stalks the tundra.", statWeights: { stealth: 9, predator: 9, defense: 7, speed: 4, display: -7 }, danger: 7 },
      { id: "blizzard", title: "Blizzard", description: "Wind and snow punish exposed animals.", statWeights: { cold: 8, storm: 13, defense: 4 }, danger: 8 },
      { id: "pack-winter", title: "Long Winter", description: "Only social and energy-efficient beasts can keep going.", statWeights: { social: 10, hunger: 9, endurance: 7 }, danger: 7 }
    ]
  },
  {
    id: "physics-bridge", title: "Physics: Bridge Builder", mode: "education", subject: "Physics / Forces",
    description: "Build a bridge that survives load, wind, earthquakes, flooding, and maintenance checks.", minParts: 5, maxParts: 7, parts: physicsParts,
    events: [
      { id: "heavy-load", title: "Heavy Load Test", description: "Trucks cross the bridge. Load distribution and strength matter.", statWeights: { load: 14, strength: 12, compression: 8, weight: -5 }, danger: 7 },
      { id: "windstorm", title: "Windstorm", description: "High wind causes swaying and drag.", statWeights: { wind: 14, flexibility: 7, stability: 5 }, danger: 6 },
      { id: "earthquake", title: "Earthquake Shake", description: "The ground moves. Rigid bridges crack; flexible systems absorb motion.", statWeights: { earthquake: 15, flexibility: 10, stability: 5 }, danger: 8 },
      { id: "flood", title: "Flood Under the Bridge", description: "Water attacks foundations and materials.", statWeights: { flood: 12, stability: 7, maintenance: 4 }, danger: 6 },
      { id: "budget", title: "Budget Inspection", description: "The design must be strong without wasting materials.", statWeights: { costEfficiency: 12, monitoring: 4, weight: 3 }, danger: 4 },
      { id: "fatigue", title: "Long-Term Fatigue", description: "The bridge ages under repeated stress.", statWeights: { maintenance: 14, monitoring: 9, strength: 5 }, danger: 7 }
    ]
  },
  {
    id: "cs-network", title: "Computer Science: Secure Network", mode: "education", subject: "Computer Science / Cybersecurity",
    description: "Build a secure system that survives phishing, data leaks, DDoS, dependency exploits, ransomware, and insider mistakes.", minParts: 5, maxParts: 7, parts: csParts,
    events: [
      { id: "phishing", title: "Phishing Campaign", description: "Attackers trick users into giving up credentials.", statWeights: { phishing: 15, authentication: 10, monitoring: 4 }, danger: 7 },
      { id: "data-leak", title: "Private Data Leak", description: "A misconfiguration exposes sensitive data.", statWeights: { dataLeak: 15, encryption: 10, accessControl: 8, exposure: 7 }, danger: 8 },
      { id: "ddos", title: "DDoS Attack", description: "Traffic floods the system.", statWeights: { ddos: 15, performance: 6, resilience: 5 }, danger: 6 },
      { id: "dependency-exploit", title: "Dependency Exploit", description: "A vulnerable package is used against you.", statWeights: { patching: 16, monitoring: 7, exposure: 5 }, danger: 8 },
      { id: "ransomware", title: "Ransomware Outbreak", description: "Systems are encrypted and held hostage.", statWeights: { ransomware: 15, resilience: 12, monitoring: 5 }, danger: 9 },
      { id: "insider", title: "Insider Mistake", description: "A trusted user does something dangerous by accident.", statWeights: { insider: 14, accessControl: 10, monitoring: 6 }, danger: 7 }
    ]
  },
  {
    id: "history-civilization", title: "History: Civilization Builder", mode: "education", subject: "History / Systems",
    description: "Build a civilization that can survive drought, invasion, trade shocks, rebellion, golden ages, and succession crises.", minParts: 5, maxParts: 7, parts: historyParts,
    events: [
      { id: "drought", title: "Drought", description: "Food systems are tested by years of weak rainfall.", statWeights: { food: 16, stability: 7, governance: 5 }, danger: 8 },
      { id: "invasion", title: "Invasion", description: "A rival power attacks your borders.", statWeights: { military: 15, diplomacy: 6, stability: 5, food: 3 }, danger: 8 },
      { id: "trade-boom", title: "Trade Boom", description: "Wealth flows through the region.", statWeights: { trade: 15, governance: 6, culture: 5 }, danger: 3 },
      { id: "rebellion", title: "Rebellion", description: "People resist unfair systems.", statWeights: { unrest: 14, stability: 10, governance: 8, culture: 3 }, danger: 8 },
      { id: "golden-age", title: "Golden Age", description: "Knowledge, art, and prosperity can compound.", statWeights: { innovation: 14, culture: 10, trade: 6 }, danger: 4 },
      { id: "succession", title: "Succession Crisis", description: "Leadership changes. Institutions are tested.", statWeights: { governance: 15, stability: 12, military: 3 }, danger: 7 }
    ]
  },
  {
    id: "chemistry-molecule", title: "Chemistry: Arrange the Molecule", mode: "education", subject: "Chemistry / Molecules",
    description: "Assemble a molecule from atoms, bonds, and functional groups. It will be tested for solubility, stability, reactivity, enzyme fit, and membrane crossing.", minParts: 5, maxParts: 7, parts: chemistryParts,
    events: [
      { id: "water", title: "Dissolve in Water", description: "Polar groups and hydrogen bonding help; nonpolar chains hurt.", statWeights: { solubility: 15, polarity: 12, hydrogenBonding: 7, membrane: -3 }, danger: 5 },
      { id: "ph", title: "pH Stress", description: "Acids, bases, and unstable bonds react to changing pH.", statWeights: { acidity: 7, basicity: 7, stability: 10, reactivity: -3 }, danger: 7 },
      { id: "heat", title: "Heat Test", description: "The molecule is heated. Weak bonds and unstable shapes fail.", statWeights: { heat: 12, stability: 14, shape: 3 }, danger: 8 },
      { id: "reaction", title: "Reaction Test", description: "The molecule must react enough to be useful, but not explode into chaos.", statWeights: { reactivity: 10, stability: 8, energy: 6 }, danger: 6 },
      { id: "enzyme", title: "Enzyme Fit", description: "Shape and bonding decide whether the molecule fits the active site.", statWeights: { enzymeFit: 15, shape: 11, hydrogenBonding: 6, biologicalUse: 4 }, danger: 6 },
      { id: "membrane", title: "Membrane Crossing", description: "Can the molecule cross a lipid membrane?", statWeights: { membrane: 15, polarity: -6, solubility: -4, shape: 3 }, danger: 6 }
    ]
  },
  {
    id: "chaos-monster", title: "Fun: Chaos Monster Arena", mode: "fun", subject: "Party Mode / Creativity",
    description: "Build the most ridiculous monster possible and see if it survives a cursed arena.", minParts: 5, maxParts: 7, parts: biologyParts,
    events: [
      { id: "zombie", title: "Zombie Swarm", description: "A swarm attacks anything that looks tasty, slow, or dramatic.", statWeights: { speed: 9, defense: 8, predator: 8, display: -5 }, danger: 7 },
      { id: "meme", title: "Meme Trial", description: "The crowd rewards ridiculous beauty and social chaos.", statWeights: { display: 12, social: 7, stealth: -3 }, danger: 3 },
      { id: "meteor", title: "Meteor Dust Storm", description: "The sky falls apart. Shelter and toughness matter.", statWeights: { storm: 12, defense: 9, senses: 4 }, danger: 9 },
      { id: "snack-famine", title: "Snack Famine", description: "The cafeteria runs out of snacks. Only the resourceful survive.", statWeights: { hunger: 13, senses: 7, social: 4 }, danger: 6 },
      { id: "final-boss", title: "Final Boss Flex", description: "One huge monster challenges every beast.", statWeights: { defense: 8, predator: 9, speed: 5, social: 3 }, danger: 9 }
    ]
  }
];

const rooms: Record<string, Room> = {};

function getPreset(id: string) { return challengePresets.find((c) => c.id === id) ?? challengePresets[0]; }
function makeRoomCode() { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = ""; for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]; return code; }
function makeId(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }
function publicRoom(room: Room) { return { id: room.id, phase: room.phase, playerCount: Object.keys(room.players).length, challengeTitle: room.challenge.title, submittedCount: Object.keys(room.builds).length }; }

function leaderboard(room: Room) {
  if (room.simulation?.leaderboard) return room.simulation.leaderboard;
  return Object.values(room.players).sort((a, b) => {
    if (a.status === "submitted" && b.status !== "submitted") return -1;
    if (a.status !== "submitted" && b.status === "submitted") return 1;
    return a.name.localeCompare(b.name);
  }).map((player, index) => ({
    playerId: player.id, name: player.name, beastName: room.builds[player.id]?.beastName ?? "Not submitted", score: player.score, rank: index + 1,
    partCount: room.builds[player.id]?.selectedPartIds.length ?? 0, summary: player.status
  }));
}

function hostDashboard(room: Room) {
  return {
    room: publicRoom(room), challenge: room.challenge, leaderboard: leaderboard(room),
    players: Object.values(room.players).map((p) => ({
      id: p.id, name: p.name, status: p.status, score: p.score, submitted: Boolean(room.builds[p.id]),
      beastName: room.builds[p.id]?.beastName ?? "", selectedPartCount: room.builds[p.id]?.selectedPartIds.length ?? 0, submittedAt: p.submittedAt
    }))
  };
}

function emitState(room: Room) {
  io.to(room.id).emit("room-updated", publicRoom(room));
  io.to(room.id).emit("leaderboard", leaderboard(room));
  io.to(room.id).emit("host-dashboard", hostDashboard(room));
}

function partContribution(part: BeastPart, event: ArenaEvent) {
  return Object.entries(event.statWeights).reduce((total, [stat, weight]) => total + (part.stats[stat] ?? 0) * weight, 0);
}

function simulateRoom(room: Room): SimulationOutput {
  room.phase = "simulating";
  const builds = Object.values(room.builds);
  const scores: Record<string, number> = {};
  const timeline: SimulationStep[] = [];
  for (const build of builds) scores[build.playerId] = 50;

  for (const event of room.challenge.events) {
    const stepResults: TimelineResult[] = [];
    for (const build of builds) {
      const selectedParts = build.selectedPartIds.map((id) => room.challenge.parts.find((part) => part.id === id)).filter(Boolean) as BeastPart[];
      const raw = selectedParts.reduce((total, part) => total + partContribution(part, event), 0);
      const costPenalty = selectedParts.reduce((total, part) => total + part.cost, 0) * 1.5;
      const categoryBonus = new Set(selectedParts.map((part) => part.category)).size * 4;
      const delta = Math.round(raw / 7 + categoryBonus - costPenalty - event.danger * 2);
      scores[build.playerId] = Math.max(0, scores[build.playerId] + delta);
      const reasons = selectedParts.map((part) => ({ part, contribution: partContribution(part, event) })).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 2).map(({ part, contribution }) => contribution >= 0 ? `${part.name} helped during ${event.title}.` : `${part.name} hurt your beast during ${event.title}.`);
      if (!reasons.length) reasons.push("No major adaptation matched this event.");
      stepResults.push({ playerId: build.playerId, playerName: build.playerName, beastName: build.beastName, delta, scoreAfter: scores[build.playerId], reasons });
    }
    timeline.push({ eventId: event.id, title: event.title, description: event.description, results: stepResults.sort((a, b) => b.scoreAfter - a.scoreAfter) });
  }

  const finalResults: FinalResult[] = builds.map((build) => {
    const selectedParts = build.selectedPartIds.map((id) => room.challenge.parts.find((part) => part.id === id)).filter(Boolean) as BeastPart[];
    return { playerId: build.playerId, name: build.playerName, beastName: build.beastName, score: scores[build.playerId], rank: 0, partCount: selectedParts.length, summary: `${build.beastName} survived with ${selectedParts.length} adaptations across ${room.challenge.events.length} arena events.` };
  }).sort((a, b) => b.score - a.score).map((result, index) => ({ ...result, rank: index + 1 }));

  for (const result of finalResults) {
    const player = room.players[result.playerId];
    if (player) { player.score = result.score; player.status = "finished"; }
  }
  const output = { timeline, leaderboard: finalResults };
  room.simulation = output;
  room.phase = "podium";
  return output;
}

const CreateRoomSchema = z.object({ hostName: z.string().min(1).max(40).default("Host"), challengeId: z.string().optional() });
const JoinRoomSchema = z.object({ roomId: z.string().min(4).max(10), name: z.string().min(1).max(40) });
const SubmitBuildSchema = z.object({ roomId: z.string(), playerId: z.string(), beastName: z.string().min(1).max(40), selectedPartIds: z.array(z.string()).min(1) });

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (_, res) => res.json({ ok: true, rooms: Object.keys(rooms).length }));
app.get("/challenges", (_, res) => res.json({ challenges: challengePresets }));
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("create-room", (payload, callback) => {
    try {
      const parsed = CreateRoomSchema.parse(payload ?? {});
      let roomId = makeRoomCode();
      while (rooms[roomId]) roomId = makeRoomCode();
      const room: Room = { id: roomId, hostSocketId: socket.id, challenge: getPreset(parsed.challengeId ?? "desert-survival"), players: {}, builds: {}, phase: "lobby", createdAt: Date.now() };
      rooms[roomId] = room; socket.join(roomId);
      callback?.({ ok: true, room: publicRoom(room), challenge: room.challenge, challenges: challengePresets });
      emitState(room);
    } catch (error) { callback?.({ ok: false, error: String(error) }); }
  });

  socket.on("set-challenge", (payload, callback) => {
    const { roomId, challengeId } = payload ?? {}; const room = rooms[roomId];
    if (!room) return callback?.({ ok: false, error: "Room not found." });
    if (room.hostSocketId !== socket.id) return callback?.({ ok: false, error: "Only the host can change the challenge." });
    if (room.phase !== "lobby" && room.phase !== "podium") return callback?.({ ok: false, error: "You can only change the challenge before or after a game." });
    room.challenge = getPreset(challengeId); room.builds = {}; room.simulation = undefined;
    for (const p of Object.values(room.players)) { p.status = "lobby"; p.score = 0; delete p.submittedAt; }
    io.to(room.id).emit("challenge-updated", room.challenge); emitState(room); callback?.({ ok: true, challenge: room.challenge });
  });

  socket.on("join-room", (payload, callback) => {
    try {
      const parsed = JoinRoomSchema.parse(payload); const room = rooms[parsed.roomId];
      if (!room) return callback?.({ ok: false, error: "Room not found." });
      if (room.phase !== "lobby") return callback?.({ ok: false, error: "This round has already started. Ask the host to restart." });
      const player: Player = { id: makeId("player"), socketId: socket.id, name: parsed.name, score: 0, status: "lobby" };
      room.players[player.id] = player; socket.join(room.id);
      callback?.({ ok: true, room: publicRoom(room), challenge: room.challenge, player, leaderboard: leaderboard(room) });
      emitState(room);
    } catch (error) { callback?.({ ok: false, error: String(error) }); }
  });

  socket.on("start-build", (payload, callback) => {
    const { roomId } = payload ?? {}; const room = rooms[roomId];
    if (!room) return callback?.({ ok: false, error: "Room not found." });
    if (room.hostSocketId !== socket.id) return callback?.({ ok: false, error: "Only the host can start the game." });
    if (!Object.keys(room.players).length) return callback?.({ ok: false, error: "No players have joined yet." });
    room.phase = "building"; room.builds = {}; room.simulation = undefined;
    for (const p of Object.values(room.players)) { p.status = "building"; p.score = 0; delete p.submittedAt; }
    io.to(room.id).emit("build-started", { room: publicRoom(room), challenge: room.challenge });
    emitState(room); callback?.({ ok: true, dashboard: hostDashboard(room) });
  });

  socket.on("submit-build", (payload, callback) => {
    try {
      const parsed = SubmitBuildSchema.parse(payload); const room = rooms[parsed.roomId];
      if (!room) return callback?.({ ok: false, error: "Room not found." });
      const player = room.players[parsed.playerId];
      if (!player || player.socketId !== socket.id) return callback?.({ ok: false, error: "Player not found." });
      if (room.phase !== "building") return callback?.({ ok: false, error: "The build phase is not active." });
      const uniquePartIds = Array.from(new Set(parsed.selectedPartIds));
      if (uniquePartIds.length < room.challenge.minParts || uniquePartIds.length > room.challenge.maxParts) return callback?.({ ok: false, error: `Choose ${room.challenge.minParts}-${room.challenge.maxParts} parts.` });
      const validPartIds = new Set(room.challenge.parts.map((p) => p.id));
      if (!uniquePartIds.every((id) => validPartIds.has(id))) return callback?.({ ok: false, error: "One or more selected parts are invalid." });
      const build: BeastBuild = { playerId: player.id, playerName: player.name, beastName: parsed.beastName, selectedPartIds: uniquePartIds, submittedAt: Date.now() };
      room.builds[player.id] = build; player.status = "submitted"; player.submittedAt = build.submittedAt;
      emitState(room); callback?.({ ok: true, build, dashboard: hostDashboard(room) });
      const players = Object.values(room.players);
      if (players.length > 0 && players.every((p) => p.status === "submitted")) {
        io.to(room.id).emit("all-builds-submitted", { room: publicRoom(room) });
        setTimeout(() => { const liveRoom = rooms[room.id]; if (!liveRoom || liveRoom.phase !== "building") return; const output = simulateRoom(liveRoom); io.to(liveRoom.id).emit("simulation-started", { room: publicRoom(liveRoom), challenge: liveRoom.challenge, simulation: output }); emitState(liveRoom); }, 1200);
      }
    } catch (error) { callback?.({ ok: false, error: String(error) }); }
  });

  socket.on("run-simulation", (payload, callback) => {
    const { roomId } = payload ?? {}; const room = rooms[roomId];
    if (!room) return callback?.({ ok: false, error: "Room not found." });
    if (room.hostSocketId !== socket.id) return callback?.({ ok: false, error: "Only the host can run the simulation." });
    if (!Object.keys(room.builds).length) return callback?.({ ok: false, error: "No builds have been submitted yet." });
    const output = simulateRoom(room); io.to(room.id).emit("simulation-started", { room: publicRoom(room), challenge: room.challenge, simulation: output }); emitState(room); callback?.({ ok: true, simulation: output });
  });

  socket.on("restart-game", (payload, callback) => {
    const { roomId } = payload ?? {}; const room = rooms[roomId];
    if (!room) return callback?.({ ok: false, error: "Room not found." });
    if (room.hostSocketId !== socket.id) return callback?.({ ok: false, error: "Only the host can restart." });
    room.phase = "building"; room.builds = {}; room.simulation = undefined;
    for (const p of Object.values(room.players)) { p.status = "building"; p.score = 0; delete p.submittedAt; }
    io.to(room.id).emit("build-started", { room: publicRoom(room), challenge: room.challenge }); emitState(room); callback?.({ ok: true, dashboard: hostDashboard(room) });
  });

  socket.on("end-game", (payload, callback) => {
    const { roomId } = payload ?? {}; const room = rooms[roomId];
    if (!room) return callback?.({ ok: false, error: "Room not found." });
    if (room.hostSocketId !== socket.id) return callback?.({ ok: false, error: "Only the host can end the game." });
    io.to(room.id).emit("return-home", { reason: "Host ended the game." }); delete rooms[room.id]; callback?.({ ok: true });
  });

  socket.on("disconnect", () => {
    for (const room of Object.values(rooms)) {
      for (const player of Object.values(room.players)) if (player.socketId === socket.id) { delete room.players[player.id]; delete room.builds[player.id]; emitState(room); }
      if (room.hostSocketId === socket.id) io.to(room.id).emit("host-disconnected");
    }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Build-a-Beast server running on http://localhost:${PORT}`));
