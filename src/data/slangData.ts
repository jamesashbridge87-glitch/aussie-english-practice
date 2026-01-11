export interface SlangTerm {
  id: string;
  term: string;
  meaning: string;
  example: string;
  category: SlangCategory;
}

export type SlangCategory =
  | 'greetings'
  | 'expressions'
  | 'time'
  | 'places'
  | 'people'
  | 'food'
  | 'actions'
  | 'descriptive';

export const categoryNames: Record<SlangCategory, string> = {
  greetings: 'Greetings',
  expressions: 'Expressions',
  time: 'Time',
  places: 'Places',
  people: 'People',
  food: 'Food & Drink',
  actions: 'Actions',
  descriptive: 'Descriptive',
};

export const slangData: SlangTerm[] = [
  // Greetings & Common Expressions
  {
    id: 'gday',
    term: "G'day",
    meaning: 'Hello / Good day',
    example: "G'day mate, how ya going?",
    category: 'greetings',
  },
  {
    id: 'howya-going',
    term: 'How ya going?',
    meaning: 'How are you?',
    example: 'Hey Sarah, how ya going?',
    category: 'greetings',
  },
  {
    id: 'no-worries',
    term: 'No worries',
    meaning: "No problem / You're welcome",
    example: 'Thanks for the lift! — No worries, mate.',
    category: 'expressions',
  },
  {
    id: 'shes-right',
    term: "She'll be right",
    meaning: 'Everything will be okay',
    example: "Don't stress about the exam, she'll be right.",
    category: 'expressions',
  },
  {
    id: 'too-easy',
    term: 'Too easy',
    meaning: 'No problem / Consider it done',
    example: 'Can you grab me a coffee? — Too easy!',
    category: 'expressions',
  },

  // Time & Place
  {
    id: 'arvo',
    term: 'Arvo',
    meaning: 'Afternoon',
    example: "I'll see you this arvo at the pub.",
    category: 'time',
  },
  {
    id: 'reckon',
    term: 'Reckon',
    meaning: 'Think / Believe',
    example: "I reckon it's gonna rain today.",
    category: 'expressions',
  },
  {
    id: 'servo',
    term: 'Servo',
    meaning: 'Service station / Gas station',
    example: 'Pull into the servo, we need petrol.',
    category: 'places',
  },
  {
    id: 'bottle-o',
    term: 'Bottle-o',
    meaning: 'Liquor store',
    example: "I'll grab some beers from the bottle-o.",
    category: 'places',
  },
  {
    id: 'maccas',
    term: 'Maccas',
    meaning: "McDonald's",
    example: "Let's hit up Maccas for a feed.",
    category: 'places',
  },

  // People
  {
    id: 'mate',
    term: 'Mate',
    meaning: 'Friend / Buddy (or anyone really)',
    example: "Thanks mate, you're a legend.",
    category: 'people',
  },
  {
    id: 'bloke',
    term: 'Bloke',
    meaning: 'Man / Guy',
    example: "He's a good bloke, you'll like him.",
    category: 'people',
  },
  {
    id: 'sheila',
    term: 'Sheila',
    meaning: 'Woman (somewhat old-fashioned)',
    example: "Who's that sheila over there?",
    category: 'people',
  },
  {
    id: 'legend',
    term: 'Legend',
    meaning: 'Great person / Someone awesome',
    example: "You fixed my car? You're an absolute legend!",
    category: 'people',
  },
  {
    id: 'bogan',
    term: 'Bogan',
    meaning: 'Uncultured person (similar to redneck)',
    example: 'Check out the mullet on that bogan.',
    category: 'people',
  },

  // Food & Drink
  {
    id: 'snag',
    term: 'Snag',
    meaning: 'Sausage',
    example: 'Chuck a few snags on the barbie.',
    category: 'food',
  },
  {
    id: 'barbie',
    term: 'Barbie',
    meaning: 'Barbecue',
    example: "We're having a barbie this Saturday.",
    category: 'food',
  },
  {
    id: 'coldie',
    term: 'Coldie',
    meaning: 'Cold beer',
    example: 'Grab us a coldie from the esky.',
    category: 'food',
  },
  {
    id: 'esky',
    term: 'Esky',
    meaning: 'Cooler / Ice box',
    example: 'The drinks are in the esky.',
    category: 'food',
  },
  {
    id: 'brekkie',
    term: 'Brekkie',
    meaning: 'Breakfast',
    example: "Let's meet for brekkie at 9.",
    category: 'food',
  },
  {
    id: 'sanga',
    term: 'Sanga',
    meaning: 'Sandwich',
    example: 'I made a vegemite sanga for lunch.',
    category: 'food',
  },
  {
    id: 'chook',
    term: 'Chook',
    meaning: 'Chicken',
    example: "I'll pick up a roast chook for dinner.",
    category: 'food',
  },

  // Actions & States
  {
    id: 'chuck',
    term: 'Chuck',
    meaning: 'Throw / Put',
    example: 'Chuck your bag in the back.',
    category: 'actions',
  },
  {
    id: 'flat-out',
    term: 'Flat out',
    meaning: 'Very busy / At maximum speed',
    example: "I've been flat out at work all week.",
    category: 'actions',
  },
  {
    id: 'knackered',
    term: 'Knackered',
    meaning: 'Exhausted / Very tired',
    example: "I'm absolutely knackered after that hike.",
    category: 'actions',
  },
  {
    id: 'stoked',
    term: 'Stoked',
    meaning: 'Very happy / Excited',
    example: "I'm stoked about the concert next week!",
    category: 'actions',
  },
  {
    id: 'stuffed',
    term: 'Stuffed',
    meaning: 'Broken / Exhausted / Full from eating',
    example: "The TV's stuffed, we need a new one.",
    category: 'actions',
  },
  {
    id: 'spit-the-dummy',
    term: 'Spit the dummy',
    meaning: 'Throw a tantrum / Get very upset',
    example: 'He spat the dummy when they cancelled his flight.',
    category: 'actions',
  },

  // Descriptive
  {
    id: 'heaps',
    term: 'Heaps',
    meaning: 'A lot / Very',
    example: 'That movie was heaps good!',
    category: 'descriptive',
  },
  {
    id: 'dodgy',
    term: 'Dodgy',
    meaning: 'Suspicious / Poor quality',
    example: 'That kebab shop looks a bit dodgy.',
    category: 'descriptive',
  },
  {
    id: 'bonkers',
    term: 'Bonkers',
    meaning: 'Crazy / Insane',
    example: 'The traffic today was absolutely bonkers.',
    category: 'descriptive',
  },
  {
    id: 'ripper',
    term: 'Ripper',
    meaning: 'Excellent / Fantastic',
    example: 'That was a ripper of a game!',
    category: 'descriptive',
  },
  {
    id: 'bloody',
    term: 'Bloody',
    meaning: 'Very (intensifier, mild expletive)',
    example: "It's bloody hot today!",
    category: 'descriptive',
  },
  {
    id: 'fair-dinkum',
    term: 'Fair dinkum',
    meaning: 'Genuine / True / Really?',
    example: "Fair dinkum? I can't believe he said that!",
    category: 'descriptive',
  },

  // Colorful Expressions
  {
    id: 'crack-a-tinnie',
    term: 'Crack a tinnie',
    meaning: 'Open a can of beer',
    example: "Let's crack a tinnie and watch the footy.",
    category: 'expressions',
  },
  {
    id: 'skull',
    term: 'Skull',
    meaning: 'Drink quickly in one go',
    example: 'He skulled his beer in 10 seconds.',
    category: 'actions',
  },
  {
    id: 'pissed',
    term: 'Pissed',
    meaning: 'Drunk (not angry like in US)',
    example: 'He got absolutely pissed at the party.',
    category: 'descriptive',
  },
  {
    id: 'smoko',
    term: 'Smoko',
    meaning: 'Smoke break / Short work break',
    example: "I'll finish this after smoko.",
    category: 'time',
  },
  {
    id: 'sickie',
    term: 'Sickie',
    meaning: 'Taking a sick day (often when not actually sick)',
    example: "I'm chucking a sickie tomorrow for the beach.",
    category: 'actions',
  },
  {
    id: 'woop-woop',
    term: 'Woop Woop',
    meaning: 'Middle of nowhere / Remote area',
    example: 'They live out in Woop Woop, hours from the city.',
    category: 'places',
  },
];

export const categories = [...new Set(slangData.map((item) => item.category))] as SlangCategory[];
