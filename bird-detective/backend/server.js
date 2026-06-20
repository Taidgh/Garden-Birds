const express   = require('express');
const cors      = require('cors');
const axios     = require('axios');
const NodeCache = require('node-cache');
const settings  = require('./settings');

const app = express();
app.use(cors());
app.use(express.json());

const cache = new NodeCache({ stdTTL: 30 });

const ADMIN_USER = process.env.ADMIN_USER || 'taidgh';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Change-This-Password';

function requireAuth(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Basic' || !token) return res.status(401).json({ error: 'Unauthorized' });
  const decoded  = Buffer.from(token, 'base64').toString();
  const colonIdx = decoded.indexOf(':');
  const user = decoded.slice(0, colonIdx);
  const pass = decoded.slice(colonIdx + 1);
  if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
  return res.status(401).json({ error: 'Invalid credentials' });
}

let appSettings = settings.load();

const BIRDNET_BASE     = process.env.BIRDNET_URL    || 'http://192.168.1.70:8080';
const CF_CLIENT_ID     = process.env.CF_CLIENT_ID   || '';
const CF_CLIENT_SECRET = process.env.CF_CLIENT_SECRET || '';
const BIRD_SECRET      = process.env.BIRD_SECRET    || '';
const POLL_INTERVAL    = parseInt(process.env.POLL_INTERVAL || '30000');
const PORT             = parseInt(process.env.PORT || '3001');

if (CF_CLIENT_ID) {
  axios.defaults.headers.common['CF-Access-Client-Id']     = CF_CLIENT_ID;
  axios.defaults.headers.common['CF-Access-Client-Secret'] = CF_CLIENT_SECRET;
}
if (BIRD_SECRET) {
  axios.defaults.headers.common['x-bird-secret'] = BIRD_SECRET;
}

let allSpecies   = [];
let lastPollTime = null;

// ── Rarity baselines (Irish/European species) ──
const RARITY_BASELINES = {
  'Eurasian Blackbird':88,'Common Magpie':82,'Common Woodpigeon':85,
  'Rock Dove':80,'House Sparrow':78,'European Robin':75,
  'Great Tit':72,'Eurasian Blue Tit':70,'Collared Dove':68,
  'Eurasian Jackdaw':72,'Rook':70,'Carrion Crow':72,'Hooded Crow':65,
  'Common Starling':78,'Dunnock':58,'Eurasian Siskin':50,
  'European Goldfinch':55,'Common Chaffinch':60,'Eurasian Bullfinch':40,
  'Song Thrush':52,'Mistle Thrush':40,'Stock Dove':38,'Wren':65,
  'Blackcap':42,'Common Chiffchaff':48,'Willow Warbler':45,
  'Yellow-legged Gull':35,'Herring Gull':55,'Black-headed Gull':55,
  'Tree Pipit':28,'Common Kestrel':25,'Common Buzzard':30,
  'Eurasian Sparrowhawk':22,'Peregrine Falcon':15,
  'Great Spotted Woodpecker':30,'Green Woodpecker':20,
  'Barn Swallow':45,'House Martin':42,'Pied Wagtail':50,
  'Grey Wagtail':30,'Meadow Pipit':45,'Kingfisher':15,
  'Jay':32,'Long-tailed Tit':42,'Coal Tit':45,'Goldcrest':38,
  'Firecrest':10,'Common Cuckoo':20,'Tawny Owl':18,
  'Long-eared Owl':8,'Barn Owl':10,'Red Kite':12,
  'White-tailed Eagle':5,'Osprey':5,'Merlin':8,'Hen Harrier':8,
  'Brambling':15,'Redwing':30,'Fieldfare':25,
};

function getRarityScore(commonName, count, isNewSpecies, highConfidence) {
  const baseline    = RARITY_BASELINES[commonName] ?? 40;
  const countPenalty = Math.min(Math.log2(count + 1) * 8, 25);
  const newBonus    = isNewSpecies ? 15 : 0;
  const confBonus   = highConfidence ? 5 : 0;
  return Math.min(100, Math.max(0, Math.round(100 - baseline - countPenalty + newBonus + confBonus)));
}

function getRarityLabel(score) {
  if (score >= 80) return 'LEGENDARY';
  if (score >= 60) return 'RARE';
  if (score >= 40) return 'UNCOMMON';
  if (score >= 20) return 'OCCASIONAL';
  return 'COMMON';
}

function getRarityColor(score) {
  if (score >= 80) return '#FFD700';
  if (score >= 60) return '#FF6B35';
  if (score >= 40) return '#8B5CF6';
  if (score >= 20) return '#3B82F6';
  return '#22C55E';
}

const BIRD_FACTS = {
  // Very common garden birds
  'Common Woodpigeon':        "Woodpigeons drink by sucking water up continuously — most birds have to tilt their heads back!",
  'European Robin':           "Robins are so territorial they'll fight their own reflection in a mirror!",
  'Eurasian Blackbird':       "Blackbirds are one of the first to sing at dawn — they kick off the dawn chorus every morning!",
  'Collared Dove':            "Collared Doves only arrived in Ireland in the 1950s, spreading across all of Europe in just decades!",
  'Common Magpie':            "Magpies are one of the few animals that can recognise themselves in a mirror!",
  'European Goldfinch':       "A group of goldfinches is called a 'charm' — and their tinkling song really is charming!",
  'Eurasian Blue Tit':        "Blue Tits can visit a garden feeder up to 100 times a day!",
  'House Sparrow':            "House Sparrow numbers have crashed by over 60% in Ireland and the UK since the 1970s!",
  'Herring Gull':             "Herring Gulls are clever enough to stamp their feet on grass to imitate rain and trick earthworms to the surface!",
  'Eurasian Siskin':          "Siskins hang upside-down from branches like tiny acrobats to reach the best seeds!",
  'Tawny Owl':                "The famous 'twit-twoo' is actually two Tawny Owls calling to each other — one says 'kewick', the other replies 'hooo'!",
  'Great Tit':                "Great Tits have been recorded using tools — they poke pine needles into bark to get at insects!",
  'Rock Dove':                "Every pigeon you see in a city is descended from Rock Doves — the original wild cliff pigeon!",
  'Stock Dove':               "Stock Doves nest inside tree holes and old rabbit burrows — very different from their bolder Woodpigeon cousins!",
  'Dunnock':                  "Dunnocks have one of the most complicated love lives of any garden bird — often three or four birds share one nest!",
  'Carrion Crow':             "Crows have been observed placing nuts on roads for cars to crack open, then waiting for traffic lights to collect them!",
  'Common Starling':          "A murmuration of Starlings can contain over a million birds moving as one fluid shape in the sky!",
  'Eurasian Wren':            "The Wren is one of Ireland and Britain's most common birds — and one of the loudest for its tiny size!",
  'Long-tailed Tit':          "Long-tailed Tits build an elastic nest from over 2,000 feathers, spider silk and lichen that expands as the chicks grow!",
  'Great Spotted Woodpecker': "Woodpeckers have a spongy skull and a tongue that wraps around their brain to absorb the shock of pecking!",
  'Hooded Crow':              "Hooded Crows drop shellfish from height onto rocks to crack them open — and choose the right height for each shell!",
  'Yellow-legged Gull':       "Yellow-legged Gulls are primarily Mediterranean birds — spotting one in Ireland is a genuine rarity worth noting!",
  'Coal Tit':                 "Coal Tits are hoarders — they hide thousands of seeds in autumn and can remember every hiding spot months later!",
  'Eurasian Jackdaw':         "Jackdaws have pale eyes that make them look wise — and they are, with one of the highest IQs of any bird!",
  'Short-toed Treecreeper':   "Treecreepers always spiral upward around tree trunks, then fly to the base of the next tree to start again!",
  'Black Redstart':           "Black Redstarts are rare garden visitors — they originally nested on rocky mountain cliffs but now love bombed city ruins!",
  'Common Firecrest':         "The Firecrest is one of Europe's smallest birds, weighing less than a 20p coin!",
  'Rook':                     "Rooks are highly social and live in large colonies called rookeries — some have been used continuously for centuries!",
  'Mistle Thrush':            "The Mistle Thrush sings loudly from the tops of trees even in storms and rain, earning it the nickname 'Stormcock'!",
  'Goldcrest':                "The Goldcrest is Britain and Ireland's smallest bird — it weighs the same as a single teabag!",
  'Common Chiffchaff':        "The Chiffchaff is named after its song — it literally sings 'chiff-chaff, chiff-chaff' over and over!",
  'European Greenfinch':      "Greenfinch populations crashed across Europe due to a disease called trichomonosis — garden feeders help them recover!",
  'Redwing':                  "Redwings are winter visitors from Iceland and Scandinavia — they migrate at night using the stars to navigate!",
  'Great Bittern':            "The Bittern's booming call can be heard 5km away and is one of the lowest-pitched sounds made by any European bird!",
  'Common Buzzard':           "Buzzards were nearly wiped out in Ireland but have made a spectacular comeback — now one of the most common raptors!",
  'Eurasian Blackcap':        "Blackcaps are sometimes called the 'Northern Nightingale' — their song is considered one of the most beautiful of any bird!",
  'Grey Heron':               "Grey Herons can stand completely motionless for hours waiting for fish — then strike faster than the eye can follow!",
  'Eurasian Coot':            "Coots have distinctive white bills and frontal shields — they're fiercely territorial and will attack much larger birds!",
  'Tree Pipit':               "Tree Pipits parachute down from treetops in a beautiful song-flight display, singing all the way down!",
  'Great Black-backed Gull':  "The Great Black-backed Gull is the world's largest gull — it can swallow a puffin whole!",
  'Common Swift':             "Swifts spend almost their entire lives in the air — eating, sleeping and even mating on the wing. They only land to nest!",
  'Whimbrel':                 "The Whimbrel's seven-note whistle call is one of the most evocative sounds of the Irish coast in spring migration!",
  'Mallard':                  "All domestic ducks (except Muscovy ducks) are descended from the Mallard — it's the ancestor of nearly every farm duck!",
  'Common Pheasant':          "Pheasants were introduced to Ireland by the Normans over 800 years ago — they're not native but feel like part of the landscape!",
  'Eurasian Curlew':          "The Curlew's haunting call is considered one of the most beautiful sounds in nature — and it's now endangered in Ireland!",
  'Grey Wagtail':             "Despite being called Grey, the Grey Wagtail has a brilliant yellow belly — it's always found near fast-flowing streams!",
  'Gadwall':                  "Gadwalls are subtle and understated ducks — the male looks plain but reveals intricate grey patterns up close!",
  'Barn Swallow':             "Swallows migrate from South Africa every spring — a round trip of over 20,000 miles — returning to the same nest each year!",
  'Common Sandpiper':         "Common Sandpipers bob their tails up and down constantly as they walk — nobody knows exactly why they do this!",
  'Ring Ouzel':               "The Ring Ouzel is the mountain cousin of the Blackbird — a rare spring and autumn visitor passing through Ireland!",
  'Ring-necked Parakeet':     "Ring-necked Parakeets are the UK's only naturalised parrot — they've been breeding wild since the 1970s!",
  'Pied Wagtail/White Wagtail':"Wagtails wag their tails constantly — scientists think it signals fitness to predators: 'I'm so healthy I can waste energy'!",
  'Goosander':                "Goosanders are expert fishing ducks with serrated bills like tiny saw-teeth to grip slippery fish!",
  'Common Scoter':            "Common Scoters are sea ducks that gather in huge 'rafts' offshore — rare to see one inland!",
  'Black Woodpecker':         "The Black Woodpecker is the largest woodpecker in Europe — its call inspired the cartoon character Woody Woodpecker!",
  'Western House Martin':     "House Martins build their mud-cup nests under eaves and can raise three broods of chicks in a single summer!",
  'Canada Goose':             "Canada Geese mate for life and if one is injured, its partner will stay behind rather than migrate with the flock!",
  'Barn Owl':                 "Barn Owls can locate prey in complete darkness using hearing alone — their heart-shaped face acts like a satellite dish!",
  'Song Thrush':              "Song Thrushes are one of the few birds that use a tool — they smash snail shells against a favourite 'anvil' stone!",
  'European Turtle Dove':     "The Turtle Dove is now critically endangered in the UK — its purring call is becoming one of the rarest sounds in nature!",
  'Eurasian Nuthatch':        "Nuthatches are the only birds that can walk headfirst DOWN a tree trunk — they're built completely differently to treecreepers!",
  'Water Rail':               "Water Rails are incredibly secretive — you'll almost always hear their pig-like squealing call long before you ever see one!",
  'Wood Warbler':             "The Wood Warbler's shivering trill song is one of the most distinctive sounds of ancient oak woodland!",
  'Common Redstart':          "The male Redstart has a tail that constantly quivers — 'start' is an old English word for tail!",
  'Eurasian Golden Oriole':   "The Golden Oriole is one of Europe's most exotic-looking birds — a flash of brilliant yellow through the treetops!",
  'Red Kite':                 "Red Kites were reintroduced to Ireland in 2007 after being extinct for centuries — a major conservation success story!",
  'Eurasian Oystercatcher':   "Oystercatchers don't actually eat many oysters — they mainly eat mussels and cockles, which they prise open with their bright orange bill!",
  'Common Moorhen':           "Moorhen chicks can swim within hours of hatching and help feed their younger siblings from the next brood!",
  'Common Raven':             "Ravens are the largest member of the crow family and one of the most intelligent birds — they can plan for the future!",
  'Dunlin':                   "Dunlins are one of the most common wading birds in the world — enormous flocks twist and turn in perfect synchrony!",
  'Greylag Goose':            "Greylag Geese are the ancestors of most domestic farmyard geese — they were domesticated thousands of years ago!",
  'Fieldfare':                "Fieldfares arrive from Scandinavia in autumn and often travel in large noisy flocks stripping berry bushes bare!",
  'Green Sandpiper':          "Unlike most waders, Green Sandpipers nest in old tree nests rather than on the ground — often using abandoned thrush nests!",
  'Sandwich Tern':            "Sandwich Terns plunge-dive from height to catch fish — their cream-coloured bill tip helps them judge distance underwater!",
  'Red-billed Chough':        "The Chough is Ireland's rarest crow — its acrobatic flight and red bill make it unmistakable along coastal cliffs!",
  'Marsh Tit':                "Marsh Tits have remarkable memories and can remember thousands of seed-hiding locations across their territory!",
  'Eurasian Green Woodpecker':"The Green Woodpecker spends most of its time on the ground eating ants — it laps them up with a sticky tongue!",
  'Eurasian Tree Sparrow':    "Unlike House Sparrows, both male and female Tree Sparrows look identical — both have the distinctive black cheek spot!",
  'Northern Gannet':          "Gannets dive from 30 metres at 100km/h — they have air sacs in their face that inflate on impact to protect their skull!",
  'Common Linnet':            "Linnets are seed-eating finches whose population has declined sharply — a sad sign of modern intensive farming!",
  'Mediterranean Gull':       "The Mediterranean Gull has a pure white wingtip — unlike Herring Gulls there's not a single black feather on it!",
  'Atlantic Puffin':          "Puffins can hold dozens of fish in their bill at once thanks to a unique hinge mechanism — the record is 83 fish!",
  'European Pied Flycatcher': "Pied Flycatchers migrate from West Africa every spring — arriving almost exactly on the same date each year!",
  'Common Kestrel':           "Kestrels can see ultraviolet light — vole urine glows UV, so they follow the trails to find their prey!",
  'Lesser Spotted Woodpecker':"The Lesser Spotted Woodpecker is the smallest woodpecker in Europe — barely bigger than a sparrow!",
  'Hawfinch':                 "The Hawfinch has the most powerful bill of any European finch — it can crack cherry stones that require 50kg of force!",
  'Black-headed Gull':        "Despite their name, Black-headed Gulls only have dark brown heads in summer — in winter their heads turn white!",
  'Eurasian Treecreeper':     "Treecreepers build their nests behind loose bark on trees — a cosy hidden pocket completely invisible from outside!",
  'Common Kingfisher':        "Kingfishers dive so fast they close their eyes before hitting the water — they aim entirely by memory!",
  'Melodious Warbler':        "The Melodious Warbler is a rare vagrant from southern Europe — a real surprise find in an Irish garden!",
  'Common Whitethroat':       "Whitethroats build a 'cock nest' — the male builds several rough nests for the female to choose from and finish!",
  'Common Redshank':          "Redshanks are known as the 'sentinel of the marshes' — they're always the first to call out a warning when danger approaches!",
  'Common Shelduck':          "Shelducks gather their ducklings into large 'crèches' looked after by just one or two adults while the parents moult!",
  'Barnacle Goose':           "Barnacle Geese were once thought to hatch from barnacles on driftwood — people in the Middle Ages had never seen their nesting grounds!",
};

function getFunFact(name) {
  // Admin-configured overrides take priority over server defaults
  if (appSettings.birdFacts && appSettings.birdFacts[name]) return appSettings.birdFacts[name];
  return BIRD_FACTS[name] || null;
}

function expandHourlyCounts(bird) {
  const today  = new Date();
  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  const out    = [];
  (bird.hourly_counts || []).forEach((count, hour) => {
    for (let i = 0; i < count; i++) {
      const ts = new Date(today);
      ts.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
      if (ts.getTime() >= cutoff) {
        out.push({
          id:             `${bird.species_code}-h${hour}-${i}`,
          species:        bird.common_name,
          scientificName: bird.scientific_name,
          confidence:     bird.high_confidence ? 0.85 + Math.random() * 0.14 : 0.55 + Math.random() * 0.25,
          timestamp:      ts.toISOString(),
          thumbnailUrl:   bird.thumbnail_url ? `/api/thumbnail/${encodeURIComponent((bird.scientific_name || '').trim())}` : null,
          isNewSpecies:   bird.is_new_species || false,
          highConfidence: bird.high_confidence || false,
          firstHeard:     bird.first_heard || null,
          latestHeard:    bird.latest_heard || null,
        });
      }
    }
  });
  return out;
}

async function fetchFromBirdNET(date) {
  const params = date ? { date } : {};
  try {
    const res  = await axios.get(`${BIRDNET_BASE}/api/v2/analytics/species/daily`, { timeout: 10000, params });
    const data = Array.isArray(res.data) ? res.data : [];
    console.log(`✓ Fetched ${data.length} species from BirdNET-Go${date ? ` (${date})` : ''}`);
    return data;
  } catch (err) {
    console.error(`✗ BirdNET-Go unreachable: ${err.message}`);
    return null;
  }
}

function generateDemoData() {
  console.log('Using demo data');
  return [
    { scientific_name:'Turdus merula',       common_name:'Eurasian Blackbird',  species_code:'eurbla',  count:68, hourly_counts:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,16,3,1,23,12,7,0,0,0], high_confidence:true,  first_heard:'14:27:51', latest_heard:'20:27:51', thumbnail_url:'/api/v2/media/image/Turdus%20merula',        days_this_year:5, current_season:'spring' },
    { scientific_name:'Pica pica',            common_name:'Common Magpie',       species_code:'eurmag1', count:54, hourly_counts:[0,0,0,0,0,0,0,0,0,0,1,1,4,0,0,25,0,4,7,12,0,0,0,0], high_confidence:true,  first_heard:'10:51:40', latest_heard:'19:51:40', thumbnail_url:'/api/v2/media/image/Pica%20pica',            days_this_year:5, current_season:'spring' },
    { scientific_name:'Columba palumbus',     common_name:'Common Woodpigeon',   species_code:'cowpig1', count:50, hourly_counts:[0,0,0,0,0,0,0,0,0,1,0,1,7,6,5,4,5,12,2,4,0,1,2,0],  high_confidence:true,  first_heard:'09:20:55', latest_heard:'22:20:55', thumbnail_url:'/api/v2/media/image/Columba%20palumbus',    days_this_year:5, current_season:'spring' },
    { scientific_name:'Erithacus rubecula',   common_name:'European Robin',      species_code:'eurrob1', count:22, hourly_counts:[0,0,0,0,3,0,0,0,0,0,0,4,1,1,0,1,0,1,2,1,5,2,1,0],   high_confidence:true,  first_heard:'04:49:29', latest_heard:'22:49:29', thumbnail_url:'/api/v2/media/image/Erithacus%20rubecula',  days_this_year:5, current_season:'spring' },
    { scientific_name:'Spinus spinus',        common_name:'Eurasian Siskin',     species_code:'eursis',  count:15, hourly_counts:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,1,1,2,3,2,0,0,0,0],   high_confidence:true,  first_heard:'14:39:39', latest_heard:'19:39:39', thumbnail_url:'/api/v2/media/image/Spinus%20spinus',        days_this_year:5, current_season:'spring' },
    { scientific_name:'Carduelis carduelis',  common_name:'European Goldfinch',  species_code:'eurgol',  count:8,  hourly_counts:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,3,0,0,1,0,2,0,0,0,0],   high_confidence:true,  first_heard:'04:14:30', latest_heard:'19:14:30', thumbnail_url:'/api/v2/media/image/Carduelis%20carduelis',  days_this_year:5, current_season:'spring' },
    { scientific_name:'Anthus trivialis',     common_name:'Tree Pipit',          species_code:'trepip',  count:3,  hourly_counts:[0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,1,0,0,0,0,0,0],   high_confidence:true,  first_heard:'12:00:29', latest_heard:'17:00:29', thumbnail_url:'/api/v2/media/image/Anthus%20trivialis',     days_this_year:2, current_season:'spring' },
    { scientific_name:'Falco tinnunculus',    common_name:'Common Kestrel',      species_code:'eurkes',  count:1,  hourly_counts:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],   high_confidence:false, first_heard:'20:39:07', latest_heard:'20:39:07', thumbnail_url:'/api/v2/media/image/Falco%20tinnunculus',    is_new_species:true, current_season:'spring' },
    { scientific_name:'Buteo buteo',          common_name:'Common Buzzard',      species_code:'combuz1', count:1,  hourly_counts:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],   high_confidence:false, first_heard:'18:39:38', latest_heard:'18:39:38', thumbnail_url:'/api/v2/media/image/Buteo%20buteo',          days_this_year:5, current_season:'spring' },
  ];
}

function processData(raw) {
  return raw.map(bird => {
    const rarityScore = getRarityScore(bird.common_name, bird.count, bird.is_new_species||false, bird.high_confidence||false);
    return {
      species:         bird.common_name,
      scientificName:  bird.scientific_name,
      speciesCode:     bird.species_code,
      count:           bird.count,
      hourlyCounts:    bird.hourly_counts || [],
      firstHeard:      bird.first_heard,
      latestHeard:     bird.latest_heard,
      highConfidence:  bird.high_confidence || false,
      isNewSpecies:    bird.is_new_species  || false,
      isNewThisYear:   bird.is_new_this_year || false,
      daysThisYear:    bird.days_this_year  || 0,
      daysThisSeason:  bird.days_this_season || 0,
      currentSeason:   bird.current_season  || 'unknown',
      thumbnailUrl:    bird.thumbnail_url ? `/api/thumbnail/${encodeURIComponent((bird.scientific_name || '').trim())}` : null,
      rarityScore,
      rarityLabel:     getRarityLabel(rarityScore),
      rarityColor:     getRarityColor(rarityScore),
      isRare:          rarityScore >= 40,
      isLegendary:     rarityScore >= 80,
      funFact:         getFunFact(bird.common_name),
    };
  }).sort((a, b) => b.rarityScore - a.rarityScore);
}

function buildDetectionFeed(enrichedSpecies) {
  const detections = [];
  enrichedSpecies.forEach(bird => {
    const expanded = expandHourlyCounts({
      common_name:    bird.species,
      scientific_name:bird.scientificName,
      species_code:   bird.speciesCode,
      hourly_counts:  bird.hourlyCounts,
      high_confidence:bird.highConfidence,
      thumbnail_url:  bird.thumbnailUrl ? bird.thumbnailUrl.replace(BIRDNET_BASE, '') : null,
      is_new_species: bird.isNewSpecies,
      first_heard:    bird.firstHeard,
      latest_heard:   bird.latestHeard,
    });
    expanded.forEach(d => detections.push({
      ...d,
      rarityScore: bird.rarityScore, rarityLabel: bird.rarityLabel,
      rarityColor: bird.rarityColor, isRare: bird.isRare,
      isLegendary: bird.isLegendary, countToday: bird.count,
      funFact: bird.funFact,
    }));
  });
  return detections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function buildSpeciesCards(speciesList) {
  return speciesList.filter(s => s.rarityScore >= 20).slice(0, 6).map(s => ({
    id: s.speciesCode, species: s.species, scientificName: s.scientificName,
    rarityScore: s.rarityScore, rarityLabel: s.rarityLabel, rarityColor: s.rarityColor,
    confidence: s.highConfidence ? 0.9 : 0.65, funFact: s.funFact,
    thumbnailUrl: s.thumbnailUrl, countToday: s.count, daysThisYear: s.daysThisYear,
    currentSeason: s.currentSeason, isNewSpecies: s.isNewSpecies,
    latestHeard: s.latestHeard, hourlyCounts: s.hourlyCounts,
  }));
}

async function poll() {
  console.log('Polling BirdNET-Go /api/v2/analytics/species/daily ...');
  let raw = await fetchFromBirdNET();
  if (!raw) raw = generateDemoData();
  allSpecies   = processData(raw);
  lastPollTime = new Date().toISOString();
  cache.flushAll();
  console.log(`✓ ${allSpecies.length} species | ${allSpecies.filter(s=>s.isRare).length} rare | ${allSpecies.filter(s=>s.isLegendary).length} legendary`);
}

poll();
setInterval(poll, POLL_INTERVAL);

// ── Routes ────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status:'ok', lastPoll:lastPollTime, speciesCount:allSpecies.length }));

app.get('/api/detections', (req, res) => {
  const cached = cache.get('detections');
  if (cached) return res.json(cached);
  const detections = buildDetectionFeed(allSpecies);
  const result = { detections, lastUpdated:lastPollTime, total:detections.length };
  cache.set('detections', result, 60);
  res.json(result);
});

app.get('/api/detections/recent', (req, res) => {
  const limit = parseInt(req.query.limit || '20');
  res.json({ detections: buildDetectionFeed(allSpecies).slice(0, limit), lastUpdated:lastPollTime });
});

app.get('/api/species', (req, res) => res.json({ species:allSpecies, lastUpdated:lastPollTime }));

app.get('/api/stats', (req, res) => {
  const cached = cache.get('stats');
  if (cached) return res.json(cached);
  const totalDetections = allSpecies.reduce((s,b) => s + b.count, 0);
  const mostActive = [...allSpecies].sort((a,b) => b.count - a.count).slice(0,5).map(s => ({ species:s.species, count:s.count }));
  const rarestToday = buildSpeciesCards(allSpecies);
  const nightVisitors = allSpecies.filter(s => {
    const c = s.hourlyCounts || [];
    return c.slice(20).some(v => v > 0) || c.slice(0,6).some(v => v > 0);
  }).map(s => s.species);
  const newSpeciesData = allSpecies.filter(s => s.isNewSpecies).map(s => ({
    id:s.speciesCode, species:s.species, scientificName:s.scientificName,
    rarityScore:s.rarityScore, rarityLabel:s.rarityLabel, rarityColor:s.rarityColor,
    confidence:s.highConfidence?0.9:0.65, funFact:s.funFact, thumbnailUrl:s.thumbnailUrl,
    countToday:s.count, daysThisYear:s.daysThisYear, currentSeason:s.currentSeason,
    isNewSpecies:true, latestHeard:s.latestHeard, hourlyCounts:s.hourlyCounts,
  }));
  const birdOfDay = rarestToday[0] || null;
  const stats = {
    totalDetections, uniqueSpecies:allSpecies.length,
    rareFinds:allSpecies.filter(s=>s.isRare).length,
    legendaryFinds:allSpecies.filter(s=>s.isLegendary).length,
    mostActive, rarestToday, nightVisitors,
    newSpecies:allSpecies.filter(s=>s.isNewSpecies).map(s=>s.species),
    newSpeciesData, birdOfDay, lastUpdated:lastPollTime,
  };
  cache.set('stats', stats);
  res.json(stats);
});

app.get('/api/stats/yesterday', async (req, res) => {
  const cached = cache.get('stats-yesterday');
  if (cached) return res.json(cached);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  try {
    let raw = await fetchFromBirdNET(dateStr);
    if (!raw) raw = generateDemoData();
    const processed = processData(raw);
    const result = { rarestYesterday: buildSpeciesCards(processed), date: dateStr };
    cache.set('stats-yesterday', result, 300);
    res.json(result);
  } catch {
    res.json({ rarestYesterday: buildSpeciesCards(allSpecies), date: dateStr });
  }
});

app.get('/api/species-detections', async (req, res) => {
  const { species, date } = req.query;
  if (!species) return res.status(400).json({ error: 'species required' });
  const useDate = date || new Date().toISOString().split('T')[0];
  try {
    const response = await axios.get(`${BIRDNET_BASE}/api/v2/detections`, {
      timeout: 10000,
      params: { queryType:'species', date:useDate, species, numResults:25, offset:0, includeWeather:true },
    });
    res.json(response.data);
  } catch (e) {
    res.status(502).json({ error: e.message, data: [] });
  }
});

app.get('/api/bird-image', async (req, res) => {
  const species = req.query.species;
  if (!species) return res.status(400).json({ error: 'species required' });
  const cacheKey = `img-${species}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  const found = allSpecies.find(s => s.species === species);
  if (found?.thumbnailUrl) {
    const result = { imageUrl:found.thumbnailUrl, species, source:'birdnet' };
    cache.set(cacheKey, result, 3600);
    return res.json(result);
  }
  try {
    const wikiRes = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(species), { timeout:5000 });
    const imageUrl = wikiRes.data?.thumbnail?.source || null;
    const result = { imageUrl, species, source:'wikipedia' };
    cache.set(cacheKey, result, 3600);
    res.json(result);
  } catch { res.json({ imageUrl:null, species, source:null }); }
});

app.get('/api/thumbnail/:scientificName(*)', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.scientificName);
    const url  = `${BIRDNET_BASE}/api/v2/media/image/${encodeURIComponent(name)}`;
    const response = await axios.get(url, { responseType:'stream', timeout:8000 });
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (e) {
    res.status(404).json({ error:'thumbnail not found' });
  }
});

app.get('/api/audio/:id(*)', async (req, res) => {
  try {
    const url = `${BIRDNET_BASE}/api/v2/audio/${req.params.id}`;
    const response = await axios.get(url, { responseType:'stream', timeout:15000 });
    res.set('Content-Type', response.headers['content-type'] || 'audio/mpeg');
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Accept-Ranges', 'bytes');
    response.data.pipe(res);
  } catch { res.status(404).json({ error:'audio not found' }); }
});

// ── Settings (public read, auth required for writes) ──────────

// Public: frontend reads these on load
app.get('/api/settings', (req, res) => res.json({
  siteTitle:  appSettings.siteTitle  || "My Kid's Garden",
  birdnetUrl: appSettings.birdnetUrl || BIRDNET_BASE,
  facts:      appSettings.facts      || [],
  birdFacts:  appSettings.birdFacts  || {},
}));

app.post('/api/admin/login', requireAuth, (req, res) => res.json({ ok:true }));

// ── Site title ──
app.put('/api/admin/settings/title', requireAuth, (req, res) => {
  const { siteTitle } = req.body;
  if (!siteTitle || typeof siteTitle !== 'string') return res.status(400).json({ error:'siteTitle required' });
  appSettings.siteTitle = siteTitle.trim();
  settings.save(appSettings);
  res.json({ ok:true, siteTitle:appSettings.siteTitle });
});

// ── BirdNET-Go URL ──
app.put('/api/admin/settings/birdnet', requireAuth, (req, res) => {
  const { birdnetUrl } = req.body;
  if (!birdnetUrl || typeof birdnetUrl !== 'string') return res.status(400).json({ error:'birdnetUrl required' });
  appSettings.birdnetUrl = birdnetUrl.trim().replace(/\/$/, '');
  settings.save(appSettings);
  // Note: BIRDNET_BASE is read at startup from env — changes here affect
  // how the URL is reported, not live requests (restart required for that)
  res.json({ ok:true, birdnetUrl:appSettings.birdnetUrl, note:'Restart backend to apply URL change' });
});

// ── Ticker facts ──
app.get('/api/admin/settings/facts', requireAuth, (req, res) => res.json({ facts:appSettings.facts }));

app.put('/api/admin/settings/facts', requireAuth, (req, res) => {
  const { facts } = req.body;
  if (!Array.isArray(facts)) return res.status(400).json({ error:'facts must be array' });
  appSettings.facts = facts.filter(f => typeof f === 'string' && f.trim());
  settings.save(appSettings);
  res.json({ ok:true, facts:appSettings.facts });
});

app.post('/api/admin/settings/facts', requireAuth, (req, res) => {
  const { fact } = req.body;
  if (!fact) return res.status(400).json({ error:'fact required' });
  appSettings.facts.push(fact.trim());
  settings.save(appSettings);
  res.json({ ok:true, facts:appSettings.facts });
});

app.delete('/api/admin/settings/facts/:index', requireAuth, (req, res) => {
  const idx = parseInt(req.params.index);
  if (isNaN(idx) || idx < 0 || idx >= appSettings.facts.length) return res.status(400).json({ error:'invalid index' });
  appSettings.facts.splice(idx, 1);
  settings.save(appSettings);
  res.json({ ok:true, facts:appSettings.facts });
});

// ── Species-specific bird facts ──
app.get('/api/admin/settings/birdfacts', requireAuth, (req, res) => {
  res.json({ birdFacts: appSettings.birdFacts || {} });
});

app.put('/api/admin/settings/birdfacts', requireAuth, (req, res) => {
  const { birdFacts } = req.body;
  if (typeof birdFacts !== 'object' || Array.isArray(birdFacts)) return res.status(400).json({ error:'birdFacts must be object' });
  appSettings.birdFacts = birdFacts;
  settings.save(appSettings);
  res.json({ ok:true, birdFacts:appSettings.birdFacts });
});

// Add or update a single species fact
app.put('/api/admin/settings/birdfacts/:species', requireAuth, (req, res) => {
  const species = decodeURIComponent(req.params.species);
  const { fact } = req.body;
  if (!fact || typeof fact !== 'string') return res.status(400).json({ error:'fact required' });
  if (!appSettings.birdFacts) appSettings.birdFacts = {};
  appSettings.birdFacts[species] = fact.trim();
  settings.save(appSettings);
  res.json({ ok:true, species, fact:appSettings.birdFacts[species] });
});

// Delete a species fact (reverts to server default)
app.delete('/api/admin/settings/birdfacts/:species', requireAuth, (req, res) => {
  const species = decodeURIComponent(req.params.species);
  if (appSettings.birdFacts) delete appSettings.birdFacts[species];
  settings.save(appSettings);
  res.json({ ok:true, species, removed:true });
});


// ── Species Summary (all-time) ──────────────────────────────
app.get('/api/species-summary', async (req, res) => {
  const cached = cache.get('species-summary');
  if (cached) return res.json(cached);
  try {
    const response = await axios.get(`${BIRDNET_BASE}/api/v2/analytics/species/summary`, { timeout: 15000 });
    const data = response.data;
    // Enrich with thumbnail proxy URLs and rarity info
    const enriched = (Array.isArray(data) ? data : data.species || data.data || []).map(s => {
      const rarityScore = getRarityScore(s.common_name || s.commonName, s.total_detections || s.count || 1, false, (s.avg_confidence || s.avgConfidence || 0.7) > 0.8);
      const scientificName = s.scientific_name || s.scientificName || '';
      return {
        species:           s.common_name       || s.commonName       || 'Unknown',
        scientificName,
        speciesCode:       s.species_code      || s.speciesCode      || '',
        totalDetections:   s.total_detections  || s.totalDetections  || s.count || 0,
        avgConfidence:     s.avg_confidence    || s.avgConfidence    || 0,
        daysDetected:      s.days_detected     || s.daysDetected     || s.days_this_year || 0,
        firstSeen:         s.first_seen        || s.firstSeen        || null,
        lastSeen:          s.last_seen         || s.lastSeen         || null,
        thumbnailUrl:      scientificName ? `/api/thumbnail/${encodeURIComponent(scientificName.trim())}` : null,
        rarityScore,
        rarityLabel:       getRarityLabel(rarityScore),
        rarityColor:       getRarityColor(rarityScore),
        funFact:           getFunFact(s.common_name || s.commonName || ''),
      };
    });
    const result = { species: enriched, total: enriched.length };
    cache.set('species-summary', result, 300);
    res.json(result);
  } catch (err) {
    // Fallback: derive from current allSpecies data
    const fallback = allSpecies.map(s => ({
      species:         s.species,
      scientificName:  s.scientificName,
      speciesCode:     s.speciesCode,
      totalDetections: s.count,
      avgConfidence:   s.highConfidence ? 0.88 : 0.65,
      daysDetected:    s.daysThisYear,
      firstSeen:       null,
      lastSeen:        s.latestHeard,
      thumbnailUrl:    s.thumbnailUrl,
      rarityScore:     s.rarityScore,
      rarityLabel:     s.rarityLabel,
      rarityColor:     s.rarityColor,
      funFact:         s.funFact,
    }));
    res.json({ species: fallback, total: fallback.length, fallback: true });
  }
});

// ── Popup settings ───────────────────────────────────────────
app.get('/api/popup', (req, res) => {
  res.json(appSettings.popup || { enabled: false });
});

app.put('/api/admin/settings/popup', requireAuth, (req, res) => {
  const { enabled, date, title, message, imageUrl } = req.body;
  appSettings.popup = { enabled: !!enabled, date: date || '', title: title || '', message: message || '', imageUrl: imageUrl || '' };
  settings.save(appSettings);
  res.json({ ok: true, popup: appSettings.popup });
});

app.listen(PORT, () => {
  console.log(`Bird Detective HQ Backend running on port ${PORT}`);
  console.log(`Polling BirdNET-Go at ${BIRDNET_BASE}`);
});
