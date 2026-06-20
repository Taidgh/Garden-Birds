const fs   = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

const DEFAULTS = {
  siteTitle:  "My Kid's Garden",
  birdnetUrl: 'http://192.168.1.70:8080',
  facts: [
    "Eagles can see up to 8x better than humans!",
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
    "Birds are literally dinosaurs — they evolved from theropods!",
    "The Arctic Tern migrates 44,000 miles every year — a world record!",
  ],
  birdFacts: {},  // species-specific overrides keyed by common name
  popup: {
    enabled:  false,
    date:     '',       // MM-DD format e.g. "06-15"
    title:    '',
    message:  '',
    imageUrl: '',
  },
};

function load() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULTS, birdFacts: {} };
    const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    return { ...DEFAULTS, ...saved, birdFacts: saved.birdFacts || {} };
  } catch {
    return { ...DEFAULTS, birdFacts: {} };
  }
}

function save(settings) {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

module.exports = { load, save, DEFAULTS };
