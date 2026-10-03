// Ingredient database. k/p/c/f = kcal, protein, carbs, fat per 100 g (standard food-table values).
// pack = usual shop pack in grams, price = approx EUR per pack (Lidl-level; "~" in the UI).
// est:true marks prices I estimated; the rest come from the Lidl list in 45-Meals.md.
// staple:true = pantry basics (spices, oil, sauces): never blocks a meal, listed once under Basics.
// piece = grams of one piece, for items counted in pieces.
const FOODS = {
  chicken:   {n:'Chicken breast',            cat:'Protein', k:107, p:22.5, c:0,    f:1.5,  pack:1000, price:6.8},
  mince:     {n:'Beef mince, light 5 %',     cat:'Protein', k:125, p:21,   c:0,    f:5,    pack:400,  price:5.99},
  tuna:      {n:'Tuna in water (drained)',   cat:'Protein', k:105, p:24,   c:0,    f:1,    pack:112,  price:1.3, piece:112, unit:'can'},
  seelachs:  {n:'Seelachs (pollock), frozen',cat:'Protein', k:80,  p:17,   c:0,    f:1,    pack:500,  price:3.99},
  salmon:    {n:'Salmon fillet, frozen',     cat:'Protein', k:200, p:20,   c:0,    f:13,   pack:500,  price:5.99, est:true},
  egg:       {n:'Eggs',                      cat:'Protein', k:143, p:12.6, c:0.7,  f:9.5,  pack:550,  price:2.29, piece:55, unit:'egg'},
  quark:     {n:'Magerquark 0.2 %',          cat:'Dairy',   k:67,  p:12,   c:4,    f:0.2,  pack:500,  price:1.09},
  whey:      {n:'Whey protein powder',       cat:'Protein', k:400, p:80,   c:6,    f:6,    pack:1000, price:20,   est:true},
  oats:      {n:'Rolled oats',               cat:'Carbs',   k:372, p:13,   c:59,   f:7,    pack:500,  price:0.79},
  rice:      {n:'Rice or bulgur (dry)',      cat:'Carbs',   k:350, p:7.5,  c:75,   f:1,    pack:1000, price:1.5, est:true},
  potato:    {n:'Potatoes',                  cat:'Carbs',   k:70,  p:2,    c:15,   f:0.1,  pack:2500, price:2.49},
  lentils:   {n:'Red lentils (dry)',         cat:'Carbs',   k:340, p:24,   c:50,   f:1.5,  pack:500,  price:1.49},
  banana:    {n:'Bananas',                   cat:'Fruit',   k:90,  p:1.1,  c:20,   f:0.3,  pack:840,  price:1.6,  piece:120, unit:'banana'},
  berries:   {n:'Frozen berry mix',          cat:'Fruit',   k:45,  p:1,    c:8,    f:0.3,  pack:750,  price:2.69},
  broccoli:  {n:'Frozen broccoli',           cat:'Veg',     k:30,  p:3,    c:3,    f:0.3,  pack:750,  price:1.8,  est:true},
  frozenveg: {n:'Frozen mixed vegetables',   cat:'Veg',     k:45,  p:3,    c:7,    f:0.5,  pack:1000, price:1.8,  est:true},
  beans:     {n:'Frozen green beans',        cat:'Veg',     k:30,  p:2,    c:4,    f:0.2,  pack:750,  price:1.5,  est:true},
  peas:      {n:'Frozen peas & carrots',     cat:'Veg',     k:55,  p:3.5,  c:8,    f:0.5,  pack:750,  price:1.5,  est:true},
  spinach:   {n:'Frozen spinach',            cat:'Veg',     k:23,  p:3,    c:1,    f:0.4,  pack:450,  price:1.29, est:true},
  pepper:    {n:'Bell peppers',              cat:'Veg',     k:30,  p:1,    c:5,    f:0.3,  pack:400,  price:1.79, est:true},
  onion:     {n:'Onions',                    cat:'Veg',     k:40,  p:1.1,  c:8,    f:0.1,  pack:1000, price:1.29, est:true},
  courgette: {n:'Courgette',                 cat:'Veg',     k:18,  p:1.5,  c:2,    f:0.3,  pack:400,  price:1.19, est:true},
  carrot:    {n:'Carrots',                   cat:'Veg',     k:35,  p:0.9,  c:7,    f:0.2,  pack:1000, price:0.99, est:true},
  tomato:    {n:'Tomatoes',                  cat:'Veg',     k:18,  p:0.9,  c:3,    f:0.2,  pack:500,  price:1.49, est:true},
  cucumber:  {n:'Cucumber',                  cat:'Veg',     k:12,  p:0.7,  c:2,    f:0.1,  pack:400,  price:0.69, est:true},
  lettuce:   {n:'Lettuce / salad',           cat:'Veg',     k:15,  p:1.3,  c:1.5,  f:0.2,  pack:300,  price:1.29, est:true},
  passata:   {n:'Passata',                   cat:'Veg',     k:30,  p:1.4,  c:5,    f:0.2,  pack:500,  price:0.79},
  almonds:   {n:'Almonds / nuts',            cat:'Fat',     k:600, p:21,   c:10,   f:52,   pack:200,  price:2.99, est:true},
  // ---- basics: never block a meal, bought once ----
  oil:       {n:'Olive oil',                 cat:'Basics',  k:884, p:0,    c:0,    f:100,  pack:750,  price:5.99, staple:true, est:true},
  soy:       {n:'Soy sauce',                 cat:'Basics',  k:60,  p:8,    c:5,    f:0,    pack:250,  price:1.29, staple:true, est:true},
  mustard:   {n:'Mustard',                   cat:'Basics',  k:70,  p:4,    c:5,    f:4,    pack:200,  price:0.89, staple:true, est:true},
  vinegar:   {n:'Vinegar',                   cat:'Basics',  k:20,  p:0,    c:1,    f:0,    pack:500,  price:0.99, staple:true, est:true},
  lemon:     {n:'Lemon',                     cat:'Basics',  k:29,  p:1,    c:9,    f:0.3,  pack:200,  price:0.99, staple:true, est:true},
  spices:    {n:'Spices (salt, pepper, paprika, garlic, oregano, thyme, cumin, chili, cinnamon)', cat:'Basics', k:0, p:0, c:0, f:0, pack:1, price:6, staple:true, est:true}
};
