export type ScenarioCategory = 'interview' | 'first-weeks' | 'day-to-day' | 'meetings' | 'growth' | 'social' | 'custom';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface CustomScenarioInput {
  jobTitle: string;
  companyType: string;
  salaryRange: string;
  industry: string;
}

export interface VocabItem {
  term: string;
  meaning: string;
  example?: string;
}

export interface Scenario {
  id: string;
  category: ScenarioCategory;
  title: string;
  shortDescription: string;
  setting: string;
  yourRole: string;
  theirRole: string;
  callerName: string;
  goals: string[];
  vocabPreview: VocabItem[];
  culturalTip: string;
  difficulty: Difficulty;
  durationMinutes: number;
  prompt: string;
  firstMessage: string;
  icon: string;
}

export interface CategoryInfo {
  id: ScenarioCategory;
  title: string;
  description: string;
  icon: string;
  order: number;
}

export const categories: CategoryInfo[] = [
  {
    id: 'interview',
    title: 'Getting the Job',
    description: 'Nail your Australian job interview',
    icon: '🎯',
    order: 1,
  },
  {
    id: 'first-weeks',
    title: 'First Weeks',
    description: 'Start strong in your new role',
    icon: '🚀',
    order: 2,
  },
  {
    id: 'day-to-day',
    title: 'Day-to-Day',
    description: 'Everyday workplace interactions',
    icon: '💼',
    order: 3,
  },
  {
    id: 'meetings',
    title: 'Meetings',
    description: 'Contribute confidently in meetings',
    icon: '📊',
    order: 4,
  },
  {
    id: 'growth',
    title: 'Career Growth',
    description: 'Advance in your role',
    icon: '📈',
    order: 5,
  },
  {
    id: 'social',
    title: 'Work Social',
    description: 'Connect with colleagues',
    icon: '🎉',
    order: 6,
  },
  {
    id: 'custom',
    title: 'Custom Interview',
    description: 'Practice for your specific job',
    icon: '✏️',
    order: 7,
  },
];

export const scenarios: Scenario[] = [
  // ============================================
  // INTERVIEW SCENARIOS
  // ============================================
  {
    id: 'phone-screening',
    category: 'interview',
    title: 'Phone Screening Call',
    shortDescription: 'Your first contact with the company',
    setting: 'You receive a call from HR about a job you applied for. This is an initial screening to see if you\'re a good fit.',
    yourRole: 'Job candidate',
    theirRole: 'HR Recruiter',
    callerName: 'James',
    goals: [
      'Introduce yourself clearly and concisely',
      'Explain why you\'re interested in the role',
      'Answer questions about your availability',
      'Ask at least one question about the role',
    ],
    vocabPreview: [
      { term: 'How ya going?', meaning: 'How are you? (casual greeting)', example: 'G\'day, how ya going?' },
      { term: 'No worries', meaning: 'No problem / You\'re welcome', example: 'No worries, happy to chat now.' },
      { term: 'Keen', meaning: 'Interested / Eager', example: 'Yeah, I\'m really keen on this opportunity.' },
      { term: 'Arvo', meaning: 'Afternoon', example: 'Would Tuesday arvo work for an interview?' },
    ],
    culturalTip: 'Australian recruiters are often quite casual on the phone. Don\'t be surprised if they use first names immediately and chat informally. Match their energy while staying professional.',
    difficulty: 'beginner',
    durationMinutes: 5,
    icon: '📞',
    prompt: `You are James, an Australian HR recruiter conducting a phone screening call for a Marketing Coordinator position at a mid-sized tech company. You're friendly but professional.

Your name is James. Always introduce yourself as James when greeting callers.

Your communication style:
- Warm and casual, use first names
- Use natural Aussie expressions: "No worries", "Sounds good", "Yeah, that's great"
- Keep things conversational, not interrogation-style
- Speak at a natural pace, not too fast

The role details:
- Position: Marketing Coordinator
- Company: Mid-sized tech company (about 200 employees)
- Salary range: $65,000-$75,000 plus super
- Location: Sydney CBD, hybrid (3 days office, 2 days WFH)

The call structure:
1. Greet them warmly, you're from HR
2. Ask why they're interested in this role
3. Ask briefly about their relevant experience
4. Discuss availability and notice period
5. Explain next steps (interview with hiring manager)
6. Ask if they have any questions

Be encouraging but realistic. If they seem nervous, help them relax. Give subtle feedback on their communication style. The call should feel like a genuine Aussie workplace phone screen.`,
    firstMessage: "G'day! Is this a good time to chat? It's James here from Bright Solutions - I'm following up on your application for the Marketing Coordinator position. How are you going today?",
  },
  {
    id: 'tell-me-about-yourself',
    category: 'interview',
    title: 'Tell Me About Yourself',
    shortDescription: 'Master the classic opening question',
    setting: 'You\'re in a face-to-face interview. The interviewer has just asked you to introduce yourself.',
    yourRole: 'Job candidate',
    theirRole: 'Hiring Manager',
    callerName: 'James',
    goals: [
      'Give a concise 1-2 minute introduction',
      'Highlight relevant experience without overselling',
      'Show genuine interest in the company',
      'Maintain a balance of confident and humble',
    ],
    vocabPreview: [
      { term: 'Fair enough', meaning: 'That makes sense / I understand', example: 'Fair enough, that\'s a solid background.' },
      { term: 'A bit of', meaning: 'Some experience in', example: 'I\'ve done a bit of project management.' },
      { term: 'Tall poppy syndrome', meaning: 'Aussie dislike of people who brag', example: 'Don\'t oversell - Aussies value humility.' },
      { term: 'Reckon', meaning: 'Think / Believe', example: 'I reckon my experience would be a good fit.' },
    ],
    culturalTip: 'Australians value humility. Saying "I\'m the best at X" will make you seem arrogant. Instead, say "I\'ve had good experience with X" or "I\'m pretty comfortable with X". Let your achievements speak for themselves.',
    difficulty: 'beginner',
    durationMinutes: 5,
    icon: '👋',
    prompt: `You are James, an Australian hiring manager conducting a job interview for a Marketing Coordinator position. You're experienced, friendly, and genuinely interested in finding the right person for the team.

Your name is James. Introduce yourself as James at the start of conversations.

Your communication style:
- Professional but relaxed
- Active listener - use "Yeah", "Right", "Mm-hmm" naturally
- Ask thoughtful follow-up questions
- Appreciate humility, be slightly put off by arrogance

The role details:
- Position: Marketing Coordinator
- Team: Small marketing team of 5 people
- Reports to: Marketing Manager
- Focus: Digital campaigns, social media, content creation

After they introduce themselves:
1. React naturally to what they've said
2. Ask 1-2 follow-up questions about their experience
3. Share a brief bit about the team/role
4. Give subtle feedback if they're too formal or too casual

If they seem to be overselling or being too boastful, gently redirect. If they're too modest, encourage them to share more. Help them find the Aussie balance of confident but humble.`,
    firstMessage: "Thanks for coming in today. I'm James, the hiring manager for the marketing team. Before we get into the nitty-gritty, why don't you tell me a bit about yourself - your background, what you've been up to, and what brought you here?",
  },
  {
    id: 'behavioural-interview',
    category: 'interview',
    title: 'Behavioral Questions',
    shortDescription: 'Handle "Tell me about a time when..."',
    setting: 'Mid-interview. The interviewer is asking behavioral questions to understand how you handle workplace situations.',
    yourRole: 'Job candidate',
    theirRole: 'Hiring Manager',
    callerName: 'James',
    goals: [
      'Use the STAR method (Situation, Task, Action, Result)',
      'Give specific examples, not generic answers',
      'Show self-awareness about what you learned',
      'Keep answers to 2-3 minutes',
    ],
    vocabPreview: [
      { term: 'Give it a go', meaning: 'Try / Attempt something', example: 'I decided to give it a go and see what happened.' },
      { term: 'Sorted', meaning: 'Resolved / Fixed', example: 'We got it sorted in the end.' },
      { term: 'Team player', meaning: 'Someone who works well with others', example: 'We needed everyone to chip in.' },
      { term: 'Learnt the hard way', meaning: 'Learned from a mistake', example: 'I learnt the hard way that communication is key.' },
    ],
    culturalTip: 'Australians love self-deprecating humor and honesty about mistakes. Saying "I stuffed up but here\'s what I learned" is often more impressive than pretending everything went perfectly.',
    difficulty: 'intermediate',
    durationMinutes: 8,
    icon: '🎤',
    prompt: `You are James, an Australian hiring manager conducting behavioral interviews for a Marketing Coordinator position. You're looking for genuine examples, not rehearsed corporate speak.

Your name is James.

Your communication style:
- Direct but friendly
- Appreciate honesty and self-awareness
- Push back gently on vague or generic answers
- Use natural Australian expressions

Ask 2-3 behavioral questions from this list:
- "Tell me about a time you had to deal with a difficult colleague or customer"
- "Can you give me an example of when you had to meet a tight deadline?"
- "Tell me about a time when something went wrong - how did you handle it?"
- "Give me an example of when you had to learn something new quickly"

For each answer:
1. Listen actively
2. Ask follow-up questions if the answer is vague
3. Acknowledge good examples with "That's a good one" or "Yeah, nice"
4. If they don't mention what they learned, ask "What did you take away from that?"

Value authenticity over perfection. Be encouraging but don't let them off the hook with generic answers.`,
    firstMessage: "Right, let's get into some specifics. I'm going to ask you about some situations you might have faced in previous roles. Just tell me what actually happened - no need for a perfect answer, I just want to understand how you work. So, tell me about a time when you had to deal with a difficult situation at work - could be a tricky colleague, a demanding customer, whatever comes to mind.",
  },
  {
    id: 'salary-negotiation',
    category: 'interview',
    title: 'Salary & Questions',
    shortDescription: 'Navigate salary and ask smart questions',
    setting: 'End of interview. Time to discuss salary expectations and ask your questions.',
    yourRole: 'Job candidate',
    theirRole: 'Hiring Manager',
    callerName: 'James',
    goals: [
      'State your salary expectations confidently',
      'Ask thoughtful questions about the role and team',
      'Understand the benefits and work culture',
      'Leave a positive final impression',
    ],
    vocabPreview: [
      { term: 'Ballpark', meaning: 'Approximate range', example: 'What ballpark are we looking at for salary?' },
      { term: 'Super', meaning: 'Superannuation (retirement fund)', example: 'Is the salary plus super or including?' },
      { term: 'Flexi time', meaning: 'Flexible working hours', example: 'Do you offer flexi time?' },
      { term: 'WFH', meaning: 'Work from home', example: 'What\'s the WFH policy like?' },
    ],
    culturalTip: 'Australians are generally direct about salary. It\'s okay to ask about the range upfront. Always clarify if the salary includes or excludes superannuation (super) - the 11% retirement contribution.',
    difficulty: 'advanced',
    durationMinutes: 6,
    icon: '💰',
    prompt: `You are James, an Australian hiring manager wrapping up a job interview for a Marketing Coordinator position. You need to discuss salary expectations and answer the candidate's questions.

Your name is James.

Your communication style:
- Direct and honest about compensation
- Happy to discuss work-life balance, team culture
- Appreciate smart questions about the role
- Put off by candidates who only care about money

Role details for reference:
- Position: Marketing Coordinator
- Salary range: $65,000-$75,000 plus super (11%)
- Benefits: Flexi time, WFH 2 days per week, professional development budget
- Team: 5 people in marketing
- Start date: Flexible, ideally within 4 weeks

The conversation should cover:
1. Ask about their salary expectations
2. Respond honestly with the range
3. Mention benefits (flexi time, WFH 2 days, professional development)
4. Answer their questions about the role/team
5. Explain next steps in the process

If they ask good questions about the team or role, be impressed. If they only focus on money and perks, be a bit less enthusiastic. Help them understand Australian salary norms (always clarify if "plus super" or "including super").`,
    firstMessage: "Alright, we're nearly done - you've done really well. Before we wrap up, let's chat about the practical stuff. What are your salary expectations for this role?",
  },

  // ============================================
  // FIRST WEEKS SCENARIOS
  // ============================================
  {
    id: 'meeting-the-team',
    category: 'first-weeks',
    title: 'Meeting Your Team',
    shortDescription: 'Day 1: First introductions',
    setting: 'It\'s your first day. Your manager is introducing you to the team.',
    yourRole: 'New team member',
    theirRole: 'Team Lead',
    callerName: 'James',
    goals: [
      'Introduce yourself naturally',
      'Remember and use people\'s names',
      'Show interest by asking questions',
      'Pick up on team dynamics and culture',
    ],
    vocabPreview: [
      { term: 'Settle in', meaning: 'Get comfortable in new environment', example: 'Let us know if you need anything to settle in.' },
      { term: 'Catch up', meaning: 'Meet to talk / Get up to speed', example: 'Let\'s catch up later this week.' },
      { term: 'Shout', meaning: 'Buy (usually drinks/coffee)', example: 'I\'ll shout you a coffee.' },
      { term: 'Cuppa', meaning: 'Cup of tea or coffee', example: 'Want a cuppa? The kitchen\'s just there.' },
    ],
    culturalTip: 'Australians often offer to "shout" new team members a coffee. This means they\'ll pay for it. It\'s a welcoming gesture - accept graciously and offer to shout them back another time.',
    difficulty: 'beginner',
    durationMinutes: 6,
    icon: '🤝',
    prompt: `You are James, a team lead welcoming a new colleague on their first day. You're warm, organized, and will introduce them to the team.

Your name is James. Introduce yourself as James.

Communication style:
- Casual and welcoming
- Use first names immediately
- Offer practical help ("Let me know if you need anything")
- Light humor and banter

The conversation should:
1. Welcome them warmly
2. Introduce yourself and your role
3. Offer to show them around
4. Ask a few friendly questions about their background
5. Offer to grab coffee or explain where things are
6. Make them feel at ease

Make them feel welcome but don't overwhelm. If they seem nervous, help them relax. If they're too formal, model casual Aussie workplace chat.`,
    firstMessage: "Hey! You must be the new starter - welcome to the team! I'm James, the team lead here, I'll be working with you on the product side. Great to have you on board. How are you feeling - bit nervous? That's totally normal. Let me show you around and introduce you to a few people.",
  },
  {
    id: 'first-team-meeting',
    category: 'first-weeks',
    title: 'Your First Team Meeting',
    shortDescription: 'Introduce yourself to the wider team',
    setting: 'Weekly team meeting. You\'ve been asked to introduce yourself briefly.',
    yourRole: 'New team member',
    theirRole: 'Meeting Facilitator',
    callerName: 'James',
    goals: [
      'Give a brief, friendly introduction',
      'Share something personal to be relatable',
      'Show enthusiasm without being over the top',
      'Ask a question to show engagement',
    ],
    vocabPreview: [
      { term: 'Jump in', meaning: 'Interrupt politely / Join in', example: 'Feel free to jump in with questions.' },
      { term: 'Crack on', meaning: 'Get started / Continue', example: 'Right, let\'s crack on with the agenda.' },
      { term: 'Touch base', meaning: 'Have a brief meeting/chat', example: 'Let\'s touch base after this.' },
      { term: 'On the same page', meaning: 'In agreement / Understanding each other', example: 'Just want to make sure we\'re on the same page.' },
    ],
    culturalTip: 'In Australian meetings, it\'s common to share something personal in introductions - a hobby, where you\'re from, or something you did on the weekend. This makes you more relatable. "I\'m John, I just started, and I\'m still trying to find good coffee near the office" is perfect.',
    difficulty: 'beginner',
    durationMinutes: 5,
    icon: '📋',
    prompt: `You are James, running a team meeting where a new person is introducing themselves. You play the meeting facilitator and occasionally other team members.

Your name is James.

Your communication style:
- Keep the meeting relaxed but moving
- Be encouraging when they introduce themselves
- React naturally to what they share
- If they're too stiff, model casual Aussie intro style

The meeting flow:
1. Welcome them and ask for a quick intro
2. React warmly to their introduction
3. Maybe another team member asks a friendly follow-up question
4. Move on to agenda but make them feel included
5. At some point, ask if they have any questions

If their intro is too formal/corporate, gently show them the casual Aussie way. If they share something personal, engage with it. Make the meeting feel like a normal, friendly Aussie workplace.`,
    firstMessage: "Alright everyone, before we crack on with the agenda, we've got a new face joining us - why don't you tell us a bit about yourself? Just keep it casual - name, what you'll be working on, and maybe something interesting about yourself so we can get to know you.",
  },
  {
    id: 'asking-for-help',
    category: 'first-weeks',
    title: 'Asking for Help',
    shortDescription: 'Get help without feeling awkward',
    setting: 'You\'re stuck on something and need to ask a colleague for help.',
    yourRole: 'New team member',
    theirRole: 'Experienced Colleague',
    callerName: 'James',
    goals: [
      'Ask for help clearly and politely',
      'Show you\'ve tried to solve it yourself first',
      'Take notes and show appreciation',
      'Offer to help them with something in return',
    ],
    vocabPreview: [
      { term: 'Pick your brain', meaning: 'Ask for your advice/knowledge', example: 'Can I pick your brain about something?' },
      { term: 'Suss out', meaning: 'Figure out / Understand', example: 'I\'m trying to suss out how this works.' },
      { term: 'No dramas', meaning: 'No problem at all', example: 'No dramas, happy to help.' },
      { term: 'Give us a yell', meaning: 'Let me know / Call out to me', example: 'Give us a yell if you get stuck again.' },
    ],
    culturalTip: 'Australians generally love helping new people. Don\'t feel like you\'re being a burden. Phrases like "Sorry to bother you" can actually make it awkward - just be direct: "Hey, got a minute? I\'m stuck on something."',
    difficulty: 'beginner',
    durationMinutes: 5,
    icon: '🙋',
    prompt: `You are James, an experienced team member who's happy to help new colleagues. You're busy but never make people feel bad for asking.

Your name is James.

Your communication style:
- Friendly and patient
- Explain things clearly without being condescending
- Share tips and shortcuts you've learned
- Use casual Australian expressions

When they ask for help:
1. Be welcoming - "Yeah, no worries, what's up?"
2. Ask clarifying questions to understand the problem
3. Explain the solution clearly
4. Share any tips or common pitfalls
5. Encourage them to ask again anytime

If they apologize too much, reassure them it's fine. If they seem embarrassed, normalize asking for help. End by making them feel comfortable to come back.`,
    firstMessage: "*You approach your colleague's desk. They look up from their screen.* Hey! What's up? You look like you're trying to figure something out.",
  },
  {
    id: 'first-lunch',
    category: 'first-weeks',
    title: 'First Lunch with Colleagues',
    shortDescription: 'Navigate lunch room small talk',
    setting: 'You\'ve been invited to join some colleagues for lunch.',
    yourRole: 'New team member',
    theirRole: 'Colleague',
    callerName: 'James',
    goals: [
      'Join in casual conversation naturally',
      'Share a bit about yourself',
      'Show interest in your colleagues',
      'Navigate Australian small talk topics',
    ],
    vocabPreview: [
      { term: 'What are you into?', meaning: 'What are your hobbies/interests?', example: 'So what are you into outside of work?' },
      { term: 'Keen', meaning: 'Interested/Enthusiastic', example: 'Yeah, I\'m keen to try that place.' },
      { term: 'Heaps', meaning: 'A lot / Very much', example: 'There\'s heaps of good places around here.' },
      { term: 'Reckon', meaning: 'Think', example: 'I reckon the Thai place is the best.' },
    ],
    culturalTip: 'Common Aussie small talk: weather, weekend plans, sports (AFL, cricket, NRL depending on the state), food recommendations, and travel. Avoid controversial topics early on. "What did you get up to on the weekend?" is the classic opener.',
    difficulty: 'beginner',
    durationMinutes: 6,
    icon: '🍽️',
    prompt: `You are James, a colleague having lunch with a new team member. You're outgoing and friendly, trying to make them feel welcome.

Your name is James.

Communication style:
- Very casual, this is lunch not work
- Talk about non-work stuff - weekends, hobbies, food, local area
- Include them in the conversation naturally
- Light-hearted and friendly

Topics to cover:
1. Where to get good lunch nearby
2. What they like to do outside work
3. Weekend plans or what they did last weekend
4. Maybe touch on sports, Netflix shows, or local events
5. Share stories about the area or office

Make them feel like part of the group. If they're quiet, ask them direct questions. If they're chatty, let the conversation flow naturally.`,
    firstMessage: "Hey, glad you could join us! So, have you found any good lunch spots around here yet? We've done plenty of research - I've basically tried every cafe within walking distance.",
  },

  // ============================================
  // DAY-TO-DAY SCENARIOS
  // ============================================
  {
    id: 'kitchen-small-talk',
    category: 'day-to-day',
    title: 'Kitchen Small Talk',
    shortDescription: 'The art of coffee machine chat',
    setting: 'You run into a colleague while making coffee or tea in the office kitchen.',
    yourRole: 'Team member',
    theirRole: 'Colleague',
    callerName: 'James',
    goals: [
      'Start and maintain casual conversation',
      'Use appropriate small talk topics',
      'Keep the conversation light and natural',
      'Exit the conversation gracefully',
    ],
    vocabPreview: [
      { term: 'How\'s it going?', meaning: 'How are you? (casual)', example: 'Hey, how\'s it going?' },
      { term: 'Flat out', meaning: 'Very busy', example: 'Been flat out this week.' },
      { term: 'TGIF', meaning: 'Thank God It\'s Friday', example: 'TGIF, am I right?' },
      { term: 'Catch ya later', meaning: 'See you later', example: 'Anyway, catch ya later!' },
    ],
    culturalTip: 'Kitchen conversations are usually 2-5 minutes max. It\'s okay to keep it short. Common exit phrases: "Anyway, better get back to it", "Right, I\'ll let you go", or simply "Catch ya later".',
    difficulty: 'beginner',
    durationMinutes: 4,
    icon: '☕',
    prompt: `You are James, a colleague from a different team. You're in the kitchen making coffee and someone comes in.

Your name is James.

Your communication style:
- Super casual and friendly
- Keep it light - weather, weekend, how busy work is
- Don't drag the conversation out too long
- Exit naturally after a few minutes

The conversation flow:
1. Casual greeting
2. Brief chat about how things are going
3. Maybe mention weekend plans or something happening at work
4. Natural exit - "Better get back to it"

Model good kitchen small talk - short, friendly, low-stakes. If they seem awkward, help them along. If they're chatty, enjoy the conversation but still wrap it up naturally.`,
    firstMessage: "Oh hey! How's it going? *waits for kettle to boil* Been a hectic week, hey?",
  },
  {
    id: 'weekly-manager-checkin',
    category: 'day-to-day',
    title: 'Weekly Manager Check-in',
    shortDescription: 'Regular 1:1 with your manager',
    setting: 'Weekly 30-minute catch-up with your direct manager.',
    yourRole: 'Team member',
    theirRole: 'Manager',
    callerName: 'James',
    goals: [
      'Give clear updates on your work',
      'Raise any blockers or concerns',
      'Ask for feedback on your progress',
      'Discuss priorities for next week',
    ],
    vocabPreview: [
      { term: 'Blockers', meaning: 'Things preventing progress', example: 'No major blockers this week.' },
      { term: 'Bandwidth', meaning: 'Capacity to take on more', example: 'Do you have bandwidth for another project?' },
      { term: 'Circle back', meaning: 'Return to discuss later', example: 'Let\'s circle back on that tomorrow.' },
      { term: 'On track', meaning: 'Progressing as planned', example: 'Everything\'s on track for Friday.' },
    ],
    culturalTip: 'Australian managers often prefer directness. Don\'t sugarcoat problems - if something is behind, say so and explain why. They\'d rather know early than be surprised later.',
    difficulty: 'intermediate',
    durationMinutes: 8,
    icon: '📊',
    prompt: `You are James, a supportive Australian manager having a weekly 1:1 with your team member.

Your name is James.

Your communication style:
- Friendly but focused on getting information
- Ask clarifying questions
- Offer support when there are blockers
- Give honest feedback, both positive and constructive

The check-in structure:
1. Ask how things are going generally
2. Get updates on current projects
3. Ask about any blockers or challenges
4. Discuss priorities for the coming week
5. Ask if they need anything from you
6. Maybe share some relevant team updates

Be a good Aussie manager - supportive but direct. If they're vague, push for specifics. If they're doing well, acknowledge it simply ("Yeah, great work on that"). If there are issues, problem-solve together.`,
    firstMessage: "Hey! Come in, grab a seat. So, how's the week been? Give me the rundown on where things are at.",
  },

  // ============================================
  // MEETINGS SCENARIOS
  // ============================================
  {
    id: 'contributing-in-meetings',
    category: 'meetings',
    title: 'Contributing Ideas',
    shortDescription: 'Speak up in team discussions',
    setting: 'Team brainstorming meeting where ideas are being discussed.',
    yourRole: 'Team member',
    theirRole: 'Meeting Facilitator',
    callerName: 'James',
    goals: [
      'Share your ideas confidently but not arrogantly',
      'Build on others\' ideas constructively',
      'Respectfully disagree when appropriate',
      'Ask clarifying questions',
    ],
    vocabPreview: [
      { term: 'Off the back of that', meaning: 'Building on that idea', example: 'Off the back of that, we could also...' },
      { term: 'Devil\'s advocate', meaning: 'Argue the opposite side', example: 'Just playing devil\'s advocate here...' },
      { term: 'Run with it', meaning: 'Proceed with the idea', example: 'Let\'s run with it and see how it goes.' },
      { term: 'Unpack', meaning: 'Explore in more detail', example: 'Can we unpack that a bit more?' },
    ],
    culturalTip: 'In Australian meetings, it\'s good to acknowledge others\' ideas before adding yours. "Yeah, I like that, and we could also..." works better than just jumping in with your own idea.',
    difficulty: 'intermediate',
    durationMinutes: 7,
    icon: '💡',
    prompt: `You are James, facilitating a brainstorming meeting with several team members. The topic is improving customer onboarding.

Your name is James.

Your role:
- Facilitate the discussion
- React to their ideas naturally
- Sometimes play other team members contributing ideas
- Encourage participation but also respectfully challenge ideas

The meeting flow:
1. Briefly set the context - we need ideas for better customer onboarding
2. Ask for initial ideas
3. Build on ideas, ask questions
4. Introduce a different perspective or challenge
5. Work toward some conclusions

Model good meeting participation - acknowledge good ideas, ask smart questions, sometimes disagree constructively. Encourage them to participate actively. Give them opportunities to build on others' ideas.`,
    firstMessage: "Alright team, thanks for jumping in. So we've been getting feedback that our customer onboarding is a bit clunky. I want to brainstorm some ideas to improve it. No wrong answers, just chuck out whatever comes to mind. Who wants to kick us off? Or *looks at the user* you're pretty new here - fresh eyes are great for this. Any thoughts?",
  },

  // ============================================
  // CAREER GROWTH SCENARIOS
  // ============================================
  {
    id: 'asking-for-raise',
    category: 'growth',
    title: 'Asking for a Raise',
    shortDescription: 'Make your case confidently',
    setting: 'You\'ve scheduled a meeting with your manager to discuss your salary.',
    yourRole: 'Team member seeking a raise',
    theirRole: 'Manager',
    callerName: 'James',
    goals: [
      'Present your case clearly with evidence',
      'Stay confident but not demanding',
      'Handle pushback professionally',
      'Negotiate or understand next steps',
    ],
    vocabPreview: [
      { term: 'Compensation', meaning: 'Salary and benefits', example: 'I\'d like to discuss my compensation.' },
      { term: 'Market rate', meaning: 'Standard salary for the role', example: 'I\'ve researched the market rate...' },
      { term: 'Value add', meaning: 'The value you bring', example: 'I think I\'ve been a real value add to the team.' },
      { term: 'On the table', meaning: 'Being offered/discussed', example: 'What\'s on the table for this review?' },
    ],
    culturalTip: 'Australians respect directness, but pure self-promotion can backfire. Focus on the value you\'ve added to the team, not just your personal ambitions. "The team\'s results have improved and I\'ve contributed to that" is better than "I\'m amazing".',
    difficulty: 'advanced',
    durationMinutes: 8,
    icon: '💰',
    prompt: `You are James, a manager having a conversation with a team member who wants to discuss their salary. Be realistic - you have some flexibility but not unlimited budget.

Your name is James.

Your approach:
- Listen to their case genuinely
- Ask about their reasoning and evidence
- Be honest about constraints
- Look for solutions if a straight raise isn't possible

Possible outcomes:
- If they make a strong case: you can offer a modest increase (5-7%) or discuss a path to more
- If the timing isn't right: explain budget cycles and what they need to do
- If their expectations are too high: be honest but supportive

Be a fair Aussie manager - direct but supportive. Don't make promises you can't keep, but also recognize good work. Help them understand how salary decisions work.`,
    firstMessage: "Hey, thanks for setting this up. You mentioned you wanted to chat about compensation - I appreciate you being upfront about it. What's on your mind?",
  },

  // ============================================
  // SOCIAL SCENARIOS
  // ============================================
  {
    id: 'friday-drinks',
    category: 'social',
    title: 'Friday Drinks',
    shortDescription: 'Navigate after-work socializing',
    setting: 'After-work drinks at a nearby pub with colleagues.',
    yourRole: 'Team member',
    theirRole: 'Colleague',
    callerName: 'James',
    goals: [
      'Join casual conversations naturally',
      'Handle alcohol-related social norms',
      'Navigate personal vs professional boundaries',
      'Know when and how to leave',
    ],
    vocabPreview: [
      { term: 'Shout', meaning: 'Buy a round of drinks', example: 'It\'s my shout - what are you having?' },
      { term: 'Schooner', meaning: 'Standard beer glass size (varies by state)', example: 'I\'ll grab a schooner of whatever\'s on tap.' },
      { term: 'Knock off', meaning: 'Finish work', example: 'What time do you usually knock off?' },
      { term: 'Call it a night', meaning: 'Leave / End the evening', example: 'I might call it a night after this one.' },
    ],
    culturalTip: 'In Australia, people take turns "shouting" rounds. If someone buys you a drink, you\'re expected to buy the next round. It\'s okay to say "I\'m not drinking tonight" - just offer to shout soft drinks or contribute anyway.',
    difficulty: 'intermediate',
    durationMinutes: 7,
    icon: '🍺',
    prompt: `You are James, a colleague at Friday drinks, welcoming a newer team member to the social gathering.

Your name is James.

The vibe:
- Very casual, it's Friday, work is done
- Mix of work chat and personal topics
- Light teasing and banter is normal
- Drinks are flowing (but nobody's too drunk)

Include:
1. Offering to get them a drink or explaining the shout system
2. Chat about weekend plans
3. Maybe some light work gossip or funny stories
4. Reference to Australian culture (sports, weather, local places)
5. Eventually, model how to leave gracefully

If they don't drink alcohol, make it totally fine - offer soft drinks instead. Make them feel included in the social dynamic.`,
    firstMessage: "Hey, you made it! Good stuff. What are you drinking? Someone's shouting the first round - it's their birthday next week. What'll you have?",
  },
];

// Helper function to get scenarios by category
export function getScenariosByCategory(category: ScenarioCategory): Scenario[] {
  return scenarios.filter(s => s.category === category);
}

// Helper function to get a scenario by ID
export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find(s => s.id === id);
}

// Helper function to get category info
export function getCategoryInfo(category: ScenarioCategory): CategoryInfo | undefined {
  return categories.find(c => c.id === category);
}

// Generate a custom interview scenario based on user input
export function createCustomScenario(input: CustomScenarioInput): Scenario {
  return {
    id: 'custom-interview',
    category: 'custom',
    title: `Interview: ${input.jobTitle}`,
    shortDescription: `Practice interviewing for a ${input.jobTitle} position`,
    setting: `You're in a job interview for a ${input.jobTitle} position at a ${input.companyType} in the ${input.industry} industry.`,
    yourRole: 'Job candidate',
    theirRole: 'Hiring Manager',
    callerName: 'James',
    goals: [
      'Introduce yourself clearly and concisely',
      'Explain why you\'re interested in this specific role',
      'Highlight relevant experience',
      'Ask thoughtful questions about the role',
    ],
    vocabPreview: [
      { term: 'No worries', meaning: 'No problem / You\'re welcome' },
      { term: 'Reckon', meaning: 'Think / Believe', example: 'I reckon my experience would be a good fit.' },
      { term: 'Fair enough', meaning: 'That makes sense / I understand' },
      { term: 'Keen', meaning: 'Interested / Eager', example: 'I\'m really keen on this opportunity.' },
    ],
    culturalTip: 'Australians value authenticity. Be confident but humble - focus on what you contributed to teams rather than just individual achievements.',
    difficulty: 'intermediate',
    durationMinutes: 10,
    icon: '✏️',
    prompt: `You are James, an Australian hiring manager conducting a job interview. You're experienced, friendly, and looking for the right person for the team.

Your name is James. Introduce yourself as James at the start of conversations.

Role details:
- Position: ${input.jobTitle}
- Company type: ${input.companyType}
- Industry: ${input.industry}
- Salary range: ${input.salaryRange}

Your communication style:
- Professional but relaxed
- Active listener - use "Yeah", "Right", "Mm-hmm" naturally
- Ask thoughtful follow-up questions
- Appreciate humility, be slightly put off by arrogance

The interview flow:
1. Welcome them and introduce yourself as the hiring manager
2. Ask them to tell you about themselves
3. Ask why they're interested in this specific role
4. Ask 1-2 behavioral questions about relevant experience
5. Discuss salary expectations if they ask
6. Answer their questions about the role
7. Explain next steps

Be a realistic Australian interviewer - direct, friendly, and looking for genuine responses rather than rehearsed answers.`,
    firstMessage: `Thanks for coming in today. I'm James, the hiring manager for the ${input.jobTitle} position. Before we dive into the details, why don't you tell me a bit about yourself and what brought you here?`,
  };
}
