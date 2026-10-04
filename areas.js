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
  adapalene: {n: 'Adapalene 0.1 % gel (for example Differin), from the doctor', short: 'Adapalene (gel from the doctor)', price: 5, priceNote: 'est: the usual prescription fee, not checked', where: 'Pharmacy, with a prescription from the Hausarzt or a skin doctor', url: '',
    when: 'Evenings, only once the doctor has prescribed it. Usually every second night at the start', days: () => false, rx: true,
    steps: ['Wash your face with the cleanser and pat it dry.', 'Wait until your skin is completely dry (about 20 minutes).', 'Take ONE pea-sized amount for the whole face.', 'Dot it on your forehead, both cheeks and chin, then spread it into a thin layer.', 'Keep it away from your eyes, lips and the corners of your nose.', 'Moisturiser on top after a few minutes.'],
    skip: ['Never more than a pea-sized amount for the whole face. More does not work better, it only irritates.', 'Ask the doctor how to combine it with Benzaknen: same night, or alternate nights.', 'Sun cream every morning is a must while you use it.', 'Dry, slightly red skin in the first 2 to 4 weeks is normal. Burning or swelling: stop and call the doctor.'],
    search: 'how to apply adapalene gel pea sized amount', act: 'spreading a thin layer of white gel over his cheek with two fingertips in the evening'},
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
    search: 'how to apply lip balm with spf', act: 'swiping a lip balm stick across his lower lip, close-up of the lower face'},
  toothpaste: {n: 'Any toothpaste with 1450 ppm fluoride (for example Dontodent)', short: 'Toothpaste', price: 0.65, priceNote: 'est, not checked', where: 'dm or any supermarket', url: '',
    when: 'Morning and evening, with the toothbrush', days: () => true,
    steps: ['Put a pea-sized amount on the dry brush head.', 'Brush for 2 minutes, all surfaces.', 'Spit it out, but do not rinse with water: the fluoride keeps working.'],
    skip: ['Skip charcoal and strong whitening pastes: they scratch the enamel.', 'Check the tube says 1450 ppm fluoride (some "natural" pastes have none).'],
    search: 'how much toothpaste spit dont rinse fluoride', act: 'squeezing a pea-sized amount of toothpaste onto an electric toothbrush head'},
  bodywash: {n: 'Your own body wash', short: 'Body wash', price: 0, priceNote: 'you own it', where: '', url: '',
    when: 'Every shower (after the gym and in the evening)', days: () => true,
    steps: ['Wet your body with warm, not hot, water.', 'Put a coin-sized amount in your hand or on a sponge.', 'Wash chest, back, armpits, groin and feet. Rinse well.', 'Pat dry with a towel.'],
    skip: ['Do not use it on your face. The face has its own cleanser.', 'Very hot, long showers dry the skin out in winter.'],
    search: 'how to shower properly body wash', act: 'lathering body wash on his chest and shoulders in the shower'},
  deo: {n: 'Your own deodorant', short: 'Deodorant', price: 0, priceNote: 'you own it', where: '', url: '',
    when: 'Every morning, on clean dry armpits. Again after the gym shower', days: () => true,
    steps: ['Make sure your armpits are clean and completely dry.', 'Two or three strokes (or a two-second spray) under each arm.', 'Let it dry for a minute before you put your shirt on.'],
    skip: ['Do not use it on freshly shaved or irritated skin, it stings.', 'If it gives you a rash, stop and switch to a fragrance-free one.'],
    search: 'how to apply deodorant properly', act: 'applying stick deodorant to his armpit'},
  bodylotion: {n: 'Balea Bodylotion Urea, 400 ml', short: 'Body lotion (winter)', price: 1.75, priceNote: 'checked 4 Oct', where: 'dm', url: 'https://www.dm.de/p/d/1574857/balea-bodylotion-urea',
    when: 'After the shower, October to March, on dry areas', days: () => true,
    steps: ['After the shower, pat your skin almost dry.', 'Put a coin-sized amount in your palm.', 'Rub it into dry areas: shins, arms, elbows, hands.', 'Let it sink in for a minute before you get dressed.'],
    skip: ['Not on the face: the face has its own moisturiser.', 'Urea can sting on broken or scratched skin. Leave those spots out.'],
    search: 'how to apply body lotion after shower dry skin', act: 'rubbing white body lotion into his forearm after a shower'}
};

// What each product has to do. Used by the photo comparison ("is mine as good?").
const PRODUCT_ROLE = {
  cleanser: 'a gentle face cleanser for oily, acne-prone skin: non-comedogenic, no scrub particles, no strong fragrance, not harsh or stripping',
  moist: 'a light face moisturiser for oily, acne-prone skin: non-comedogenic, little or no fragrance; ceramides or niacinamide are a plus. Used morning and evening, also after benzoyl peroxide',
  spf: 'a daily face sunscreen, SPF 50 with good UVA protection, light or matte, non-comedogenic, made for oily or acne-prone skin',
  bpo: 'an acne treatment with benzoyl peroxide 2.5 to 5 %',
  adapalene: 'a prescription retinoid gel for acne: adapalene 0.1 % or what the doctor prescribed',
  shampoo: 'a gentle, preferably sulfate-free shampoo for curly hair',
  cond: 'a conditioner for curly hair that detangles and softens',
  leavein: 'a leave-in conditioner or curl cream for curly hair against frizz',
  gel: 'a styling gel for curls and waves, preferably alcohol-free, gives hold without crunch once scrunched out',
  towel: 'a microfibre towel or a cotton T-shirt to dry curly hair without frizz (not a terry towel)',
  trimmer: 'a beard trimmer with guards from about 1 to 5 mm',
  toothbrush: 'an electric toothbrush (oscillating round head or sonic), ideally with a 2-minute timer and pressure sensor',
  toothpaste: 'a toothpaste with about 1450 ppm fluoride, not charcoal and not strongly abrasive',
  floss: 'dental floss or interdental brushes for daily cleaning between the teeth',
  scraper: 'a tongue scraper (metal or plastic)',
  lipbalm: 'a lip balm with SPF 30 to 50',
  bodywash: 'a mild shower gel for the body that does not dry the skin out',
  deo: 'a deodorant or antiperspirant that works for him and does not irritate the skin',
  bodylotion: 'a body lotion for dry winter skin, ideally with urea 5 to 10 %'
};

// Order shown in the Products list
const PRODUCT_ORDER = ['cleanser', 'moist', 'spf', 'bpo', 'adapalene', 'shampoo', 'cond', 'leavein', 'gel', 'towel', 'trimmer', 'toothbrush', 'toothpaste', 'floss', 'scraper', 'lipbalm', 'bodywash', 'deo', 'bodylotion'];

// Face and body areas. now = what the photos/assessment show. moves = what actually changes it. cant = honest limit.
const AREAS = [
  {id: 'cheeks', group: 'Face', n: 'Cheeks', now: 'Mild-to-moderate acne on the cheeks and jaw, with red and brown marks where spots healed, and some shallow texture.', goal: 'Calmer in 8 to 12 weeks, marks fading over 3 to 6 months.',
   moves: ['Benzaknen on the cheeks and jaw in the evening (the one over-the-counter acne drug with real evidence).', 'SPF 50 every single morning: the marks only fade if the sun does not darken them again.', 'Never pop spots: squeezing pushes it deeper and leaves a mark.', 'Ask the Hausarzt for adapalene gel or a dermatologist referral this week.', 'Losing fat slims the lower face and cheeks too.'],
   products: ['cleanser', 'moist', 'spf', 'bpo', 'adapalene'], cant: 'The shallow texture is a separate dermatology conversation for later. It is not part of this budget.'},
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
   products: ['toothbrush', 'toothpaste', 'floss'], cant: 'Shop whitening strips do almost nothing in the EU (the legal peroxide limit is 0.1 %). Skip charcoal and DIY: they scratch the enamel. The crowded lower teeth stay as they are.'},
  {id: 'hair', group: 'Face', n: 'Hair', now: 'Dense, dark 2c to 3a curls with no recession, but unshaped and frizzy.', goal: 'Defined curls with a better shape after the cut in Phase 2.',
   moves: ['The wash-day routine on Monday, Thursday and Saturday: shampoo on the scalp, conditioner on the ends, leave-in, gel, plop.', 'Never a brush on dry hair, never a terry towel.', 'Phase 2 (late October): a cutter who cuts curls dry, length on top, soft taper at the sides.'],
   products: ['shampoo', 'cond', 'leavein', 'gel', 'towel'], cant: 'The shape problem comes from the cut. Products only fix the frizz.'},
  {id: 'brows', group: 'Face', n: 'Eyebrows', now: 'Thick, dark and straight. They give the face its seriousness.', goal: 'Keep them exactly as they are.',
   moves: ['Only pluck strays between the brows and the odd hair under the arch.', 'No shaping and no thinning, ever.'],
   products: [], cant: ''},
  {id: 'beard', group: 'Face', n: 'Beard and jaw', now: 'Good stubble density on the chin and moustache, thinner on the upper cheeks.', goal: 'A clean, even 3 to 5 mm stubble along the jaw.',
   moves: ['Trimmer with the guard on, Wednesday and Sunday.', 'No razor on the face.', 'Losing fat makes the jawline show.'],
   products: ['trimmer'], cant: 'The upper cheeks will not fill in yet. Reassess in a year or two.'},
  {id: 'bodyskin', group: 'Body', n: 'Skin on the body', now: 'No problem seen. Winter heating dries the skin on the shins, arms and hands.', goal: 'Clean, soft skin and no smell, all winter.',
   moves: ['Shower after every gym session, warm not hot.', 'Deodorant every morning on dry armpits.', 'Body lotion after the shower on the dry spots, October to March.'],
   products: ['bodywash', 'deo', 'bodylotion'], cant: ''},
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
const PICS_ORDER = ['cleanser', 'moist', 'spf', 'bpo', 'lipbalm', 'scraper', 'toothbrush', 'floss', 'trimmer', 'shampoo', 'cond', 'leavein', 'gel', 'towel'];

// Short rows for the card (WHEN comes from PRODUCTS.when, CAREFUL from the first skip rule).
const CARD_INFO = {
  cleanser:   {how: 'Pea-sized amount, massage 30 seconds with your fingertips, rinse, pat dry.', order: 'First step, morning and evening.'},
  moist:      {how: 'Pea-sized dots on forehead, cheeks, nose and chin, then spread upward.', order: 'After the cleanser. On Benzaknen nights: Benzaknen, wait 10 minutes, then this.'},
  spf:        {how: 'Two finger-lengths for face and neck, spread evenly.', order: 'Morning, last: cleanser \u2192 moisturiser \u2192 sun cream \u2192 lip balm.'},
  bpo:        {how: 'Pea-sized amount, a thin layer on the cheeks and jaw only.', order: 'Evening: cleanser \u2192 skin fully dry \u2192 Benzaknen \u2192 wait 10 minutes \u2192 moisturiser.'},
  lipbalm:    {how: 'Two or three swipes over both lips, press them together.', order: 'Morning after the sun cream, then whenever your lips feel dry.'},
  scraper:    {how: '3 to 5 light strokes from the back of the tongue to the front.', order: 'Morning, before drinking and before brushing.'},
  toothbrush: {how: 'Head at 45 degrees to the gum line, 2 minutes, let the brush do the work.', order: 'Morning after the tongue scraper; evening after flossing.'},
  floss:      {how: 'Curve it into a C around each tooth and slide it up and down.', order: 'Evening, before brushing.'},
  trimmer:    {how: '3 to 4 mm guard everywhere; neckline two fingers above the Adam\'s apple.', order: 'On a dry beard before you shower, so the hairs wash away.'},
  shampoo:    {how: 'Small amount on the scalp only, massage for one minute.', order: 'Wash day: shampoo \u2192 conditioner \u2192 leave-in \u2192 gel \u2192 turban.'},
  cond:       {how: 'Mid-lengths to ends, detangle with your fingers, rinse.', order: 'Right after the shampoo.'},
  leavein:    {how: 'Coin-sized amount on soaking-wet hair, head tipped forward.', order: 'Straight out of the shower, after the conditioner.'},
  gel:        {how: 'Same amount as the leave-in, scrunched upward. Do not touch it while it dries.', order: 'Right after the leave-in.'},
  towel:      {how: 'Plop the curls into it for 10 minutes, then let the hair air-dry.', order: 'Last, straight after the gel.'},
  adapalene:  {how: 'One pea-sized amount for the whole face, a thin layer, on completely dry skin.', order: 'Evening: cleanser \u2192 wait until dry \u2192 adapalene \u2192 moisturiser.'},
  toothpaste: {how: 'Pea-sized amount, 2 minutes, spit but do not rinse.', order: 'After the tongue scraper and the floss.'},
  bodywash:   {how: 'Coin-sized amount, wash, rinse well.', order: 'In the shower. The face gets its own cleanser.'},
  deo:        {how: 'Two or three strokes per armpit on clean, dry skin.', order: 'After the shower, before your shirt.'},
  bodylotion: {how: 'Coin-sized amount on the dry spots: shins, arms, hands.', order: 'Straight after the shower, skin almost dry.'}
};

// 4-step how-to pictures. [caption shown in the app, what the picture shows]. look = how the product appears in every picture.
const STEP_PICS = {
  cleanser: {look: 'a white pump bottle of foaming face cleanser', steps: [
    ['Wet your face with lukewarm water', 'leaning over the sink, splashing lukewarm water onto his face with both cupped hands'],
    ['A pea-sized amount in your wet hands', 'showing his open wet palm to the camera with one pea-sized drop of clear gel cleanser in the middle, the pump bottle on the sink behind'],
    ['Massage 30 seconds in small circles', 'massaging a light white foam over his cheeks and chin with his fingertips in small circles, eyes closed'],
    ['Rinse, then pat dry. Do not rub', 'gently pressing a clean white towel against his cheeks to pat his face dry']]},
  moist: {look: 'a small white tube of light face moisturiser', steps: [
    ['A pea-sized amount on your fingertip', 'close-up of his index fingertip holding one pea-sized amount of white lotion, the small tube in his other hand'],
    ['Five dots: forehead, cheeks, nose, chin', 'looking into the mirror with five small dots of white lotion on his forehead, both cheeks, nose and chin'],
    ['Spread upward and outward', 'spreading the lotion upward and outward across both cheeks with flat fingers'],
    ['The rest on your neck, let it sink in', 'smoothing the last bit of lotion down the front of his neck, his face looking fresh and calm']]},
  spf: {look: 'a slim white tube of face sun cream, factor 50', steps: [
    ['Two finger-lengths of sun cream', 'holding his index and middle finger toward the camera with a line of white sun cream along the full length of both fingers'],
    ['Dot it over the whole face', 'looking into the mirror with dots of white sun cream on his forehead, cheeks, nose and chin'],
    ['Spread evenly. Ears and neck too', 'spreading the sun cream evenly over his cheek, in front of his ear and down his neck with flat fingers'],
    ['Last step every morning, even when cloudy', 'standing by a bright window in the morning, ready to leave, his skin looking even and not shiny']]},
  bpo: {look: 'a small white pharmacy tube of acne gel', steps: [
    ['Evening: clean face, wait until completely dry', 'in the evening with warm lamp light, looking at his clean, dry face in the mirror, a towel over his shoulder'],
    ['A pea-sized amount on your fingertip', 'close-up of his index fingertip holding one pea-sized dab of clear gel, the small tube in his other hand'],
    ['Dot it on cheeks and jaw only', 'dotting tiny amounts of clear gel along his cheeks and jawline, nowhere near his eyes or lips'],
    ['Spread thin. Wait 10 minutes, then moisturiser', 'spreading the gel into a thin, invisible layer over his cheek with two fingertips']]},
  adapalene: {look: 'a small white tube of prescription face gel', steps: [
    ['Evening: clean face, wait 20 minutes until dry', 'sitting on the edge of his bed in the evening with a clean, dry face, warm lamp light, relaxed'],
    ['ONE pea-sized amount for the whole face', 'close-up of his fingertip holding one pea-sized amount of white gel'],
    ['Dot on forehead, cheeks and chin', 'looking into the mirror with five tiny dots of white gel on his forehead, both cheeks and chin'],
    ['Spread thin. Not near eyes, lips or nose corners', 'spreading the gel into a thin layer over his cheek with two fingertips, his eyes and lips left untouched']]},
  lipbalm: {look: 'a lip balm stick', steps: [
    ['After the sun cream, take the cap off', 'holding a lip balm stick with the cap off in front of the bathroom mirror'],
    ['Swipe 2 or 3 times over each lip', 'swiping the lip balm stick across his lower lip, close-up of the lower face'],
    ['Press your lips together', 'pressing his lips together gently to spread the balm, close-up of the lower face'],
    ['Again whenever your lips feel dry', 'outside on a sunny street, putting on lip balm again']]},
  toothbrush: {look: 'a white electric toothbrush with a small round head', steps: [
    ['A pea-sized amount of toothpaste', 'squeezing a pea-sized amount of toothpaste onto the round head of an electric toothbrush'],
    ['Angle the head to the gumline', 'close-up, the round brush head angled against the gumline of his upper teeth'],
    ['Slowly, tooth by tooth, for 2 minutes', 'brushing the inner sides of his lower teeth, looking into the mirror'],
    ['Spit, but do not rinse with water', 'leaning over the sink spitting out toothpaste foam, no water glass in sight']]},
  floss: {look: 'a small white container of dental floss', steps: [
    ['Pull out about 40 cm (arm-length)', 'pulling a long piece of floss out of a small container, about the length of his forearm'],
    ['Wind it round both middle fingers', 'close-up of his hands with the floss wound around both middle fingers and a short tight piece held between his thumbs'],
    ['Slide between two teeth, curve round one tooth', 'sliding the floss gently between two front teeth, close-up of his mouth'],
    ['Up and down, then the next gap', 'flossing a back tooth, looking into the mirror']]},
  scraper: {look: 'a U-shaped stainless steel tongue scraper', steps: [
    ['Every morning, before drinking or brushing', 'holding a U-shaped metal tongue scraper by both ends in front of the mirror in the morning'],
    ['Tongue out, place it at the back', 'with his tongue stuck out, placing the scraper gently on the back of his tongue'],
    ['Pull forward gently, 3 or 4 times', 'pulling the scraper forward along his tongue'],
    ['Rinse the scraper under the tap', 'rinsing the tongue scraper under the running tap']]},
  shampoo: {look: 'a bottle of curl shampoo', steps: [
    ['Wet your hair completely', 'standing under the shower with water running through his curly hair, eyes closed'],
    ['A coin-sized amount in your palm', 'showing his palm with a coin-sized pool of shampoo, in the shower'],
    ['Scalp only: massage with your fingertips', 'massaging shampoo foam into his scalp with his fingertips, the lengths of his curls left alone'],
    ['Rinse well. The foam cleans the ends', 'rinsing his hair under the shower, foam running down through his curls']]},
  cond: {look: 'a bottle of hair conditioner', steps: [
    ['Gently squeeze the water out', 'gently squeezing the water out of his curls with both hands in the shower'],
    ['A generous amount in your palms', 'showing a generous amount of white conditioner in his cupped palm'],
    ['Lengths and ends only, not the scalp', 'smoothing white conditioner through the lengths and ends of his curls'],
    ['Comb with your fingers, rinse with cool water', 'finger-combing his curls under a cool shower']]},
  leavein: {look: 'a round tub of white leave-in hair cream', steps: [
    ['Hair soaking wet, head tipped forward', 'with his head tipped forward over the sink, his curly hair soaking wet and dripping'],
    ['A coin-sized amount, rub your palms', 'rubbing a coin-sized amount of white cream between his palms'],
    ['Rake it through with your fingers', 'raking the cream through his wet curls with spread fingers, head tipped forward'],
    ['Smooth it over the top', 'gently smoothing his flat palms over the top of his wet curls']]},
  gel: {look: 'a clear squeeze tube of curl styling gel', steps: [
    ['Right after the leave-in, hair still wet', 'holding a clear tube of styling gel next to his wet curly hair'],
    ['A walnut-sized amount in your palm', 'showing a walnut-sized amount of clear gel in his palm'],
    ['Glide it over, then scrunch upward', 'scrunching gel upward into his wet curls with cupped palms'],
    ['Let it dry, then scrunch out the hard feel', 'with dry, defined, soft curls, gently scrunching them with dry hands']]},
  towel: {look: 'a grey microfibre hair towel', steps: [
    ['Lay the towel flat', 'laying a grey microfibre towel flat on the bathroom counter'],
    ['Lower your wet curls onto it', 'bending forward so his wet curls rest on the flat towel'],
    ['Wrap it up and tie it', 'with his curls wrapped on top of his head in the grey towel, tied at the forehead'],
    ['10 minutes, then let it air-dry', 'taking the towel off, defined curls drying in the air']]},
  trimmer: {look: 'a black beard trimmer', steps: [
    ['Clip on the 3 to 4 mm guard', 'clipping a short guard onto a black beard trimmer'],
    ['Trim against the way it grows', 'running the trimmer upward along his jaw against the growth'],
    ['Leave the cheek line natural', 'trimming carefully along the edge of his beard on the cheek, not shaving above it'],
    ['Neckline: two fingers above the Adam\'s apple', 'with two fingers placed above his Adam\'s apple to mark the neckline, trimmer below them']]},
  bodywash: {look: 'a white bottle of shower gel', steps: [
    ['Warm water, not hot', 'in the shower, framed from the chest up, warm water running over his shoulders'],
    ['A coin-sized amount in your hand', 'showing a coin-sized amount of shower gel in his palm, in the shower'],
    ['Chest, armpits, back, then rinse well', 'lathering shower gel on his chest and shoulders, framed from the chest up'],
    ['Pat dry with the towel', 'patting his shoulders dry with a towel after the shower, framed from the chest up']]},
  deo: {look: 'a white stick deodorant', steps: [
    ['Armpits clean and completely dry', 'drying his armpit with a towel, wearing a towel around his waist, framed from the chest up'],
    ['Two or three strokes under each arm', 'applying stick deodorant to his armpit, framed from the chest up'],
    ['Let it dry for a minute', 'waiting with his arms slightly away from his body, looking relaxed'],
    ['Then put your shirt on', 'pulling a clean white t-shirt over his head']]},
  bodylotion: {look: 'a white bottle of body lotion', steps: [
    ['After the shower, skin almost dry', 'after a shower, lightly patting his arm with a towel'],
    ['A coin-sized amount in your palm', 'showing a coin-sized amount of white lotion in his palm'],
    ['Rub it into shins and knees', 'sitting on the edge of the bathtub rubbing lotion into his shin'],
    ['Then arms, elbows and hands', 'rubbing lotion into his forearm and elbow']]}
};
STEP_PICS.toothpaste = {same: 'toothbrush'};
// Order to make them in: daily face first.
const STEP_BATCHES = [
  ['Batch 1: your face, every day', ['cleanser', 'moist', 'spf', 'bpo', 'lipbalm']],
  ['Batch 2: teeth and mouth', ['toothbrush', 'floss', 'scraper']],
  ['Batch 3: hair (wash days)', ['shampoo', 'cond', 'leavein', 'gel', 'towel']],
  ['Batch 4: body and beard', ['bodywash', 'deo', 'bodylotion', 'trimmer']],
  ['Batch 5: after the doctor', ['adapalene']]
];
const STEP_PREFIX = 'Use the same man as in the reference photo: same face, same curly hair, same skin and stubble. Photorealistic photo, clean white bathroom, soft natural window light. ';
const STEP_END = ' Framed close so the action and the amount are easy to see. Vertical 3:4. No text, no numbers, no labels, no logos, no watermark. Natural hands with five fingers.';
