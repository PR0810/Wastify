-- ============================================================
-- Migration: Add 6 Learning Modules + 30 Quiz Questions
-- ============================================================

-- MODULE 1: Waste Detective (green-teal)
INSERT INTO learning_modules (title, description, age_group, level, content, video_url, order_index)
VALUES (
  'Waste Detective 🏅',
  'Waste ko pehchano aur jaano ki use alag kyun karte hain.',
  'teens',
  'beginner',
  '{
    "type": "slides",
    "slides": [
      {
        "title": "Waste kya hai? 🗑️",
        "body": "Jo cheez hum use karke phenk dete hain, woh waste hai. Lekin dhyan do — galat jagah waste hai, sahi jagah RESOURCE hai! Ek khali bottle kachre ke dabbe mein waste hai, lekin recycler ke paas woh nayi cheez ban sakti hai.",
        "game": "/games/waste-explorer-game.html"
      },
      {
        "title": "Alag karna zaroori kyun? ⚠️",
        "body": "Sab kachra mila diya to recycle nahi ho paata. Geela kachra dry waste ko kharab kar deta hai. Kachre ke pahaad (landfill) tezi se bharte hain. Geela kachra sadte hue badbu aur bimari failaata hai. Battery, kaanch, syringe se safai karne walon ko bahut chot lag sakti hai.",
        "game": "/games/drag-bin-toddler.html"
      },
      {
        "title": "Waste ke 3 Types 📦",
        "body": "DRY WASTE (Neela dabba): kaagaz, plastic bottle, kaanch ki botal, dhatu ka dabba, kapda. WET WASTE (Hara dabba): sabzi ke chhilke, banana ka chhilka, ande ke chhilke, sukhe patte, chai ki patti. HAZARDOUS (Laal dabba): purani battery, syringe, dawai, broken glass, paint.",
        "game": "/games/bin-match-game.html"
      },
      {
        "title": "Pehchano kaise? 🔍",
        "body": "3 simple sawaal pucho: (1) Kya yeh gila hai ya sadne wala? → WET WASTE. (2) Kya yeh sukha hai aur dobara material ban sakta hai? → DRY WASTE. (3) Kya isme zeher, chemical, ya chot pahunchane ki kshamata hai? → HAZARDOUS. Shak ho to bade se pucho!",
        "game": null
      },
      {
        "title": "Safety Rule ⛑️",
        "body": "Battery, syringe, tooti kaanch, aur expired dawai ko KABHI haath se mat uthao. Seedha bade ko batao. Inhein red/laal bag ya dabba mein daalo. Yaad rakho: Safe rahenge, toh hi waste hero bante hain!",
        "game": null
      }
    ]
  }'::jsonb,
  '',
  1
);

-- MODULE 1 QUIZ QUESTIONS
INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT
  id,
  'Banana ka chhilka kis bin mein jaata hai?',
  '["Neela (Dry Waste)", "Hara (Wet Waste)", "Laal (Hazardous)", "Kisi bhi bin mein"]'::jsonb,
  1,
  'Banana ka chhilka organic/gila waste hai — yeh hare dabbe mein jaata hai jahan se compost banti hai.'
FROM learning_modules WHERE title = 'Waste Detective 🏅';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT
  id,
  'Purani battery kis bin mein daalni chahiye?',
  '["Neela (Dry Waste)", "Hara (Wet Waste)", "Laal (Hazardous)", "Kooday ke dibba mein"]'::jsonb,
  2,
  'Battery mein chemical hota hai — yeh hazardous waste hai. Laal dabbe ya e-waste collection mein daalo.'
FROM learning_modules WHERE title = 'Waste Detective 🏅';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT
  id,
  'Kachra alag karne ka sabse bada faida kya hai?',
  '["Ghar saaf dikhta hai", "Recycle ho sakta hai aur landfill kam hota hai", "Bag achha lagta hai", "Koi faida nahi"]'::jsonb,
  1,
  'Alag karne se dry waste recycle hota hai, wet waste compost banta hai — landfill bahut kam bharti hai!'
FROM learning_modules WHERE title = 'Waste Detective 🏅';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT
  id,
  'Syringe ya tuta kaanch dikhe to kya karo?',
  '["Khud uthao aur phenk do", "Bade ko batao, haath mat lagao", "Paani se dho do", "Ignore karo"]'::jsonb,
  1,
  'Syringe aur tuta kaanch se serious chot lag sakti hai. Hamesha bade ko batao — khud haath mat lagao.'
FROM learning_modules WHERE title = 'Waste Detective 🏅';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT
  id,
  'Plastic bottle (saaf/khali) kaun si bin mein jaati hai?',
  '["Hara (Wet)", "Laal (Hazardous)", "Neela (Dry)", "Kooday ke dheer mein"]'::jsonb,
  2,
  'Saaf plastic bottle dry waste hai — neele dabbe mein. Wahan se recycler ise nayi cheez mein badal dete hain.'
FROM learning_modules WHERE title = 'Waste Detective 🏅';


-- MODULE 2: Recycling Hero (blue)
INSERT INTO learning_modules (title, description, age_group, level, content, video_url, order_index)
VALUES (
  'Recycling Hero ♻️',
  'Dry waste ke types aur unse kya banta hai, ye seekho.',
  'teens',
  'beginner',
  '{
    "type": "slides",
    "slides": [
      {
        "title": "Kaagaz ♻️ — Recycle ka safar",
        "body": "Purana kaagaz (newspaper, notebook) gudha → pulp (kaagaz ka lep) banta hai → phir naya kaagaz ya carton box banta hai! Kaagaz recycle karne se ped katne se bachte hain. Dhyan rakho: geela ya greasy kaagaz recycle nahi hota.",
        "game": "/games/recycle-factory.html"
      },
      {
        "title": "Plastic ♻️ — Kai roopon mein naya janam",
        "body": "Plastic bottle saaf karo → machine mein kaato ya pighlao → nayi bottle, polyester kapda (t-shirt!), ya park bench ban jaati hai. Recycle ke pehle plastic dhona zaroori hai — gandgi se machine kharab hoti hai.",
        "game": null
      },
      {
        "title": "Kaanch (Glass) ♻️ — Bar-bar naya",
        "body": "Kaanch tod-pighla-kar baar baar naya kaanch banta hai — quality bilkul kam nahi hoti! Ek recycled glass bottle banane mein 30% kam energy lagti hai. Broken glass ko wrap karke daalo taaki safai wale ko chot na lage.",
        "game": null
      },
      {
        "title": "Dhaatu (Metal/Tin) ♻️",
        "body": "Tin ka dabba, lohe ki cheez, aluminium foil — sab recycle ho sakti hain. Pighlao → naya saman bana lo. Aluminium recycle karna, naya banaane se 95% kam energy leta hai! Isliye ek kan-peec bhi phenk mat.",
        "game": null
      },
      {
        "title": "Kapda aur Lakdi ♻️",
        "body": "Purana kapda: rag banao, cloth bag banao, stuffing mein use karo, ya nayi dhaaga spin karo. Purani lakdi: chips/mulch, press-board, craft items mein badal sakti hai. Wastify ki recycling partner NGOs yeh sab kaam karti hain.",
        "game": "/games/upcycle-picker.html"
      },
      {
        "title": "Reduce, Reuse PEHLE! 💡",
        "body": "Recycle akhri raasta hai. Pehle: REDUCE — zaroori ho tabhi kharido. Phir: REUSE — dobara use karo (bottle, dabba, jhola). Sirf tab recycle karo jab reduce/reuse possible na ho. Yeh hi waste hero ka secret formula hai!",
        "game": "/games/wood-workshop.html"
      }
    ]
  }'::jsonb,
  '',
  2
);

-- MODULE 2 QUIZ QUESTIONS
INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Purana kaagaz recycle hoke kya banta hai?',
  '["Plastic", "Naya kaagaz ya carton", "Khaad", "Dhaatu"]'::jsonb,
  1,
  'Paper pulp se naya kaagaz ya carton box banta hai — ped katne se bachte hain!'
FROM learning_modules WHERE title = 'Recycling Hero ♻️';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Plastic recycle karne se pehle kya karna zaroori hai?',
  '["Aag lagaao", "Dho do (saaf karo)", "Tod do", "Kuch nahi"]'::jsonb,
  1,
  'Gandgi wali plastic se machine kharab hoti hai — hamesha saaf (dhokar) daalo recycling mein.'
FROM learning_modules WHERE title = 'Recycling Hero ♻️';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Aluminium can recycle karna, naya banana se kitni kam energy leta hai?',
  '["10%", "50%", "95%", "Bilkul same"]'::jsonb,
  2,
  'Aluminium recycle mein 95% kam energy lagti hai — isliye har can matter karta hai!'
FROM learning_modules WHERE title = 'Recycling Hero ♻️';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Waste management ka sahi order kya hai?',
  '["Recycle → Reuse → Reduce", "Reduce → Reuse → Recycle", "Reuse → Recycle → Reduce", "Sab ek barabar hain"]'::jsonb,
  1,
  'Pehle Reduce (kharido kam), phir Reuse (dobara use karo), aur aakhri mein Recycle — yeh hi 3R ka pyramid hai!'
FROM learning_modules WHERE title = 'Recycling Hero ♻️';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Geela ya greasy kaagaz (jaise oil-soaked paper) ka kya karna chahiye?',
  '["Dry waste mein daalo", "Wet waste mein daalo", "Recycle karo", "Kaagaz recycle nahi hota"]'::jsonb,
  1,
  'Geela ya grease wala kaagaz recycle nahi hota — wet bin mein daalo jahan composting ho sakti hai.'
FROM learning_modules WHERE title = 'Recycling Hero ♻️';


-- MODULE 3: Compost Champion (green+brown)
INSERT INTO learning_modules (title, description, age_group, level, content, video_url, order_index)
VALUES (
  'Compost Champion 🌱',
  'Wet waste se khaad banana aur sahi paudhe ko sahi khaad dena seekho.',
  'teens',
  'intermediate',
  '{
    "type": "slides",
    "slides": [
      {
        "title": "Wet Waste kya hai? 🍃",
        "body": "Sabzi-fal ke chhilke, bacha hua khaana, patte, chai ki patti — yeh sab wet waste hai. Yeh gila, organic, aur sadne wala hota hai. Sahi jagah daalo → khaad (compost) banti hai → paudhon ka best dost!",
        "game": "/games/compost-factory.html"
      },
      {
        "title": "Khaad kaise banti hai? 🌿",
        "body": "Composting mein 4 cheez chahiye: GREENS (hara, gila: chhilke, khaana) + BROWNS (sukha: patte, kaagaz ke tukde) + HAWA (oxygen) + THODI NAMI. Thoda zyada bhura, thoda kam hara — balance rakho. Kuch hafton mein dark brown, khushbudar mitti jaisi khaad taiyaar!",
        "game": "/games/compost-mixer.html"
      },
      {
        "title": "Kya daalen compost mein? ✅",
        "body": "Haan daalo: sabzi/fal ke chhilke, pisi chai ki patti, pise ande ke chhilke, sukhe patte, torn cardboard (plain). Ye sab milke mitti ko poshan dete hain aur paudhon ko strong banate hain.",
        "game": "/games/compost-race.html"
      },
      {
        "title": "Kya NA daalen compost mein? ❌",
        "body": "KABHI mat daalo: tel/ghee wala khaana (badbu aur keede!), meat ya machhli (rodents aate hain), doodh ki cheezein, cooked food with masala (aam taur par avoid karo). Galat cheez daalne se sara compost kharab ho sakta hai.",
        "game": "/games/wet-upcycle-picker.html"
      },
      {
        "title": "Kis paudhe ko kya dein? 🌺",
        "body": "Kele ka chhilka → phool aur fal wale paudhe (potassium deta hai, aam taur par). Pisa anda chhilka → tamatar, mirch jaise paudhe (calcium). Dhoyi chai patti → gamle ke paudhe, gulab. Sabzi ke chhilke ki khaad → sab paudhon ke liye achhi. Note: ye suggestions general hain, specific plants ke liye expert se pucho.",
        "game": "/games/compost-memory.html"
      },
      {
        "title": "Bacha khaana waste mat karo! 🍱",
        "body": "Pehla option: Bacha hua khaana zarooratmandon ko do — food bank, padosi, ya Wastify ki surplus food feature se. Agar khaana khane layak nahi raha tab compost karo. Food waste bachana compost se bhi zyada important hai!",
        "game": "/games/food-rescue.html"
      }
    ]
  }'::jsonb,
  '',
  3
);

-- MODULE 3 QUIZ QUESTIONS
INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Compost mein sabse pehle kya karna chahiye agar bacha khaana ho?',
  '["Compost bin mein daalo", "Dry waste mein daalo", "Kisi zarooratmand ko do ya food bank mein", "Phenk do"]'::jsonb,
  2,
  'Pehla option hamesha food rescue hai — agar khaana khane layak hai to kisi zaroorat mand ko do!'
FROM learning_modules WHERE title = 'Compost Champion 🌱';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Compost mein KAUNSI cheez daal sakte hain?',
  '["Murgi ka gosht", "Doodhwala dahi", "Ande ke chhilke (pise)", "Tel mein taali sabzi"]'::jsonb,
  2,
  'Pise ande ke chhilke compost mein daal sakte hain — calcium dete hain. Baaki cheezein badbu aur keede laati hain.'
FROM learning_modules WHERE title = 'Compost Champion 🌱';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Kele ke chhilke ki khaad kis paudhe ke liye zyada faydemand hai?',
  '["Cactus", "Phool aur fal wale paudhe", "Sirf palm tree", "Kisi ke liye nahi"]'::jsonb,
  1,
  'Kele ka chhilka potassium deta hai jo aam taur par phool aur fal wale paudhon ke liye achha maana jaata hai.'
FROM learning_modules WHERE title = 'Compost Champion 🌱';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Compost ke liye sahi combination kya hai?',
  '["Sirf greens (chhilke)", "Sirf browns (patte)", "Greens + Browns + Hawa + Nami", "Kuch bhi mila do"]'::jsonb,
  2,
  'Composting mein Greens (gila) + Browns (sukha) + Hawa + thodi nami chahiye — balance hi magic hai!'
FROM learning_modules WHERE title = 'Compost Champion 🌱';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Acchi compost banne mein aam taur par kitna waqt lagta hai?',
  '["1-2 din", "Kuch hafte", "5 saal", "Kabhi nahi banti"]'::jsonb,
  1,
  'Sahi conditions mein compost kuch hafton mein taiyaar ho jaati hai — dark brown aur khushbudar mitti jaisi!'
FROM learning_modules WHERE title = 'Compost Champion 🌱';


-- MODULE 4: Safety Star (black + hazard yellow + red)
INSERT INTO learning_modules (title, description, age_group, level, content, video_url, order_index)
VALUES (
  'Safety Star ⭐',
  'Khatarnak waste pehchano aur use safe tarike se hataao.',
  'teens',
  'intermediate',
  '{
    "type": "slides",
    "slides": [
      {
        "title": "Hazardous Waste kya hai? ⚠️",
        "body": "Hazardous waste woh hai jo: zehreela (toxic) ho, jalne wala (flammable) ho, chot pahunchane wala (corrosive) ho, ya bimari failaane wala (infectious) ho. Yeh normal bin mein KABHI mat daalo — safai karmiyon aur paryavaran ko serious nuqsan hota hai.",
        "game": null
      },
      {
        "title": "Examples — Hazardous Waste 🔴",
        "body": "Ghar mein aata hazardous waste: purani battery/cell, old dawai (expired medicine), syringe/injection, paare wala thermometer, paint/chemical, fused bulb/tubelight, charger/e-waste, sanitary/medical waste, weed killer, cleaning chemicals.",
        "game": "/games/hazard-hunt.html"
      },
      {
        "title": "Ghar pe kya NAHI karna? 🚫",
        "body": "KABHI mat karo: (1) Hazardous waste ko regular dustbin mein mat daalo. (2) Jalao NAHI — toxic gases nikalta hai. (3) Nale ya mitti mein mat daalo — paani aur zameen kharab hoti hai. (4) Ek saath mix mat karo — reaction ho sakti hai.",
        "game": null
      },
      {
        "title": "Safe Rules — 3 Ka Formula ✋",
        "body": "CHHUO NAHI. TODO NAHI. JALAO NAHI. Agar dikhe: bade ko batao, alag plastic bag ya laal dabbe mein rakho (haath se nahi, cardboard ya tongs se), aur collection point tak pohnchao.",
        "game": null
      },
      {
        "title": "Kahan do? 🏢",
        "body": "1. E-waste (battery, charger, bulb): E-waste collection drive ya authorized e-waste shop. 2. Medical waste (syringe, dawai): Pharmacy take-back program ya nagar nigam ki medical waste collection. 3. Chemical/paint: Hazardous waste collection point. Wastify app mein nearest collection point dekh sakte ho!",
        "game": null
      },
      {
        "title": "Teen Safety Hero Pledge 🦸",
        "body": "Main aaj se promise karta/karti hoon: (1) Hazardous waste ko touch nahi karoonga/karungi. (2) Bade ko zaroor bataoonga/bataungi. (3) Sahi collection point mein jama karoonga/karungi. Yaad rakho: Ek safe kadam puri family aur mohalle ko safe rakhta hai!",
        "game": null
      }
    ]
  }'::jsonb,
  '',
  4
);

-- MODULE 4 QUIZ QUESTIONS
INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Road pe syringe dikhe to kya karna chahiye?',
  '["Haath se uthao aur dustbin mein daalo", "Bade ko batao, haath bilkul mat lagao", "Paon se thelo", "Ignore karo"]'::jsonb,
  1,
  'Syringe se infection aur chot lag sakti hai — kabhi haath mat lagao, turant bade ko batao!'
FROM learning_modules WHERE title = 'Safety Star ⭐';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Purani battery ko kahan daalna chahiye?',
  '["Regular dustbin mein", "Nale mein phenk do", "E-waste/hazardous collection point mein", "Jalao"]'::jsonb,
  2,
  'Battery mein toxic chemicals hote hain — authorized e-waste collection point hi sahi jagah hai.'
FROM learning_modules WHERE title = 'Safety Star ⭐';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Hazardous waste jalane se kya hota hai?',
  '["Saaf ho jaata hai", "Toxic gases nikalta hai jo hawa kharab karta hai", "Recycle ho jaata hai", "Kuch nahi hota"]'::jsonb,
  1,
  'Hazardous waste jalane se bahut khatarnak toxic gases nikalta hai — KABHI mat jalao!'
FROM learning_modules WHERE title = 'Safety Star ⭐';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Safety Star ke teen rules kya hain?',
  '["Dhoye, Todo, Daalo", "Chhuo nahi, Todo nahi, Jalao nahi", "Uthao, Dauro, Phenk do", "Sikhao, Batao, Bhulo"]'::jsonb,
  1,
  'Teen golden rules: CHHUO NAHI. TODO NAHI. JALAO NAHI. Yeh yaad rakhna hi safety star hona hai!'
FROM learning_modules WHERE title = 'Safety Star ⭐';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Expired dawai kahan deni chahiye?',
  '["Flush mein daalo", "Kooday ke dibba mein", "Pharmacy take-back ya medical waste collection", "Kisi bhi bin mein"]'::jsonb,
  2,
  'Expired medicine flush ya bin mein daalna paani aur mitti ko dushit karta hai. Pharmacy take-back ya medical waste collection hi sahi raasta hai.'
FROM learning_modules WHERE title = 'Safety Star ⭐';


-- MODULE 5: 3R Master (orange)
INSERT INTO learning_modules (title, description, age_group, level, content, video_url, order_index)
VALUES (
  '3R Master 🔁',
  'Samjho ki recycle se pehle reduce aur reuse aate hain.',
  'teens',
  'intermediate',
  '{
    "type": "slides",
    "slides": [
      {
        "title": "3R ka Pyramid 🔺",
        "body": "3R ek seedha ladder hai: REDUCE sabse upar (sabse powerful), phir REUSE, aur sabse neeche RECYCLE (akhri raasta). Zyada tar log sirf recycle par dhyan dete hain — lekin reduce aur reuse zyada impact dete hain. Sahi order: Reduce → Reuse → Recycle.",
        "game": null
      },
      {
        "title": "REDUCE — Kam kharido 🛍️",
        "body": "Reduce matlab: zaroori ho tabhi kharido. Examples: Plastic bag ki jagah kapde ka jhola le jao. Ek badi bottle kharido chhoti ke bajaay. Digital notes rakho, kaagaz mat chhaapo. Loose sabzi lo, plastic-packed nahi. Har ek saved item = ek less waste item!",
        "game": null
      },
      {
        "title": "REUSE — Dobara use karo ♻️",
        "body": "Reuse matlab: cheez phenk ne se pehle doosra use socho. Examples: Plastic container → tiffin/dabba. Purani t-shirt → dusting kapda ya craft. Empty jam jar → pencil stand ya spice container. Shopping bag → trash bag. Phool wala matka → pot/gamla. Roz ek cheez dobara use karo!",
        "game": null
      },
      {
        "title": "RECYCLE — Akhri raasta ♻️🏭",
        "body": "Recycle tab karo jab reduce aur reuse possible na ho. Recycle mein bhi energy, paani, aur transport lagta hai. Sahi tarike se: saaf karke daalo, sahi bin mein daalo, mix mat karo. Wastify app se nearest recycling point dhundho!",
        "game": null
      },
      {
        "title": "3R — Roz ki zindagi mein 🎒",
        "body": "Subah: Reusable water bottle le jao (Reduce + Reuse). Tiffin ghar se lo (Reduce). Dono taraf ke kaagaz use karo (Reuse). Shaam: Sabzi ke chhilke compost mein (yeh Reduce ka hissa hai). Purani notebook naya cover lagakar use karo (Reuse). Recycle tabhi karo jab zarurat ho.",
        "game": "/games/3r-sorter.html"
      }
    ]
  }'::jsonb,
  '',
  5
);

-- MODULE 5 QUIZ QUESTIONS
INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  '3R ka sahi order kya hai (sabse powerful pehle)?',
  '["Recycle → Reuse → Reduce", "Reuse → Reduce → Recycle", "Reduce → Reuse → Recycle", "Sab barabar hain"]'::jsonb,
  2,
  'Reduce sabse powerful hai (kam banao), phir Reuse (dobara use karo), aur aakhir mein Recycle (energy lagta hai).'
FROM learning_modules WHERE title = '3R Master 🔁';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Plastic bag ki jagah kya le jaana chahiye?',
  '["Ek aur plastic bag", "Kapde ka jhola (reusable bag)", "Cardboard box", "Kuch nahi, haath mein lo"]'::jsonb,
  1,
  'Kapde ka jhola = Reduce (plastic bag ki zarurat nahi) + Reuse (baar baar use hota hai)!'
FROM learning_modules WHERE title = '3R Master 🔁';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Purani t-shirt ko Reuse karne ka best tarika kya hai?',
  '["Seedha phenk do", "Jalao", "Dusting kapde ya craft mein use karo", "Recycle bin mein daalo"]'::jsonb,
  2,
  'Purani t-shirt ko dusting cloth, bag, ya craft item mein badal do — yeh Reuse hai, recycle se zyada better!'
FROM learning_modules WHERE title = '3R Master 🔁';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'School mein double-sided printing karna kaunsa R hai?',
  '["Recycle", "Refuse", "Reduce", "Reuse"]'::jsonb,
  2,
  'Dono taraf print karna = Reduce! Kaagaz ki zarurat aadhi ho jaati hai.'
FROM learning_modules WHERE title = '3R Master 🔁';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Empty jam jar ko kaunsa Reuse diya ja sakta hai?',
  '["Isse recycle karna best hai", "Pencil stand ya spice container banana", "Plastic mein convert karo", "Phenk do"]'::jsonb,
  1,
  'Empty jar ek great pencil stand ya spice container banta hai — zero waste, zero cost, 100% Reuse!'
FROM learning_modules WHERE title = '3R Master 🔁';


-- MODULE 6: Waste Journey (purple)
INSERT INTO learning_modules (title, description, age_group, level, content, video_url, order_index)
VALUES (
  'Waste Journey 🚛',
  'Jaano ki alag kiya hua kachra kahan jaata hai — ghar se lekar end tak.',
  'teens',
  'advanced',
  '{
    "type": "slides",
    "slides": [
      {
        "title": "Station 1 — Tumhara Ghar 🏠",
        "body": "Journey shuru hoti hai tumhare ghar ke dabbe se. Dry (neela), Wet (hara), Hazardous (laal) — teen alag dabbe mein sahi cheez daalna yahan se waste ki journey decide karta hai. Wastify ke smart bins sensor se fill level track karte hain aur app ko signal dete hain jab collection time ho.",
        "game": null
      },
      {
        "title": "Station 2 — Kachra Gaadi 🚛",
        "body": "Wastify ki GPS-tracked kachra gaadi tay time par aati hai — driver ko app pe assigned route milta hai. Gaadi different chambers mein dry, wet, aur hazardous waste alag rakhti hai. Citizens app pe track kar sakte hain ki gaadi kab aayegi — kachra miss nahi hoga!",
        "game": null
      },
      {
        "title": "Station 3 — Segregation Centre ⚙️",
        "body": "Dry waste yahan aata hai → belt par chalta hai → workers aur machines material alag karti hain: kaagaz, plastic, dhatu, kaanch. Har material ka alag buyer hota hai. Wet waste seedha composting unit jaata hai. Hazardous waste certified facility bheja jaata hai.",
        "game": null
      },
      {
        "title": "Station 4a — Recycling Plant 🏭",
        "body": "Dry waste yahin aata hai. Kaagaz → pulp → naya kaagaz. Plastic → flakes → naya product. Dhatu → pighal → naya saman. Ek recyclable item ka yahan se naya janam hota hai. Isliye ghar pe sahi bin mein daalna itna important hai — yahi se recycle ka safar shuru hota hai.",
        "game": null
      },
      {
        "title": "Station 4b — Compost Plant aur Landfill 🌱🏔️",
        "body": "WET WASTE → Compost plant mein → khaad banti hai → farmers ke kheton mein jaati hai. YEH best ending hai! REJECT/MIXED WASTE → Landfill mein jaata hai → zameen ke neeche daba diya jaata hai → dheere dheere barhta hai. Isliye mix karna galat hai — accha waste bhi landfill mein band ho jaata hai. Tumhara sahi alag karna waste ko best destiny deta hai!",
        "game": null
      }
    ]
  }'::jsonb,
  '',
  6
);

-- MODULE 6 QUIZ QUESTIONS
INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Wastify ki kachra gaadi ko kaise pata chalta hai kab aana hai?',
  '["Guess karte hain", "GPS tracking aur smart bin sensor se", "Phone pe WhatsApp karte hain", "Driver khud decide karta hai"]'::jsonb,
  1,
  'Wastify ke smart bins fill level track karte hain aur GPS tracking se driver ko optimized route aur timing milta hai!'
FROM learning_modules WHERE title = 'Waste Journey 🚛';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Segregation centre mein kya hota hai?',
  '["Kachra jalaya jaata hai", "Dry waste material alag kiya jaata hai (kaagaz, plastic, dhatu)", "Khaad banti hai", "Kuch nahi hota"]'::jsonb,
  1,
  'Segregation centre mein dry waste ko material type ke hisaab se alag kiya jaata hai taaki recycling ho sake.'
FROM learning_modules WHERE title = 'Waste Journey 🚛';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Wet waste ki best ending kya hai?',
  '["Landfill mein dafnaana", "Compost plant mein khaad banana", "Recycling plant mein bhejna", "Nale mein daalna"]'::jsonb,
  1,
  'Wet waste compost plant mein jaata hai → khaad banti hai → kheton ko poshan milta hai — yeh hi best circular journey hai!'
FROM learning_modules WHERE title = 'Waste Journey 🚛';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Mixed waste (sab mila diya) kahan jaata hai?',
  '["Recycling plant", "Compost plant", "Landfill", "Upcycling centre"]'::jsonb,
  2,
  'Mixed waste alag nahi ho sakta — seedha landfill jaata hai jahan waste dafan hota hai. Isliye alag karna bahut zaroori hai!'
FROM learning_modules WHERE title = 'Waste Journey 🚛';

INSERT INTO quiz_questions (module_id, question, options, correct_index, explanation)
SELECT id,
  'Ghar pe sahi bin mein daalna itna important kyun hai?',
  '["Ghar saaf dikhta hai", "Yeh waste ki best destiny decide karta hai — recycle ya compost vs landfill", "Driver ko achha lagta hai", "Koi khaas reason nahi"]'::jsonb,
  1,
  'Ghar pe sahi bin mein daalna puri waste journey decide karta hai — recyclables recycle hote hain, wet waste compost hoti hai. Mix karo to sab landfill jaata hai!'
FROM learning_modules WHERE title = 'Waste Journey 🚛';
