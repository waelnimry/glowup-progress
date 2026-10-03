// Recipe library. ingredients = [foodId, grams (raw/dry weight)]. Macros are computed from foods.js, never typed.
// Steps and videos for the 14 weekly-menu dishes come from the original routine app. Extras have no video on purpose.
const RECIPES = {
 "b_quark": {
  "id": "b_quark",
  "n": "Quark bowl",
  "slots": [
   "breakfast"
  ],
  "ing": [
   [
    "quark",
    300
   ],
   [
    "oats",
    40
   ],
   [
    "berries",
    100
   ]
  ],
  "steps": [
   "Put 300 g Magerquark and 40 g oats in a bowl.",
   "Add 100 g frozen berries and a pinch of cinnamon.",
   "Stir and wait 5 minutes so the oats soften and the berries thaw.",
   "Eat it with a black coffee."
  ],
  "v": "",
  "vt": ""
 },
 "b_pancake": {
  "id": "b_pancake",
  "n": "Quark oat pancake",
  "slots": [
   "breakfast"
  ],
  "ing": [
   [
    "egg",
    55
   ],
   [
    "oats",
    40
   ],
   [
    "quark",
    200
   ],
   [
    "banana",
    60
   ],
   [
    "oil",
    2
   ]
  ],
  "steps": [
   "Mash half a banana in a bowl. Add 1 egg, 40 g oats and 100 g of the quark. Stir to a thick batter.",
   "Pan on medium heat with a few drops of oil. Pour in the batter as one large pancake.",
   "Cook 3 minutes per side, until golden and set.",
   "Serve with the other 100 g of quark on top."
  ],
  "v": "",
  "vt": ""
 },
 "p_quark": {
  "id": "p_quark",
  "n": "Pre-gym quark & banana",
  "slots": [
   "pre"
  ],
  "ing": [
   [
    "quark",
    250
   ],
   [
    "banana",
    120
   ]
  ],
  "steps": [
   "Put 250 g Magerquark in a bowl.",
   "Slice the banana over it. Eat 60 to 90 minutes before training."
  ],
  "v": "",
  "vt": ""
 },
 "p_whey": {
  "id": "p_whey",
  "n": "Pre-gym whey shake & banana",
  "slots": [
   "pre"
  ],
  "ing": [
   [
    "whey",
    30
   ],
   [
    "banana",
    120
   ],
   [
    "quark",
    50
   ]
  ],
  "steps": [
   "Put 30 g whey, the banana and 50 g quark in a shaker or blender with 250 ml water.",
   "Shake or blend until smooth. Drink 60 to 90 minutes before training."
  ],
  "v": "",
  "vt": ""
 },
 "n_quark": {
  "id": "n_quark",
  "n": "Night quark",
  "slots": [
   "night"
  ],
  "ing": [
   [
    "quark",
    200
   ]
  ],
  "steps": [
   "200 g Magerquark in a bowl with cinnamon. Kitchen closes after this."
  ],
  "v": "",
  "vt": ""
 },
 "n_almond": {
  "id": "n_almond",
  "n": "Night quark & almonds",
  "slots": [
   "night"
  ],
  "ing": [
   [
    "quark",
    200
   ],
   [
    "almonds",
    10
   ]
  ],
  "steps": [
   "200 g Magerquark in a bowl, cinnamon on top.",
   "Chop 10 g almonds and sprinkle over it. Kitchen closes after this."
  ],
  "v": "",
  "vt": ""
 },
 "l1": {
  "id": "l1",
  "n": "Chicken, rice & broccoli",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "chicken",
    200
   ],
   [
    "rice",
    40
   ],
   [
    "broccoli",
    200
   ],
   [
    "oil",
    5
   ],
   [
    "soy",
    15
   ]
  ],
  "steps": [
   "Rice from the Sunday batch into the microwave (or cook 120 g now — see Basics).",
   "Cut 200 g chicken breast into strips. Salt, pepper, a pinch of garlic powder.",
   "Pan on high, 1 tsp oil. Chicken in one layer, do not touch it for 3 min. Turn, 3 more min.",
   "200 g frozen broccoli in a bowl with 2 tbsp water, microwave 4 min.",
   "Off the heat: 1 tbsp soy sauce and a squeeze of lemon over the chicken. Plate with rice and broccoli."
  ],
  "v": "ueRnEVaabiQ",
  "vt": "Pan chicken, never dry (4 min)"
 },
 "d1": {
  "id": "d1",
  "n": "Beef patties, potatoes & salad",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "mince",
    200
   ],
   [
    "potato",
    250
   ],
   [
    "onion",
    50
   ],
   [
    "lettuce",
    100
   ],
   [
    "tomato",
    100
   ],
   [
    "cucumber",
    100
   ],
   [
    "almonds",
    15
   ],
   [
    "mustard",
    5
   ],
   [
    "oil",
    3
   ]
  ],
  "steps": [
   "Oven 220 °C. 250 g potatoes cut into wedges, spray or ½ tsp oil, salt, paprika, on a tray — 25 min, turn once.",
   "In a bowl: 200 g Rinderhackfleisch light, ½ onion grated, 1 tsp mustard, salt, pepper. Mix with a fork, shape 2 flat patties.",
   "Pan on medium-high, no extra oil needed. 4 min a side, until brown and firm.",
   "Salad: lettuce, tomato, cucumber, lemon, salt. 15 g nuts on the salad.",
   "Plate patties, wedges, salad."
  ],
  "v": "Q9dzYVhKKD8",
  "vt": "Frikadellen (short)"
 },
 "l2": {
  "id": "l2",
  "n": "Oven chicken & vegetables",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "chicken",
    200
   ],
   [
    "pepper",
    100
   ],
   [
    "onion",
    50
   ],
   [
    "courgette",
    100
   ],
   [
    "rice",
    40
   ],
   [
    "oil",
    5
   ]
  ],
  "steps": [
   "Oven 200 °C. Tray with baking paper.",
   "200 g chicken breast whole; 1 pepper, ½ onion, ½ courgette in chunks.",
   "Everything on the tray, 1 tsp oil, paprika, thyme, salt, pepper. Toss with your hands.",
   "20 min. Chicken is done when the thickest part is white all the way through.",
   "Bulgur or rice from the batch on the side."
  ],
  "v": "mTJZravR5Js",
  "vt": "One-pan chicken & veggies (6 min)"
 },
 "d2": {
  "id": "d2",
  "n": "Tuna potato salad",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "tuna",
    224
   ],
   [
    "potato",
    250
   ],
   [
    "beans",
    300
   ],
   [
    "cucumber",
    50
   ],
   [
    "tomato",
    100
   ],
   [
    "onion",
    20
   ],
   [
    "oil",
    5
   ],
   [
    "mustard",
    5
   ]
  ],
  "steps": [
   "250 g boiled potatoes from the batch, cut into cubes (or boil 15 min now).",
   "300 g frozen green beans: microwave 4 min with a splash of water.",
   "Drain 2 cans of tuna in water.",
   "Bowl: potatoes, beans, tuna, ½ cucumber, 1 tomato, ¼ red onion sliced thin.",
   "Dressing: 1 tsp oil, juice of ½ lemon, 1 tsp mustard, pepper. Toss. Eat warm or cold."
  ],
  "v": "Ys9psc6IVQk",
  "vt": "Tuna potato salad (short)"
 },
 "l3": {
  "id": "l3",
  "n": "Chicken in tomato sauce & rice",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "chicken",
    200
   ],
   [
    "frozenveg",
    200
   ],
   [
    "passata",
    100
   ],
   [
    "quark",
    50
   ],
   [
    "rice",
    40
   ],
   [
    "oil",
    5
   ]
  ],
  "steps": [
   "200 g chicken in cubes, salt, pepper. Pan on high, 1 tsp oil, brown 4 min.",
   "Add 1 clove garlic (or ½ tsp powder), 200 g frozen vegetables, 100 g passata, 50 ml water, oregano.",
   "Lid on, medium heat, 8 min.",
   "Off the heat, stir in 50 g Magerquark — it turns creamy.",
   "Over rice from the batch."
  ],
  "v": "Y60rTWRKSAs",
  "vt": "Chicken in tomato sauce (10 min)"
 },
 "d3": {
  "id": "d3",
  "n": "Fish & lentil stew",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "lentils",
    60
   ],
   [
    "onion",
    50
   ],
   [
    "carrot",
    80
   ],
   [
    "passata",
    200
   ],
   [
    "seelachs",
    200
   ],
   [
    "broccoli",
    200
   ]
  ],
  "steps": [
   "Pot: ½ onion and 1 carrot chopped, 1 tsp oil, 3 min.",
   "Add 60 g red lentils, 200 g passata, 300 ml water, paprika, salt. Simmer 15 min, stir now and then.",
   "Lay 200 g Seelachs fillet (straight from frozen is fine) on top, lid on, 8–10 min until it flakes.",
   "200 g frozen vegetables microwaved on the side, or stirred into the pot.",
   "Lemon over everything."
  ],
  "v": "SkQMi5Ipn9c",
  "vt": "Lentil fish stew (8 min)"
 },
 "l4": {
  "id": "l4",
  "n": "Chicken stir-fry",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "chicken",
    200
   ],
   [
    "pepper",
    100
   ],
   [
    "onion",
    50
   ],
   [
    "frozenveg",
    100
   ],
   [
    "rice",
    40
   ],
   [
    "oil",
    5
   ],
   [
    "soy",
    15
   ]
  ],
  "steps": [
   "Cut first, cook second: 200 g chicken in strips; 1 pepper and ½ onion in strips; 100 g frozen vegetables ready.",
   "Pan as hot as it goes, 1 tsp oil. Chicken 3 min, turn, 2 min. Take it out.",
   "Vegetables into the same pan, 4 min, keep them moving. Garlic and ginger if you have it.",
   "Chicken back in, 1 tbsp soy sauce, 1 min.",
   "Over rice from the batch."
  ],
  "v": "rR8Nm5aok0Y",
  "vt": "20-minute chicken stir-fry"
 },
 "d4": {
  "id": "d4",
  "n": "Beef & lentil chili",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "mince",
    200
   ],
   [
    "onion",
    50
   ],
   [
    "pepper",
    100
   ],
   [
    "passata",
    200
   ],
   [
    "lentils",
    60
   ]
  ],
  "steps": [
   "Pot on high: 200 g mince, brown it 4 min, breaking it up.",
   "Add ½ onion and 1 pepper chopped, 2 min.",
   "Add 200 g passata, 60 g red lentils, 300 ml water, 1 tsp cumin, 1 tsp paprika, a little chili, salt.",
   "Simmer 20 min with the lid half on, stir twice. Done when the lentils are soft.",
   "No rice, no bread — the lentils are the carb. 15 g nuts on the side."
  ],
  "v": "veRvIqvh0do",
  "vt": "Lentil & beef chili (5 min)"
 },
 "l5": {
  "id": "l5",
  "n": "Grilled chicken & potato salad",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "chicken",
    200
   ],
   [
    "potato",
    250
   ],
   [
    "cucumber",
    100
   ],
   [
    "onion",
    20
   ],
   [
    "oil",
    5
   ],
   [
    "mustard",
    5
   ],
   [
    "vinegar",
    10
   ]
  ],
  "steps": [
   "250 g boiled potatoes from the batch, sliced (this replaces the rice today).",
   "Dressing: 1 tsp oil, 1 tbsp vinegar, 1 tsp mustard, salt, pepper, ¼ onion very fine, ½ cucumber sliced, chives if you have them. Mix with the warm potatoes.",
   "200 g chicken breast, salt, pepper, paprika. Pan on high, 1 tsp oil, 5 min a side, lid on for the last 3.",
   "Rest the chicken 2 min, slice.",
   "200 g vegetables or salad on the side."
  ],
  "v": "7Vx6Nsyc8Mc",
  "vt": "German potato salad, no mayo (5 min)"
 },
 "d5": {
  "id": "d5",
  "n": "Baked fish, wedges & peas",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "seelachs",
    200
   ],
   [
    "potato",
    250
   ],
   [
    "peas",
    300
   ],
   [
    "almonds",
    15
   ]
  ],
  "steps": [
   "Oven 200 °C. 250 g potato wedges on one side of the tray, spray of oil, salt, paprika — in first, 10 min head start.",
   "200 g Seelachs or cod on baking paper, lemon juice, pepper, salt, a little paprika. Onto the tray, 15 min.",
   "300 g frozen peas and carrots: microwave 4 min.",
   "Plate, 15 g almonds crushed over the fish, more lemon."
  ],
  "v": "6GezOb4k6uY",
  "vt": "Lemon pepper baked fish (2 min)"
 },
 "l6": {
  "id": "l6",
  "n": "Prep box",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "chicken",
    200
   ],
   [
    "rice",
    40
   ],
   [
    "frozenveg",
    200
   ]
  ],
  "steps": [
   "From the Sunday batch: 200 g cooked chicken, 120 g rice, 200 g frozen vegetables.",
   "Microwave 3 min. Hot sauce, mustard or lemon.",
   "That is it. Zero cooking on Saturday lunch."
  ],
  "v": "",
  "vt": ""
 },
 "d6": {
  "id": "d6",
  "n": "Chicken omelette & wedges",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "egg",
    220
   ],
   [
    "chicken",
    100
   ],
   [
    "spinach",
    50
   ],
   [
    "tomato",
    50
   ],
   [
    "onion",
    20
   ],
   [
    "pepper",
    50
   ],
   [
    "potato",
    250
   ],
   [
    "oil",
    5
   ]
  ],
  "steps": [
   "Oven 220 °C, 250 g potato wedges, 25 min.",
   "4 eggs whisked with salt and pepper. 100 g cooked chicken from the batch in small pieces.",
   "Pan on medium, 1 tsp oil. Onion and pepper 2 min, a handful of spinach until it wilts.",
   "Eggs in, let them set 1 min, chicken on top, fold in half when the top is nearly set.",
   "Tomato on the side."
  ],
  "v": "G1T5oNov6cc",
  "vt": "How to make an omelette (4 min)"
 },
 "l0": {
  "id": "l0",
  "n": "Chicken salad plate",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "chicken",
    200
   ],
   [
    "rice",
    40
   ],
   [
    "lettuce",
    100
   ],
   [
    "tomato",
    100
   ],
   [
    "cucumber",
    100
   ],
   [
    "onion",
    20
   ],
   [
    "oil",
    5
   ],
   [
    "vinegar",
    10
   ]
  ],
  "steps": [
   "200 g chicken breast, salt, pepper, paprika. Pan on high, 1 tsp oil, 5 min a side, lid on for the last 3. Rest 2 min, slice.",
   "Big salad: lettuce, tomato, cucumber, radish, red onion.",
   "Dressing: 1 tsp oil, 1 tbsp vinegar, salt, pepper.",
   "Rice from the batch on the side."
  ],
  "v": "ueRnEVaabiQ",
  "vt": "Pan chicken, never dry (4 min)"
 },
 "d0": {
  "id": "d0",
  "n": "Lentil-rice pilaf & chicken",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "lentils",
    60
   ],
   [
    "rice",
    30
   ],
   [
    "onion",
    50
   ],
   [
    "oil",
    5
   ],
   [
    "chicken",
    150
   ],
   [
    "lettuce",
    100
   ],
   [
    "tomato",
    100
   ],
   [
    "cucumber",
    50
   ],
   [
    "quark",
    30
   ]
  ],
  "steps": [
   "Pot: 60 g lentils (brown or green) + 300 ml water, simmer 15 min.",
   "Add 30 g rice and a stock cube, lid on, 12 more min until the water is gone.",
   "Pan: ½ onion sliced, 1 tsp oil, medium heat, 8 min until golden. Stir into the pot.",
   "150 g cooked chicken from the batch on top, warmed.",
   "Salad, 2 tbsp Magerquark with herbs and salt as the sauce. No nuts tonight."
  ],
  "v": "K4g6f2V9BPY",
  "vt": "Lentil rice pilaf (6 min)"
 },
 "x_salmon_rice": {
  "id": "x_salmon_rice",
  "n": "Salmon, rice & broccoli",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "salmon",
    150
   ],
   [
    "rice",
    40
   ],
   [
    "broccoli",
    200
   ],
   [
    "oil",
    3
   ]
  ],
  "steps": [
   "Thaw 150 g salmon in the fridge overnight, or in cold water for 30 minutes. Pat dry, salt and pepper.",
   "Cook 40 g dry rice (about 120 g cooked), or use rice from the Sunday batch.",
   "Pan on medium-high with a few drops of oil. Salmon 3 to 4 minutes per side, until it turns opaque and flakes.",
   "Microwave 200 g frozen broccoli with 2 tbsp water for 4 minutes.",
   "Plate with a squeeze of lemon."
  ],
  "v": "",
  "vt": ""
 },
 "x_salmon_potato": {
  "id": "x_salmon_potato",
  "n": "Baked salmon, potatoes & green beans",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "salmon",
    150
   ],
   [
    "potato",
    250
   ],
   [
    "beans",
    300
   ],
   [
    "oil",
    3
   ]
  ],
  "steps": [
   "Oven 200 °C. 250 g potatoes in wedges on a tray with a few drops of oil, paprika, salt. 10 minutes first.",
   "Add the thawed, dried 150 g salmon to the tray with lemon and pepper. 15 more minutes.",
   "Microwave 300 g frozen green beans with a splash of water for 4 minutes.",
   "Plate it all together."
  ],
  "v": "",
  "vt": ""
 },
 "x_tuna_bowl": {
  "id": "x_tuna_bowl",
  "n": "Tuna rice bowl",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "tuna",
    224
   ],
   [
    "rice",
    50
   ],
   [
    "peas",
    150
   ],
   [
    "cucumber",
    100
   ],
   [
    "mustard",
    5
   ],
   [
    "vinegar",
    10
   ]
  ],
  "steps": [
   "Cook 50 g dry rice (or use batch rice) and let it cool for 5 minutes.",
   "Microwave 150 g frozen peas & carrots for 3 minutes.",
   "Drain 2 cans of tuna.",
   "Bowl: rice, peas & carrots, tuna, sliced cucumber.",
   "Dressing: 1 tsp mustard, 1 tbsp vinegar, pepper. Stir through."
  ],
  "v": "",
  "vt": ""
 },
 "x_lentil_soup": {
  "id": "x_lentil_soup",
  "n": "Chicken & lentil soup",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "chicken",
    200
   ],
   [
    "lentils",
    50
   ],
   [
    "carrot",
    100
   ],
   [
    "onion",
    50
   ],
   [
    "passata",
    100
   ],
   [
    "oil",
    5
   ]
  ],
  "steps": [
   "Dice 1 onion (50 g) and 100 g carrot. Soften in a pot with 1 tsp oil for 3 minutes.",
   "Add 50 g red lentils, 100 g passata, 400 ml water, salt, pepper, a pinch of cumin.",
   "Simmer 15 minutes.",
   "Cut 200 g chicken into small cubes, add, and simmer 8 more minutes until white all the way through."
  ],
  "v": "",
  "vt": ""
 },
 "x_fried_rice": {
  "id": "x_fried_rice",
  "n": "Egg & chicken fried rice",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "egg",
    110
   ],
   [
    "chicken",
    150
   ],
   [
    "rice",
    50
   ],
   [
    "frozenveg",
    150
   ],
   [
    "soy",
    15
   ],
   [
    "oil",
    5
   ]
  ],
  "steps": [
   "Use cooled rice from the batch (or cook 50 g dry and cool it).",
   "Pan on high with 1 tsp oil. Cubed 150 g chicken, 5 minutes until cooked through.",
   "Add 150 g frozen vegetables, 3 minutes. Push everything aside.",
   "Crack 2 eggs into the gap, scramble, then stir everything together with the rice and 1 tbsp soy sauce."
  ],
  "v": "",
  "vt": ""
 },
 "x_mince_bowl": {
  "id": "x_mince_bowl",
  "n": "Beef mince & rice bowl",
  "slots": [
   "lunch",
   "dinner"
  ],
  "ing": [
   [
    "mince",
    200
   ],
   [
    "rice",
    40
   ],
   [
    "frozenveg",
    200
   ],
   [
    "passata",
    50
   ]
  ],
  "steps": [
   "Cook 40 g dry rice, or use batch rice.",
   "Dry pan on medium-high. 200 g mince, break it up, 6 minutes until brown.",
   "Add 200 g frozen vegetables and 50 g passata, salt, pepper, paprika. 5 minutes.",
   "Serve over the rice."
  ],
  "v": "",
  "vt": ""
 }
};
// Default plan: fixed breakfast / pre-gym / night, and lunch + dinner by weekday (0 = Sunday).
const ROTATION = {"breakfast":"b_quark","pre":"p_quark","night":"n_quark","lunch":{"0":"l0","1":"l1","2":"l2","3":"l3","4":"l4","5":"l5","6":"l6"},"dinner":{"0":"d0","1":"d1","2":"d2","3":"d3","4":"d4","5":"d5","6":"d6"}};
const SLOTS = [
  {id:'breakfast', label:'Breakfast', time:'07:30', kcal:380, p:38},
  {id:'lunch',     label:'Lunch',     time:'13:00', kcal:460, p:49},
  {id:'pre',       label:'Pre-gym',   time:'16:30', kcal:260, p:31},
  {id:'dinner',    label:'Dinner',    time:'19:30', kcal:590, p:46},
  {id:'night',     label:'Night',     time:'21:00', kcal:135, p:24}
];
const TARGET = {kcal:1850, p:180};
