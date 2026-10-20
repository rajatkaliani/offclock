import {VOICE_SETTINGS} from './voice-settings.mjs';
export const CLUE_TITLES = ['First impression', 'The morning', 'Misconceptions', 'My tools', 'My workplace', 'The challenge', 'A work story', 'The giveaway'];
export const CLUE_LABELS = ['A FIRST IMPRESSION', 'HOW MY MORNING STARTS', 'WHAT PEOPLE GET WRONG', 'SOMETHING I USE', 'WHERE YOU’LL FIND ME', 'THE HARD PART', 'A STORY FROM MY SHIFT', 'PUTTING IT ALL TOGETHER'];

export const GUESTS = [
  {
    id:'maya', pace:1.0, number:'001', name:'Maya', age:32, location:'London, UK', answer:'Foley artist', voice:'bf_emma',
    teaser:'“Almost nobody knows my name.”', color:'#dce4cb',
    reveal:'The sound of cinema.', description:'Maya performs everyday sounds for film and television, matching each movement on screen.',
    connection:'The shoes were for footsteps. The vegetables? Movie fight scenes. The quiet room, the microphone, and the timing all pointed to Foley.',
    clues:[
      "You’ve probably heard something I’ve worked on. You wouldn’t recognise me, though. Most of the time, you’re not meant to notice what I do.",
      "I usually start in a really quiet room. I’ll get everything set up, have a look at what we’re working on, then spend the day making noise.",
      "People always ask if it’s all done on a computer now. Some of it is, but honestly, doing it by hand often sounds much more believable.",
      "I’ve got far too many pairs of shoes. Not nice ones, either. It’s more about the soles. Each pair sounds a bit different when you walk.",
      "There’s a screen in front of me and a microphone nearby. Then there’s gravel, wood, sand, all sorts of things on the floor. It looks quite odd.",
      "Getting the sound right is only half of it. The timing has to be right as well, even when I’m using something completely different to make the noise.",
      "Yesterday I was snapping vegetables for a fight scene. Then I changed shoes and walked back and forth for about an hour. That’s a fairly normal day.",
      "So, the footsteps and little rustles you hear in a film? I perform those sounds while watching the scene, and we record them to match the picture."
    ],
  },
  {
    id:'jonah', pace:1.0, number:'002', name:'Jonah', age:46, location:'Bristol, UK', answer:'Watchmaker', voice:'bm_george',
    teaser:'“Small things carry a lot of history.”', color:'#d7dce4',
    reveal:'A little more time.', description:'Jonah repairs and services mechanical watches, giving treasured objects another chapter.',
    connection:'The magnifier, the tiny screws, and the patient search for one worn part all belonged to the inside of a mechanical watch.',
    clues:[
      "A lot of what people bring me belonged to someone else first. Their dad, maybe, or their grandad. So it’s not really about what the thing’s worth.",
      "First thing I do is clear the bench. I know that sounds a bit fussy, but when the parts are this small, you really do need to.",
      "People think I spend all day making new things. Most days I’m just trying to work out why something old isn’t doing what it should.",
      "I’ve got a pair of very fine tweezers, and a little magnifier I wear over one eye. You get used to working like that after a while.",
      "There’s a pale mat on my bench, with little trays for all the parts. If I drop a screw, that’s it. I’m on the floor looking for it.",
      "You can replace a broken bit and still have the same problem. Usually there’s something else wearing out, so I have to keep looking.",
      "Someone brought in their father’s old one last week. He’d worn it for forty years. Hearing it tick again after I’d serviced it was lovely, actually.",
      "I repair mechanical watches. I take the movement apart, clean it, oil it, and replace anything worn. Then I check how well it’s keeping time."
    ],
  },
  {
    id:'inez', pace:1.03, number:'003', name:'Inez', age:35, location:'Denver, USA', answer:'Air traffic controller', voice:'af_bella',
    teaser:'“I stay still. Everyone else moves.”', color:'#ecd8ca',
    reveal:'The calm in the headset.', description:'Inez coordinates aircraft movements and communicates with pilots to keep traffic safely separated.',
    connection:'The handover, the precise radio calls, and the moving aircraft on her display pointed to air traffic control.',
    clues:[
      "I don’t move around much during a shift. But the people I’m talking to? By the time I go home, they could be hundreds of miles away.",
      "There’s always a handover first. I need to know what’s going on, what the weather’s doing, and whether anything’s likely to change while I’m working.",
      "People sometimes hear my voice and think it must be pretty quiet. I’m just keeping it calm. There can be a lot going on at once.",
      "My headset’s probably the most important thing I use. I keep what I say short and clear, then I listen carefully to what comes back.",
      "I’ve got a display with moving symbols on it. Each one has information I’m following, but I can’t let one thing take all my attention.",
      "You’re always thinking a few minutes ahead. Where’s everyone going to be? What happens if the weather changes? You can’t just deal with what’s in front of you.",
      "We had a storm moving through today. We coordinated some route changes, and I was talking to pilots as they worked their way around it.",
      "I’m an air traffic controller. I talk to pilots and coordinate aircraft movements, helping keep the planes safely separated in the airspace I’m responsible for."
    ],
  },
  {
    id:'theo', pace:1.04, number:'004', name:'Theo', age:29, location:'Devon, UK', answer:'Beekeeper', voice:'bm_fable',
    teaser:'“My colleagues don’t know my name.”', color:'#e4e6c8',
    reveal:'A very busy little world.', description:'Theo cares for honey bee colonies, checking their health and managing hives through the seasons.',
    connection:'The veil, the smoker, and the removable frames were beekeeping tools. The healthy queen and brood were clues to the colony inside.',
    clues:[
      "I spend a lot of time checking on the same group. They don’t know who I am, obviously, but I’ve got to know when something’s wrong.",
      "I check the weather before I make any plans. If it’s cold and wet, I might leave things alone. A warm, calm day is much easier.",
      "Everyone asks about the sweet stuff. And yeah, that’s part of it. But mostly I’m trying to keep a whole little community healthy through the year.",
      "I’ve usually got my veil, a flat metal tool, and a smoker with me. You learn quite quickly that moving slowly is better than rushing in.",
      "It’s all outdoors, beside these rows of wooden boxes. You can lift frames out of them and get a proper look at what’s happening inside.",
      "I’m checking they’ve got enough food, looking for disease, and making sure the queen’s laying. You can’t really tell all that from standing outside the box.",
      "I lifted a frame today and found healthy brood, which was good to see. When we harvest honey later on, we’ll leave enough stores for the colony.",
      "I’m a beekeeper. I look after honey bee colonies, check their hives, and help keep them healthy. And when there’s enough, I harvest some of the honey."
    ],
  },
  {
    id:'nadia', pace:1.03, number:'005', name:'Nadia', age:38, location:'Chicago, USA', answer:'Food stylist', voice:'af_heart',
    teaser:'“It has to look good for one moment.”', color:'#ead5db',
    reveal:'Good enough to look at.', description:'Nadia prepares and arranges food for photographs, advertising, and film, helping every detail look its best on camera.',
    connection:'The duplicate ingredients, the tweezers, and the careful sesame seeds were for the camera. Her finished plate was the subject of the photograph.',
    clues:[
      "My work might make you hungry. But I hardly ever sit down and eat the finished thing with anyone. That’s just not really what I’m there for.",
      "I’ll go shopping and buy twenty of the same thing. It looks ridiculous, but I might only find one that’s the right shape or the right color.",
      "People say, well, doesn’t it just need to taste good? Sure, but the people seeing my work can’t taste it. They’ve only got the picture.",
      "I keep tweezers next to my chopping board. Sometimes I’ll spend ten minutes moving one little leaf around. It’s a very particular kind of patience.",
      "There’s usually a camera right beside me. The lights get warm, too, so anything that melts is a bit of a race against the clock.",
      "You can make something look beautiful on a plate, then look through the lens and it just doesn’t work. I’m always checking what the camera sees.",
      "We were shooting a burger today. We went through a few buns, moved all the layers around, even adjusted some sesame seeds before the photographer was happy.",
      "I’m a food stylist. I prepare and arrange food for the camera, for things like adverts and cookbooks. My job is to make the dish look its best."
    ],
  },
  {
    id:'kenji', pace:1.01, number:'006', name:'Kenji', age:52, location:'Seattle, USA', answer:'Forensic scientist', voice:'am_michael',
    teaser:'“A small detail can change the story.”', color:'#d4dfe1',
    reveal:'What the evidence can tell us.', description:'Kenji examines physical evidence, documents his findings, and explains what the results can and cannot establish.',
    connection:'The sealed samples, contamination controls, microscopic fibres, and reports were the careful work of a forensic scientist.',
    clues:[
      "Sometimes it’s one tiny detail that changes how you understand the whole thing. So I’d rather take a little longer and be sure of what I’m seeing.",
      "Before I start, I check the labels, the seals, all the paperwork. I need to know where a sample’s been and who’s handled it before me.",
      "It’s nothing like it looks on TV, honestly. There’s a lot more checking and waiting. And sometimes the answer really is, we don’t know yet.",
      "The microscope gets all the attention, but clean gloves and separate containers matter just as much. I can’t risk one sample coming into contact with another.",
      "Most of my day’s in a lab, looking at things collected somewhere else. We keep the space controlled so we’re not accidentally adding anything to the samples.",
      "Two things can look alike without coming from the same place. I have to be really clear about that, especially when someone wants a definite answer.",
      "Today I was comparing tiny fibers from two samples. I recorded what I found and wrote it up. That report might end up being discussed in court.",
      "I’m a forensic scientist. I examine physical evidence for investigations, document what I find, and sometimes explain the results, and their limits, in court."
    ],
  },
].map(guest => ({...guest, portrait:`assets/${guest.id}.webp`, clips:guest.clues.map((text,index) => ({text,label:CLUE_LABELS[index],audio:`assets/audio/${VOICE_SETTINGS.revision}/${guest.id}-${index+1}.mp3`}))}));

export function getGuest(id) { return GUESTS.find(guest => guest.id === id) || GUESTS[0]; }
export function gameKey(id) { return id === 'maya' ? 'offclock:edition-001:v1' : `offclock:guest-${id}:v1`; }
export function getTheme(saved, prefersDark = false) { return ['light','dark'].includes(saved) ? saved : prefersDark ? 'dark' : 'light'; }
export function nextGuest(currentId, finishedNumbers) {
  const start = GUESTS.findIndex(guest => guest.id === currentId);
  for (let step = 1; step < GUESTS.length; step++) {
    const candidate = GUESTS[(start + step) % GUESTS.length];
    if (!finishedNumbers.includes(candidate.number)) return candidate;
  }
  return null;
}
