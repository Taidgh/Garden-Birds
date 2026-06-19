export function formatTimeAgo(timestamp) {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return 'Just now!';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 12) return `${hours}h ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function getRarityEmoji(label) {
  switch (label) {
    case 'LEGENDARY': return '★';
    case 'RARE':      return '◆';
    case 'UNCOMMON':  return '◈';
    case 'OCCASIONAL':return '◉';
    default:          return '·';
  }
}

export function getBirdEmoji(species = '') {
  const lower = species.toLowerCase();
  if (lower.includes('owl'))        return '🦉';
  if (lower.includes('hawk') || lower.includes('eagle') || lower.includes('kestrel') || lower.includes('buzzard')) return '🦅';
  if (lower.includes('swan'))       return '🦢';
  if (lower.includes('duck') || lower.includes('mallard')) return '🦆';
  if (lower.includes('dove') || lower.includes('pigeon')) return '🕊️';
  if (lower.includes('robin'))      return '🐦‍🔴';
  if (lower.includes('crow') || lower.includes('rook') || lower.includes('jackdaw')) return '🐦‍⬛';
  return '🐦';
}

export function getBirdPlaceholderColor(species = '') {
  const colors = [
    ['#1a472a','#2d6a4f'], ['#1e3a5f','#2e6da4'],
    ['#4a1942','#7b2d7b'], ['#3d2b1f','#6b4423'],
    ['#1a3a2a','#2d5a4f'], ['#2a1a3a','#4d2d7b'],
  ];
  let hash = 0;
  for (let i = 0; i < species.length; i++) hash += species.charCodeAt(i);
  return colors[hash % colors.length];
}

export function getConfidenceLabel(confidence) {
  if (confidence >= 0.95) return 'CERTAIN';
  if (confidence >= 0.85) return 'HIGH';
  if (confidence >= 0.70) return 'GOOD';
  if (confidence >= 0.55) return 'FAIR';
  return 'LOW';
}

export const COOL_FACTS = [
  "Eagles can see up to 8× better than humans!",
  "Owls can't move their eyeballs — they rotate their whole head instead!",
  "Hummingbirds are the only birds that can fly backwards!",
  "Ducks have waterproof feathers — water rolls right off!",
  "Birds have hollow bones to help them fly!",
  "Peregrine Falcons are the fastest animals on Earth — diving at 240 mph!",
  "Parrots can live for 80 years — as long as a human!",
  "Some birds can sleep while flying!",
  "Swans mate for life — they stay together forever!",
  "Great Horned Owls have ear tufts that are NOT ears — just feathers for camouflage!",
  "Woodpeckers peck 20 times per second without getting a headache!",
  "Red-tailed Hawks have the famous movie eagle screech!",
  "Birds are literally dinosaurs — they evolved from theropods!",
  "Mallard ducks can sleep with one eye open to watch for predators!",
  "The Arctic Tern migrates 44,000 miles every year — a world record!",
];
