// Compares a recording's transcript with its script so generated narration that skips,
// repeats or invents words is caught before it ships.
const NUMBER_WORDS = new Set(['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety','hundred','hundreds','thousand','half','first','second','third','thirteenth','twentieth']);
// Short words a transcriber may legitimately merge or drop, e.g. "four and a half thousand" → "4,500".
const SLACK_WORDS = new Set(['a','an','the','and','of','to','oh','um','uh']);
const MAX_SLACK = 2;
const MAX_EXTRA = 2;

function tokens(text) {
  return text.toLowerCase().replace(/[’‘]/g, "'").replace(/(\d),(\d)/g, '$1$2').split(/[^a-z0-9']+/)
    // Apostrophes are silent: "day's" and "days" sound identical, so a transcriber can't tell them apart.
    .map(word => word.replace(/'/g, ''))
    .filter(word => word && !/\d/.test(word) && !NUMBER_WORDS.has(word))
    .map(word => word.replace(/ise$/, 'ize').replace(/our/g, 'or').replace(/re$/, 'er'));
}

export function compareScript(expected, heard) {
  const want = tokens(expected), got = tokens(heard);
  // Longest common subsequence keeps word order, so a skipped phrase can't hide behind a later repeat.
  const table = Array.from({length:want.length + 1}, () => new Array(got.length + 1).fill(0));
  for (let i = want.length - 1; i >= 0; i--) for (let j = got.length - 1; j >= 0; j--)
    table[i][j] = want[i] === got[j] ? table[i+1][j+1] + 1 : Math.max(table[i+1][j], table[i][j+1]);
  const missing = [], extra = [];
  let i = 0, j = 0;
  while (i < want.length || j < got.length) {
    if (i < want.length && j < got.length && want[i] === got[j]) { i++; j++; }
    else if (j < got.length && (i === want.length || table[i][j+1] >= table[i+1][j])) extra.push(got[j++]);
    else missing.push(want[i++]);
  }
  const contentMissing = missing.filter(word => !SLACK_WORDS.has(word));
  const ok = contentMissing.length === 0 && missing.length <= MAX_SLACK && extra.filter(word => !SLACK_WORDS.has(word)).length <= MAX_EXTRA;
  return {ok, missing, extra};
}
