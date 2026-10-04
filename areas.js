// Stage 2 content: every product he uses, how to use it, on which days, when NOT to, and a picture prompt.
// Sources: 10-Foundations.md (protocol + dm prices checked 19 Sep 2026), 02-Assessment.md (findings), 65-Teeth.md, 40-Body-Posture.md.
// price: number = euro; priceNote says how far to trust it. "checked" = read on dm.de/Apotheke; "est" = my estimate, check the shelf.
// days(sched, wd): true if the product is used that day (sched = routine schedule for that date, wd = 0..6, Sunday = 0).
const PROMPT_BASE = 'Photorealistic photo of a 23-year-old man with dark curly hair and light-olive skin, in a clean white bathroom with soft natural window light, ';
const PROMPT_END = ', close-up on the hands and the area being treated, the product shown without any readable brand text, no text, no watermark, natural realistic hands with five fingers, shallow depth of field';
const PRODUCTS = {
  cleanser: {n: 'CeraVe Schäumendes Reinigungsgel, 236 ml', short: 'Cleanser', price: 8.85, priceNote: 'checked 19 Sep', where: 'dm', url: 'https://www.dm.de/cerave-cerave-schaeumendes-reinigungsgel-fuer-normale-bis-fettige-haut-p3337875597197.html',
    when: 'Every morning and every evening', days: () => true,
    steps: ['Wet your face with lukewarm water (not hot).', 'Put a pea-sized amount of gel in your wet hands and work it into a light foam.', 'Massage over face and neck with your fingertips for 30 seconds. Keep it away from your eyes.', 'Rinse with lukewarm water until the skin no longer feels slippery.', 'Pat dry with a clean towel. Do not rub.'],
    skip: ['Do not scrub with a brush or cloth.', 'If your skin stings or feels tight after washing, use only lukewarm water that morning and tell me.'],
    search: 'how to wash your face properly cleanser', act: 'working a pea-sized amount of foaming face cleanser between wet hands, then massaging it onto his cheeks with his fingertips'},
  moist: {n: 'CeraVe Feuchtigkeitsspendende Gesichtscreme, 52 ml', short: 'Moisturiser', price: 11, priceNote: 'checked 19 Sep', where: 'dm', url: 'https://www.dm.de/p/d/2196876/cerave-cerave-gesichtscreme-feuchtigkeitsspendend',
    when: 'Every morning and every evening, after the cleanser', days: () => true,
    steps: ['After cleansing, while the skin is still slightly damp.', 'Take a pea-sized to small-coin amount.', 'Dot it on cheeks, forehead, nose and chin, then spread gently upward.', 'In the evening on a Benzaknen night: wait 10 minutes after the Benzaknen first.'],
    skip: ['If you get a rash or burning, stop and tell me.'],
    search: 'how to apply moisturizer face correctly', act: 'dotting a small amount of face moisturiser on his cheeks, forehead and chin and spreading it upward with two fingers'},
  spf: {n: 'Eucerin Oil Control Face Sun Gel-Creme LSF 50+, 50 ml', short: 'Sun cream SPF 50', price: 18, priceNote: 'checked 19 Sep (budget: Garnier Ambre Solaire LSF 50+, ~€10)', where: 'dm', url: 'https://www.dm.de/p/d/2274636/eucerin-eucerin-oil-control-face-sun-gel-creme-lsf-50',
    when: 'Every morning, last step. Rain, winter and indoors included', days: () => true,
    steps: ['Last step of the morning, after the moisturiser.', 'Squeeze two finger-lengths onto your index and middle finger. That is the amount for face and neck.', 'Dot it over forehead, cheeks, nose, chin and neck, then spread evenly.', 'Do not rub it into your lash line or inside your eyes.'],
    skip: ['Never skip it. This is what lets the acne marks fade instead of darkening.', 'After 2 hours in strong sun, apply again.'],
    search: 'how much sunscreen for face two finger rule', act: 'squeezing two finger-lengths of sunscreen gel onto his index and middle fingers, held up in front of the camera'},
  bpo: {n: 'Benzaknen 5 % Gel, 40 g', short: 'Benzaknen (benzoyl peroxide)', price: 9.79, priceNote: 'checked today online; ~€12 in store', where: 'Apotheke, no prescription. Say: „Benzaknen fünf Prozent Gel, bitte.“', url: 'https://www.shop-apotheke.com/arzneimittel/15250576/benzaknen-5-gel.htm',
    when: 'Evenings. Mon / Wed / Fri for the first 14 days, then every evening if your skin copes', days: s => s.bpo, evening: true,
    steps: ['Wash your face with the cleanser and wait until the skin is completely dry.', 'Squeeze out about a pea-sized amount for the whole of both cheeks and the jaw.', 'Dot it on the cheeks and jaw only and spread it as a thin, almost invisible layer.', 'Wash your hands straight away.', 'Wait 10 minutes, then put on the moisturiser.'],
    skip: ['Never on eyes, lips, nostrils or broken skin.', 'Skip the night and use it only 2 times a week if the skin burns, peels hard or swells. If it keeps happening, stop and tell me.', 'No new acne product on the same night as this one, until we have talked about it.', 'It bleaches fabric: use an old white pillowcase and a towel you do not mind ruining.', 'Do not use it on a sunburn.'],
    search: 'how to apply benzoyl peroxide gel acne correctly', act: 'dabbing a thin layer of clear acne gel onto his cheek with a fingertip, other hand holding the tube'},
  patch: {n: 'Hydrocolloid pimple patches', short: 'Pimple patches', price: 4, priceNote: 'est, not checked', where: 'dm or any pharmacy (look for "Pickel-Patches / hydrocolloid")', url: '',
    when: 'Only on a spot that has come to a head, at night', days: () => false, onDemand: true,
    steps: ['Wash your face and dry it completely.', 'Peel one patch off the sheet without touching the sticky side.', 'Press it flat on the single spot and hold for 10 seconds.', 'Leave it on overnight, or 6 to 8 hours. Remove it slowly.'],
    skip: ['One patch for one spot. Never cover the whole face.', 'Do not squeeze the spot first or after.', 'Do not put Benzaknen under the patch.'],
    search: 'how to use hydrocolloid pimple patch', act: 'pressing a small round pimple patch onto a spot on his cheek with a fingertip'},
  shampoo: {n: 'Balea Shampoo Locken beauty essentials, 400 ml', short: 'Curl shampoo', price: 2.45, priceNote: 'checked 19 Sep', where: 'dm', url: 'https://www.dm.de/p/d/3155276/balea-shampoo-locken-beauty-essentials',
    when: 'Wash days: Monday, Thursday, Saturday', days: s => s.wash,
    steps: ['Wet your hair fully with warm water.', 'Put a small amount in your palm and spread it on your scalp only.', 'Massage the scalp with your fingertips for one minute. Do not scrub the lengths.', 'Rinse. The suds running down are enough to clean the ends.'],
    skip: ['Not on the days between wash days. Washing daily dries curls out.'],
    search: 'how to wash curly hair shampoo scalp only', act: 'massaging shampoo foam into his scalp with his fingertips, head tilted slightly forward, in a shower'},
  cond: {n: 'Balea Conditioner Locken beauty essentials, 350 ml', short: 'Curl conditioner', price: 2.45, priceNote: 'checked 19 Sep', where: 'dm', url: 'https://www.dm.de/p/d/1670653/balea-conditioner-locken-beauty-essentials',
    when: 'Every wash day, right after the shampoo', days: s => s.wash,
    steps: ['After rinsing the shampoo, squeeze out a generous handful of conditioner.', 'Spread it from the mid-lengths to the ends, not on the scalp.', 'Slowly detangle with your fingers while it is in your hair.', 'Rinse out.'],
    skip: ['Never detangle dry hair, and never with a brush.'],
    search: 'how to condition curly hair detangle with fingers', act: 'spreading white conditioner through the lengths of his wet curly hair and gently detangling the curls with his fingers'},
  leavein: {n: 'Cantu Leave-In Haarkur Repair Creme, 453 g', short: 'Leave-in cream', price: 6.95, priceNote: 'checked 19 Sep', where: 'dm', url: 'https://www.dm.de/p/d/1685686/cantu-leave-in-haarkur-repair-creme',
    when: 'Wash days, on soaking-wet hair', days: s => s.wash,
    steps: ['Leave the shower with the hair still dripping wet.', 'Tip your head forward.', 'Take a coin-sized amount, warm it in your hands, and rake it through your hair from the ends upward.'],
    skip: ['It is rich. If the hair feels greasy the next day, use less.'],
    search: 'how to apply leave-in conditioner curly hair wet hair', act: 'raking a coin-sized amount of cream through his soaking-wet curly hair with his fingers, head tilted forward'},
  gel: {n: 'got2b Stylinggel Curlz (gotCURLZ Jelly), 150 ml', short: 'Curl gel', price: 4, priceNote: 'checked 19 Sep', where: 'dm', url: 'https://www.dm.de/p/d/3121125/got2b-stylinggel-curlz',
    when: 'Wash days, straight after the leave-in', days: s => s.wash,
    steps: ['Take the same amount as the leave-in.', 'Press and scrunch it upward into the curls with your palms, in sections.', 'Leave it. The hair will feel hard and crunchy as it dries.', 'When fully dry, scrunch the hair gently with dry hands to break the crunch.'],
    skip: ['Do not touch the hair while it dries, or it frizzes.'],
    search: 'how to apply curl gel scrunch the crunch', act: 'scrunching gel upward into his wet curls with both palms'},
  towel: {n: 'ebelin Haarturban aus Mikrofaser (or an old cotton T-shirt)', short: 'Microfibre turban', price: 4.95, priceNote: 'checked 19 Sep', where: 'dm', url: 'https://www.dm.de/p/d/1622381/ebelin-haarturban-aus-mikrofaser',
    when: 'Wash days, after the gel, for 10 minutes', days: s => s.wash,
    steps: ['Lay the T-shirt flat, neck hole away from you, or use the turban.', 'Bend forward and lower the hair straight down into the middle so the curls pile on top of the head.', 'Wrap and tie it, and leave it for 10 minutes.', 'Take it off and let the hair air-dry.'],
    skip: ['Never a normal terry towel: it roughs up the curls.'],
    search: 'plopping curly hair with a t-shirt tutorial', act: 'wrapping his wet curly hair in a grey cotton t-shirt, bent forward over a bathroom sink'},
  trimmer: {n: 'Your beard trimmer', short: 'Beard trimmer', price: 0, priceNote: 'you own it', where: '', url: '',
    when: 'Every 3 to 4 days (Wednesday and Sunday)', days: s => s.beard,
    steps: ['Put on the 3 to 4 mm guard.', 'Trim the whole beard against the direction of growth.', 'Cheek line: leave it where it naturally stops, no shaving above it.', 'Neckline: two fingers above your Adam\'s apple, trim below it without the guard.'],
    skip: ['No razor on the face. Razor plus curly hair causes the ingrown bumps on your chin.'],
    search: 'how to trim a beard stubble with guard neckline', act: 'running a beard trimmer with a short guard along his jawline, looking into the mirror'},
  toothbrush: {n: 'Oral-B Pro 1 electric toothbrush', short: 'Electric toothbrush', price: 34.95, priceNote: 'checked dm', where: 'dm', url: 'https://www.dm.de/marken/oral-b/kategorie-elektrische-zahnbuersten-2299494',
    when: 'Morning and evening, 2 minutes', days: () => true,
    steps: ['Pea-sized amount of toothpaste on the brush head.', 'Hold the head at 45 degrees against the gum line.', 'Guide it slowly from tooth to tooth. Let the brush do the work, do not scrub.', 'Split the mouth in four parts, 30 seconds each, 2 minutes total.', 'Spit, do not rinse with water straight away.'],
    skip: ['Replace the brush head every 3 months.', 'After acidic drinks or foods (coffee, juice, fruit) wait 30 minutes before brushing.'],
    search: 'how to use an electric toothbrush correctly', act: 'holding an electric toothbrush angled against his upper front teeth while smiling, in front of a bathroom mirror'},
  floss: {n: 'Dontodent Zahnseide antibakteriell, 100 m', short: 'Dental floss', price: 0.75, priceNote: 'checked dm', where: 'dm', url: 'https://www.dm.de/p/d/1270902/dontodent-zahnseide-antibakteriell',
    when: 'Every evening, before brushing', days: () => true, evening: true,
    steps: ['Pull out about 40 cm of floss and wind most of it around your middle fingers.', 'Slide it gently between two teeth with a sawing motion. Do not snap it down onto the gum.', 'Curve it around one tooth in a C-shape and move it up and down the side.', 'Do the same on the neighbouring tooth, then use a clean section for the next gap.'],
    skip: ['A little bleeding in the first week is common. If your gums still bleed after 2 weeks of daily flossing, tell your dentist.'],
    search: 'how to floss your teeth properly', act: 'flossing between his lower front teeth with floss wound around his two middle fingers, mouth open, in front of a mirror'},
  scraper: {n: 'Dontodent PRO+ Zungenreiniger aus Edelstahl', short: 'Tongue scraper', price: 1.95, priceNote: 'checked dm', where: 'dm', url: 'https://www.dm.de/p/d/3117641/dontodent-pro-zungenreiniger-pro-aus-edelstahl',
    when: 'Every morning, before drinking or brushing', days: () => true,
    steps: ['Stick your tongue out and place the scraper as far back as is comfortable.', 'Pull it forward over the tongue with light pressure, 3 to 5 times.', 'Rinse the scraper under water after each stroke.', 'Rinse your mouth, then brush your teeth.'],
    skip: ['If you gag, start in the middle of the tongue and go a little further back each week.', 'If a white coating or bad breath does not go away in 2 weeks, mention it at the dentist.'],
    search: 'how to use a tongue scraper', act: 'pulling a stainless steel tongue scraper forward over his extended tongue, in front of a bathroom mirror'},
  lipbalm: {n: 'Labello Lippenpflegestift sun protect LSF 50+', short: 'Lip balm with SPF', price: 2.5, priceNote: 'est ~€2-3, not checked', where: 'dm', url: 'https://www.dm.de/p/d/1472810/labello-lippenpflegestift-sun-protect-lsf-50',
    when: 'Every morning after the sun cream, and again when your lips feel dry', days: () => true,
    steps: ['After your sun cream, swipe the stick over both lips two or three times.', 'Press your lips together to spread it.', 'Reapply during the day when they feel dry.'],
    skip: ['Do not lick your lips, it dries them out more.'],
    search: 'how to apply lip balm with spf', act: 'swiping a lip balm stick across his lower lip, close-up of the lower face'}
};

// Order shown in the Products list
const PRODUCT_ORDER = ['cleanser', 'moist', 'spf', 'bpo', 'patch', 'shampoo', 'cond', 'leavein', 'gel', 'towel', 'trimmer', 'toothbrush', 'floss', 'scraper', 'lipbalm'];

// Face and body areas. now = what the photos/assessment show. moves = what actually changes it. cant = honest limit.
const AREAS = [
  {id: 'cheeks', group: 'Face', n: 'Cheeks', now: 'Mild-to-moderate acne on the cheeks and jaw, with red and brown marks where spots healed, and some shallow texture.', goal: 'Calmer in 8 to 12 weeks, marks fading over 3 to 6 months.',
   moves: ['Benzaknen on the cheeks and jaw in the evening (the one over-the-counter acne drug with real evidence).', 'SPF 50 every single morning: the marks only fade if the sun does not darken them again.', 'Never pop spots. A pimple patch on a spot that has come to a head.', 'Ask the Hausarzt for adapalene gel or a dermatologist referral this week.', 'Losing fat slims the lower face and cheeks too.'],
   products: ['cleanser', 'moist', 'spf', 'bpo', 'patch'], cant: 'The shallow texture is a separate dermatology conversation for later. It is not part of this budget.'},
  {id: 'skin', group: 'Face', n: 'Skin overall', now: 'Combination to oily: shine on the nose and inner cheeks, enlarged pores there, drier at the edges.', goal: 'Even, calm skin that is no longer irritated.',
   moves: ['Four products only. More makes irritated skin worse.', 'Sleep 7 hours with a fixed wake-up time.', 'Water through the day and a clean pillowcase, changed weekly.'],
   products: ['cleanser', 'moist', 'spf'], cant: 'Skin type is genetic. The routine controls the oil and irritation, it does not change the type.'},
  {id: 'eyes', group: 'Face', n: 'Under the eyes', now: 'Mild shadow and slight hollowing under the eyes.', goal: 'Less tired-looking by the spring.',
   moves: ['Sleep is the biggest lever: 7 hours or more, same wake-up time every day.', 'SPF over the cheekbone and under-eye area, not on the lash line.', 'Drink water through the day.'],
   products: ['spf'], cant: 'Under-eye shadow is largely genetic and bone structure. My assessment: no eye cream is worth buying here.'},
  {id: 'nose', group: 'Face', n: 'Nose', now: 'Straight, strong nose with a slightly downturned tip. Shine and enlarged pores on and around it.', goal: 'Less shine and cleaner-looking pores.',
   moves: ['Cleanser morning and evening keeps the surface oil down.', 'Leave the blackheads alone: squeezing enlarges pores.', 'Later, once the skin is calm, we can add a 2 % salicylic acid on the nose only.'],
   products: ['cleanser', 'moist'], cant: 'The shape stays as it is. It is a strong profile feature. Pores can look smaller but never permanently shrink.'},
  {id: 'mouth', group: 'Face', n: 'Mouth and lips', now: 'Full, well-shaped lips with healthy colour.', goal: 'Keep them soft and protected.',
   moves: ['Lip balm with SPF every morning.', 'Do not lick them.', 'Water through the day.'],
   products: ['lipbalm'], cant: ''},
  {id: 'tongue', group: 'Face', n: 'Tongue', now: 'No problem seen. Part of fresh breath and a clean mouth.', goal: 'A clean tongue and fresh breath.',
   moves: ['Tongue scraper every morning, then brush your teeth.', 'Water through the day, and stop fizzy drinks (already in your plan).'],
   products: ['scraper'], cant: 'A white coating that stays for more than two weeks is a question for the dentist.'},
  {id: 'teeth', group: 'Face', n: 'Teeth', now: 'Healthy gums, straight upper teeth, crowded lower teeth, moderate yellowing.', goal: 'Naturally brighter teeth by January.',
   moves: ['October: book the check-up and the professional cleaning (about €80 to €120; DAK refunds up to €60 a year).', 'Electric toothbrush twice a day and floss every evening.', 'Rinse with water after coffee and tea.', 'January: ask the dentist about custom-tray home bleaching (about €250 to €400).'],
   products: ['toothbrush', 'floss'], cant: 'Shop whitening strips do almost nothing in the EU (the legal peroxide limit is 0.1 %). Skip charcoal and DIY: they scratch the enamel. The crowded lower teeth stay as they are.'},
  {id: 'hair', group: 'Face', n: 'Hair', now: 'Dense, dark 2c to 3a curls with no recession, but unshaped and frizzy.', goal: 'Defined curls with a better shape after the cut in Phase 2.',
   moves: ['The wash-day routine on Monday, Thursday and Saturday: shampoo on the scalp, conditioner on the ends, leave-in, gel, plop.', 'Never a brush on dry hair, never a terry towel.', 'Phase 2 (late October): a cutter who cuts curls dry, length on top, soft taper at the sides.'],
   products: ['shampoo', 'cond', 'leavein', 'gel', 'towel'], cant: 'The shape problem comes from the cut. Products only fix the frizz.'},
  {id: 'brows', group: 'Face', n: 'Eyebrows', now: 'Thick, dark and straight. They give the face its seriousness.', goal: 'Keep them exactly as they are.',
   moves: ['Only pluck strays between the brows and the odd hair under the arch.', 'No shaping and no thinning, ever.'],
   products: [], cant: ''},
  {id: 'beard', group: 'Face', n: 'Beard and jaw', now: 'Good stubble density on the chin and moustache, thinner on the upper cheeks.', goal: 'A clean, even 3 to 5 mm stubble along the jaw.',
   moves: ['Trimmer with the guard on, Wednesday and Sunday.', 'No razor on the face.', 'Losing fat makes the jawline show.'],
   products: ['trimmer'], cant: 'The upper cheeks will not fill in yet. Reassess in a year or two.'},
  {id: 'belly', group: 'Body', n: 'Belly', now: 'Fat is highest around the midsection, with faint stretch marks around the navel.', goal: 'Flat and visibly lean by 1 April, with abs showing around February to March.',
   moves: ['The strict menu: about 1,850 kcal a day with high protein.', '10,000 steps every day and 15 minutes of incline walking after each lift.', 'Core work is already in your sessions: plank on Lower A, hanging knee raises on Lower B.', 'Weigh in every Sunday and watch the trend, not one day.'],
   products: [], cant: 'You cannot burn fat from one spot. The belly is usually the last place it goes, around months 5 and 6. The stretch marks will fade but not vanish.'},
  {id: 'chest', group: 'Body', n: 'Chest', now: 'Soft chest from the fat on top, with a decent base underneath.', goal: 'A firmer, fuller-looking chest as the fat comes off.',
   moves: ['Tuesday: bench or dumbbell press 4 × 8 to 10.', 'Friday: incline dumbbell press 4 × 10, dips or pushdowns 3 × 12.', 'Protein of 160 g or more every day.'],
   products: [], cant: 'The base is built by lifting. The fat on top comes off with the diet. Both are needed.'},
  {id: 'arms', group: 'Body', n: 'Arms', now: 'Average build with some softness.', goal: 'Leaner arms with visible shape.',
   moves: ['Tuesday: curls 2 × 12, triceps pushdown 2 × 12, shoulder press 3 × 10.', 'Friday: dips or pushdown 3 × 12, lateral raises 3 × 15, rear-delt fly 3 × 15.', 'Pull-ups or assisted pull-ups on Friday.'],
   products: [], cant: 'Arm size comes mostly from the big lifts and the fat loss. More curls will not speed it up.'},
  {id: 'hips', group: 'Body', n: 'Hips and waist', now: 'Pelvis tilted forward, belly pushed out, lower back arched. Fat sits around the waist.', goal: 'A straighter posture and a smaller waist.',
   moves: ['Posture set B every evening: dead bugs, glute bridges, hip-flexor stretch.', 'Thursday: hip thrusts 4 × 10, split squats and the Romanian deadlift on Monday.', 'Fat loss around the waist.'],
   products: [], cant: 'The width of the hips is bone, and it stays. What changes is the tilt and the waist.'}
];

// Supplements card. Only vitamin D is conditional on a test. Based on the evidence reviewed on 2026-10-01.
const SUPPS = [
  {n: 'Vitamin D', status: 'Ask first', text: 'Take a blood test (25-OH vitamin D) at the Hausarzt visit this week. In a German winter many people are low. Without a test and without a doctor, keep to 800 IU a day at most (the German BfR and DGE guidance). For acne, vitamin D helped only in people who were deficient.'},
  {n: 'Omega-3', status: 'Food first', text: 'Moderate evidence for acne. Your fixed menu uses lean fish (pollock, tuna in water), which has little omega-3. The better fix is two portions of fatty fish a week: salmon, mackerel or sardines. The meal library now has two salmon meals. Take fish or algae oil only if you will not eat the fish.'},
  {n: 'Creatine', status: 'Optional', text: '3 to 5 g a day, any time, a Creapure-quality powder (about €25 to €35 for 500 g). It helps you keep strength while cutting. It holds 1 to 2 kg of water in the first two weeks, so Sunday weigh-ins will read higher. That is water, not fat.'},
  {n: 'Zinc', status: 'Doctor only', text: 'The best-studied supplement for acne, but also the one with the most side effects. Only if the Hausarzt agrees, and only after the Benzaknen and adapalene have had 8 to 12 weeks.'},
  {n: 'Skip these', status: 'No', text: 'High-dose vitamin B12 (can worsen acne). Biotin and hair gummies (no benefit unless you are deficient, and biotin can distort blood tests). Multivitamins and collagen (no benefit for you). Magnesium (not needed on a balanced diet, and high doses cause diarrhoea).'}
];

// ---- Picture pairs (made-up man who looks similar to Wael + the product on white). Generated in the Gemini app. ----
// #0 is made first; it is attached to every "man" prompt so the same man appears in all of them.
const MAN_REF_PROMPT = 'Photorealistic head-and-shoulders portrait of a 23-year-old man with dense dark-brown curly hair (loose curls, medium length on top, shorter at the sides), thick dark straight eyebrows, dark brown eyes, light-olive skin and short even stubble, neutral friendly expression, plain white t-shirt, standing in a clean white bathroom, soft natural window light, vertical 3:4, sharp focus on the face, no text, no logos, no watermark.';
const MAN_PREFIX = 'Use the man in the attached photo: same face, same curly hair, same skin and stubble. Photorealistic photo of him in a clean white bathroom with soft natural window light, ';
const MAN_END = '. Framed close on the area being treated so it is obvious where the product goes. Vertical 3:4. No text, no labels, no logos, no watermark. Natural hands with five fingers.';
const PROD_PREFIX = 'Photorealistic product photo of ';
const PROD_END = ', standing upright on a plain white background, soft studio light, gentle shadow underneath, vertical 3:4, no readable text, no brand name, no logo, no watermark.';
const PICS_TEXT = {
  cleanser:   {pp: 'a white pump bottle of foaming facial cleanser with a blue pump and small blue details', act: 'massaging white foaming cleanser onto both cheeks with his fingertips in small circles, his face wet, eyes closed, the foam covering cheeks, forehead and chin but not his eyes'},
  moist:      {pp: 'a small white tube of light face moisturiser with blue details', act: 'with five small dots of white moisturiser on his forehead, both cheeks, nose and chin, about to spread them upward with two fingers'},
  spf:        {pp: 'a slim white tube of face sun cream, factor 50', act: 'holding up his index and middle finger toward the camera with a line of white sun cream running the full length of both fingers, which is the amount for face and neck'},
  bpo:        {pp: 'a small white pharmacy tube of acne gel next to its folding box', act: 'dabbing a thin layer of clear gel onto his left cheek with one fingertip, the area covered is only the cheeks and the jawline, nothing near his eyes, nostrils or lips'},
  patch:      {pp: 'a small sheet of clear round hydrocolloid pimple patches', act: 'pressing one small clear round patch onto a single spot on his cheek with his fingertip'},
  lipbalm:    {pp: 'a lip balm stick with its cap off', act: 'swiping a lip balm stick across his lower lip, close-up of the lower half of his face'},
  scraper:    {pp: 'a stainless steel U-shaped tongue scraper', act: 'holding a stainless steel U-shaped tongue scraper at the back of his extended tongue and pulling it forward, in front of a bathroom mirror'},
  toothbrush: {pp: 'a black electric toothbrush with a round brush head standing on its charger', act: 'smiling with his teeth showing while holding a black electric toothbrush with the round head angled at 45 degrees against the gum line of his upper teeth'},
  floss:      {pp: 'a small white dental floss dispenser with a strand of floss pulled out', act: 'gently curving dental floss in a C-shape around one of his lower front teeth, the floss wound around his two middle fingers, mouth open in front of a mirror'},
  trimmer:    {pp: 'a black cordless beard trimmer with a short comb guard attached', act: 'running a beard trimmer with a short guard along his jawline, with two fingers of his other hand resting just above his Adam\'s apple to show where the neckline stops'},
  shampoo:    {pp: 'a 400 ml bottle of curl shampoo', act: 'standing in a shower massaging shampoo foam into his scalp only with his fingertips, head tilted slightly forward, the lengths of his curls without foam'},
  cond:       {pp: 'a 350 ml bottle of hair conditioner', act: 'in the shower spreading white conditioner through the lengths and ends of his wet curly hair and gently separating the curls with his fingers'},
  leavein:    {pp: 'a large round tub of creamy leave-in hair cream with the lid off', act: 'with his head tipped forward over a sink, raking a coin-sized amount of white cream through his soaking-wet curly hair with his fingers'},
  gel:        {pp: 'a clear squeeze tube of curl styling gel', act: 'scrunching gel upward into his wet curls with both palms cupped under the hair'},
  towel:      {pp: 'a folded grey microfibre hair turban', act: 'with his wet curly hair wrapped on top of his head inside a grey cotton t-shirt tied at the forehead, looking into the mirror'}
};
// Only products used on the face, mouth and hair get picture pairs.
const PICS_ORDER = ['cleanser', 'moist', 'spf', 'bpo', 'patch', 'lipbalm', 'scraper', 'toothbrush', 'floss', 'trimmer', 'shampoo', 'cond', 'leavein', 'gel', 'towel'];

// Short rows for the card (WHEN comes from PRODUCTS.when, CAREFUL from the first skip rule).
const CARD_INFO = {
  cleanser:   {how: 'Pea-sized amount, massage 30 seconds with your fingertips, rinse, pat dry.', order: 'First step, morning and evening.'},
  moist:      {how: 'Pea-sized dots on forehead, cheeks, nose and chin, then spread upward.', order: 'After the cleanser. On Benzaknen nights: Benzaknen, wait 10 minutes, then this.'},
  spf:        {how: 'Two finger-lengths for face and neck, spread evenly.', order: 'Morning, last: cleanser \u2192 moisturiser \u2192 sun cream \u2192 lip balm.'},
  bpo:        {how: 'Pea-sized amount, a thin layer on the cheeks and jaw only.', order: 'Evening: cleanser \u2192 skin fully dry \u2192 Benzaknen \u2192 wait 10 minutes \u2192 moisturiser.'},
  patch:      {how: 'One patch on one spot that has come to a head, left on overnight.', order: 'Evening, after the moisturiser.'},
  lipbalm:    {how: 'Two or three swipes over both lips, press them together.', order: 'Morning after the sun cream, then whenever your lips feel dry.'},
  scraper:    {how: '3 to 5 light strokes from the back of the tongue to the front.', order: 'Morning, before drinking and before brushing.'},
  toothbrush: {how: 'Head at 45 degrees to the gum line, 2 minutes, let the brush do the work.', order: 'Morning after the tongue scraper; evening after flossing.'},
  floss:      {how: 'Curve it into a C around each tooth and slide it up and down.', order: 'Evening, before brushing.'},
  trimmer:    {how: '3 to 4 mm guard everywhere; neckline two fingers above the Adam\'s apple.', order: 'On a dry beard before you shower, so the hairs wash away.'},
  shampoo:    {how: 'Small amount on the scalp only, massage for one minute.', order: 'Wash day: shampoo \u2192 conditioner \u2192 leave-in \u2192 gel \u2192 turban.'},
  cond:       {how: 'Mid-lengths to ends, detangle with your fingers, rinse.', order: 'Right after the shampoo.'},
  leavein:    {how: 'Coin-sized amount on soaking-wet hair, head tipped forward.', order: 'Straight out of the shower, after the conditioner.'},
  gel:        {how: 'Same amount as the leave-in, scrunched upward. Do not touch it while it dries.', order: 'Right after the leave-in.'},
  towel:      {how: 'Plop the curls into it for 10 minutes, then let the hair air-dry.', order: 'Last, straight after the gel.'}
};
