export const CLUE_BALANCES = [10000, 9750, 9250, 8500, 7500, 6250, 4750, 3000];
export const CLUE_COSTS = [0, 250, 500, 750, 1000, 1250, 1500, 1750];
export function scoreFor(clues, misses) {
  const balance = CLUE_BALANCES[Math.max(0, Math.min(7, clues - 1))];
  return Math.round(balance * 0.7 ** Math.max(0, Math.min(2, misses)) / 10) * 10;
}
export function normalize(value) {
  return String(value).trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
export const PROFESSIONS = [
  ['Foley artist', 'sound', 'arts', ['foley', 'foley sound artist', 'foley sound effects artist']],
  ['Sound designer', 'sound', 'arts', ['audio designer']],
  ['Sound engineer', 'sound', 'arts', ['audio engineer', 'recording engineer']],
  ['Music producer', 'sound', 'arts', ['record producer']],
  ['Musician', 'sound', 'arts', ['instrumentalist']],
  ['Composer', 'sound', 'arts', []],
  ['Voice actor', 'performance', 'arts', ['voiceover artist', 'voice over artist']],
  ['Actor', 'performance', 'arts', ['actress']],
  ['Stunt performer', 'performance', 'arts', ['stuntman', 'stuntwoman', 'stunt double']],
  ['Film director', 'film', 'arts', ['director']],
  ['Film editor', 'film', 'arts', ['video editor']],
  ['Cinematographer', 'film', 'arts', ['director of photography']],
  ['Animator', 'visual', 'arts', []],
  ['Illustrator', 'visual', 'arts', []],
  ['Graphic designer', 'visual', 'arts', []],
  ['Photographer', 'visual', 'arts', []],
  ['Set designer', 'film', 'arts', ['production designer']],
  ['Costume designer', 'film', 'arts', []],
  ['Makeup artist', 'beauty', 'services', ['make up artist']],
  ['Journalist', 'writing', 'arts', ['reporter']],
  ['Writer', 'writing', 'arts', ['author']],
  ['Librarian', 'education', 'education', []],
  ['Teacher', 'education', 'education', ['schoolteacher', 'school teacher']],
  ['Professor', 'education', 'education', ['lecturer']],
  ['Archaeologist', 'research', 'science', []],
  ['Astronomer', 'research', 'science', []],
  ['Marine biologist', 'research', 'science', []],
  ['Forensic scientist', 'research', 'science', []],
  ['Meteorologist', 'research', 'science', ['weather forecaster']],
  ['Geologist', 'research', 'science', []],
  ['Doctor', 'medical', 'health', ['physician']],
  ['Surgeon', 'medical', 'health', []],
  ['Nurse', 'medical', 'health', ['registered nurse']],
  ['Paramedic', 'emergency', 'health', ['emt']],
  ['Dentist', 'medical', 'health', []],
  ['Veterinarian', 'animal', 'health', ['vet']],
  ['Pharmacist', 'medical', 'health', []],
  ['Physiotherapist', 'therapy', 'health', ['physical therapist']],
  ['Psychologist', 'therapy', 'health', []],
  ['Occupational therapist', 'therapy', 'health', []],
  ['Chef', 'food', 'hospitality', ['cook']],
  ['Baker', 'food', 'hospitality', []],
  ['Pastry chef', 'food', 'hospitality', ['patisserie chef']],
  ['Barista', 'food', 'hospitality', []],
  ['Bartender', 'food', 'hospitality', []],
  ['Sommelier', 'food', 'hospitality', ['wine steward']],
  ['Food stylist', 'food', 'hospitality', []],
  ['Hotel manager', 'service', 'hospitality', []],
  ['Flight attendant', 'travel', 'transport', ['cabin crew', 'air hostess', 'stewardess']],
  ['Pilot', 'travel', 'transport', ['airline pilot']],
  ['Air traffic controller', 'travel', 'transport', []],
  ['Train driver', 'travel', 'transport', ['train engineer']],
  ['Truck driver', 'travel', 'transport', ['lorry driver']],
  ['Ship captain', 'travel', 'transport', ['sea captain']],
  ['Architect', 'design', 'construction', []],
  ['Interior designer', 'design', 'construction', []],
  ['Carpenter', 'trade', 'construction', []],
  ['Electrician', 'trade', 'construction', []],
  ['Plumber', 'trade', 'construction', []],
  ['Welder', 'trade', 'construction', []],
  ['Mechanic', 'trade', 'construction', ['automotive mechanic']],
  ['Watchmaker', 'craft', 'craft', ['horologist']],
  ['Jeweler', 'craft', 'craft', ['jeweller']],
  ['Ceramicist', 'craft', 'craft', ['potter']],
  ['Glassblower', 'craft', 'craft', ['glass blower']],
  ['Florist', 'craft', 'craft', []],
  ['Tailor', 'craft', 'craft', ['seamstress']],
  ['Locksmith', 'craft', 'craft', []],
  ['Software engineer', 'technology', 'technology', ['software developer', 'programmer', 'coder']],
  ['Game developer', 'technology', 'technology', []],
  ['Data scientist', 'technology', 'technology', []],
  ['UX designer', 'design', 'technology', ['user experience designer', 'product designer']],
  ['Cybersecurity analyst', 'technology', 'technology', ['security analyst']],
  ['Accountant', 'finance', 'business', []],
  ['Lawyer', 'law', 'business', ['attorney', 'solicitor']],
  ['Real estate agent', 'sales', 'business', ['realtor', 'estate agent']],
  ['Firefighter', 'emergency', 'public', ['fireman']],
  ['Police officer', 'emergency', 'public', ['policeman', 'policewoman']],
  ['Park ranger', 'nature', 'nature', ['forest ranger']],
  ['Farmer', 'nature', 'nature', []],
  ['Beekeeper', 'nature', 'nature', ['apiarist']],
  ['Zookeeper', 'animal', 'nature', ['zoo keeper']],
  ['Dog groomer', 'animal', 'services', ['pet groomer']],
  ['Hairdresser', 'beauty', 'services', ['hairstylist', 'hair stylist', 'barber']],
  ['Personal trainer', 'fitness', 'services', ['fitness trainer']],
  ['Funeral director', 'service', 'services', ['mortician', 'undertaker']],
  ['Professional athlete', 'sport', 'sport', ['athlete']],
  ['Scuba instructor', 'sport', 'sport', ['diving instructor']],
].map(([name, family, field, aliases]) => ({name, family, field, aliases}));
export function findProfession(value) {
  const query = normalize(value);
  return PROFESSIONS.find(p => normalize(p.name) === query || p.aliases.some(a => normalize(a) === query));
}
export function searchProfessions(value) {
  const query = normalize(value);
  if (!query) return [];
  return PROFESSIONS.filter(p => normalize(p.name).includes(query) || p.aliases.some(a => normalize(a).includes(query)))
    .sort((a, b) => Number(normalize(b.name).startsWith(query)) - Number(normalize(a.name).startsWith(query)))
    .slice(0, 6);
}
export function consolationFor(guesses, answer = 'Foley artist') {
  const target = findProfession(answer);
  if (!target) return 0;
  return Math.max(0, ...guesses.map(name => {
    const p = findProfession(name);
    return p?.family === target.family ? 1000 : p?.field === target.field ? 500 : 0;
  }));
}
export function validSavedGame(value, answer = 'Foley artist') {
  return !!value && Number.isInteger(value.clues) && value.clues >= 1 && value.clues <= 8 &&
    Array.isArray(value.guesses) && value.guesses.length <= 3 && new Set(value.guesses).size === value.guesses.length &&
    value.guesses.every(name => findProfession(name)?.name === name) &&
    ['playing', 'won', 'lost', 'gaveup'].includes(value.status) &&
    (value.status !== 'won' || value.guesses.at(-1) === answer) &&
    (value.status !== 'playing' || (value.guesses.length < 3 && !value.guesses.includes(answer))) &&
    (value.status !== 'lost' || (value.guesses.length === 3 && !value.guesses.includes(answer))) &&
    (value.status !== 'gaveup' || !value.guesses.includes(answer));
}
export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
export function plural(count, word) { return `${count} ${count === 1 ? word : /(s|x|ch|sh)$/.test(word) ? `${word}es` : `${word}s`}`; }
export function shareSummary({number, clues, guesses, status, practice = false, score, answer, url}) {
  const outcome = status === 'won' ? `${score.toLocaleString('en-US')} / 10,000` : `${score.toLocaleString('en-US')} pts · ${status === 'gaveup' ? 'Revealed' : 'Unsolved'}`;
  const clueRow = Array.from({length:8}, (_, i) => i < clues ? '🟩' : '⬜').join('');
  const guessRow = guesses.map(name => name === answer ? '✅' : '❌').join('') || '—';
  return [`Offclock #${number}${practice ? ' · Practice' : ''}`, outcome, `Clues ${clueRow}`, `Guesses ${guessRow}`, url].join('\n');
}
