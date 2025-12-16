export interface GeezCharacter {
  geez: string[];
  latinTransliteration: string[];
  phoneticGroup: string;
  order: number;
}

export const geezAlphabet: GeezCharacter[] = [
  {
    geez: ["ሀ","ሁ","ሂ","ሃ","ሄ","ህ","ሆ"],
    latinTransliteration: ["he","hu","hi","ha","hie","h","ho"],
    phoneticGroup: "h-sounds",
    order: 1
  },
  {
    geez: ["ለ","ሉ","ሊ","ላ","ሌ","ል","ሎ"],
    latinTransliteration: ["le","lu","li","la","lie","l","lo"],
    phoneticGroup: "l-sounds",
    order: 2
  },
  {
    geez: ["ሐ","ሑ","ሒ","ሓ","ሔ","ሕ","ሖ"],
    latinTransliteration: ["He","Hu","Hi","Ha","Hie","H","Ho"],
    phoneticGroup: "h-sounds-alternative",
    order: 3
  },
  {
    geez: ["መ","ሙ","ሚ","ማ","ሜ","ም","ሞ"],
    latinTransliteration: ["me","mu","mi","ma","mie","m","mo"],
    phoneticGroup: "m-sounds",
    order: 4
  },
  {
    geez: ["ሠ","ሡ","ሢ","ሣ","ሤ","ሥ","ሦ"],
    latinTransliteration: ["s2e","s2u","s2i","s2a","s2ie","s2","s2o"],
    phoneticGroup: "s-sounds-alternative",
    order: 5
  },
  {
    geez: ["ረ","ሩ","ሪ","ራ","ሬ","ር","ሮ"],
    latinTransliteration: ["re","ru","ri","ra","rie","r","ro"],
    phoneticGroup: "r-sounds",
    order: 6
  },
  {
    geez: ["ሰ","ሱ","ሲ","ሳ","ሴ","ስ","ሶ"],
    latinTransliteration: ["se","su","si","sa","sie","s","so"],
    phoneticGroup: "s-sounds",
    order: 7
  },
  {
    geez: ["ሸ","ሹ","ሺ","ሻ","ሼ","ሽ","ሾ"],
    latinTransliteration: ["Se","Su","Si","Sa","Sie","S","So"],
    phoneticGroup: "sh-sounds",
    order: 8
  },
  {
    geez: ["ቀ","ቁ","ቂ","ቃ","ቄ","ቅ","ቆ"],
    latinTransliteration: ["qe","qu","qi","qa","qie","q","qo"],
    phoneticGroup: "q-sounds",
    order: 9
  },
  {
    geez: ["ቈ","","ቊ","ቋ","ቌ","ቍ",""],
    latinTransliteration: ["que","","qui","qua","quie","qW",""],
    phoneticGroup: "qu-sounds",
    order: 10
  },
  {
    geez: ["ቐ","ቑ","ቒ","ቓ","ቔ","ቕ","ቖ"],
    latinTransliteration: ["Qe","Qu","Qi","Qa","Qie","Q","Qo"],
    phoneticGroup: "q-sounds-alternative",
    order: 11
  },
  {
    geez: ["ቘ","","ቚ","ቛ","ቜ","ቝ",""],
    latinTransliteration: ["Que","","Qui","Qua","Quie","QW",""],
    phoneticGroup: "qu-sounds-alternative",
    order: 12
  },
  {
    geez: ["በ","ቡ","ቢ","ባ","ቤ","ብ","ቦ"],
    latinTransliteration: ["be","bu","bi","ba","bie","b","bo"],
    phoneticGroup: "b-sounds",
    order: 13
  },
  {
    geez: ["ቨ","ቩ","ቪ","ቫ","ቬ","ቭ","ቮ"],
    latinTransliteration: ["ve","vu","vi","va","vie","v","vo"],
    phoneticGroup: "v-sounds",
    order: 14
  },
  {
    geez: ["ተ","ቱ","ቲ","ታ","ቴ","ት","ቶ"],
    latinTransliteration: ["te","tu","ti","ta","tie","t","to"],
    phoneticGroup: "t-sounds",
    order: 15
  },
  {
    geez: ["ቸ","ቹ","ቺ","ቻ","ቼ","ች","ቾ"],
    latinTransliteration: ["ce","cu","ci","ca","cie","c","co"],
    phoneticGroup: "ch-sounds",
    order: 16
  },
  {
    geez: ["ኀ","ኁ","ኂ","ኃ","ኄ","ኅ","ኆ"],
    latinTransliteration: ["h2e","h2u","h2i","h2a","h2ie","h2","h2o"],
    phoneticGroup: "h-sounds-variant",
    order: 17
  },
  {
    geez: ["ኈ","","ኊ","ኋ","ኌ","ኍ",""],
    latinTransliteration: ["hue","","hui","hua","huie","hW",""],
    phoneticGroup: "hu-sounds",
    order: 18
  },
  {
    geez: ["ነ","ኑ","ኒ","ና","ኔ","ን","ኖ"],
    latinTransliteration: ["ne","nu","ni","na","nie","n","no"],
    phoneticGroup: "n-sounds",
    order: 19
  },
  {
    geez: ["ኘ","ኙ","ኚ","ኛ","ኜ","ኝ","ኞ"],
    latinTransliteration: ["Ne","Nu","Ni","Na","Nie","N","No"],
    phoneticGroup: "ny-sounds",
    order: 20
  },
  {
    geez: ["አ","ኡ","ኢ","ኣ","ኤ","እ","ኦ"],
    latinTransliteration: ["e","u","i","a","ie","A","o"],
    phoneticGroup: "vowels",
    order: 21
  },
  {
    geez: ["ከ","ኩ","ኪ","ካ","ኬ","ክ","ኮ"],
    latinTransliteration: ["ke","ku","ki","ka","kie","k","ko"],
    phoneticGroup: "k-sounds",
    order: 22
  },
  {
    geez: ["ኰ","","ኲ","ኳ","ኴ","ኵ",""],
    latinTransliteration: ["kue","","kui","kua","kuie","kW",""],
    phoneticGroup: "ku-sounds",
    order: 23
  },
  {
    geez: ["ኸ","ኹ","ኺ","ኻ","ኼ","ኽ","ኾ"],
    latinTransliteration: ["Ke","Ku","Ki","Ka","Kie","K","Ko"],
    phoneticGroup: "kh-sounds",
    order: 24
  },
  {
    geez: ["ዀ","","ዂ","ዃ","ዄ","ዅ",""],
    latinTransliteration: ["Kue","","Kui","Kua","Kuie","KW",""],
    phoneticGroup: "khu-sounds",
    order: 25
  },
  {
    geez: ["ወ","ዉ","ዊ","ዋ","ዌ","ው","ዎ"],
    latinTransliteration: ["we","wu","wi","wa","wie","w","wo"],
    phoneticGroup: "w-sounds",
    order: 26
  },
  {
    geez: ["ዐ","ዑ","ዒ","ዓ","ዔ","ዕ","ዖ"],
    latinTransliteration: ["Oe","Ou","Oi","Oa","Oie","O","Oo"],
    phoneticGroup: "o-sounds",
    order: 27
  },
  {
    geez: ["ዘ","ዙ","ዚ","ዛ","ዜ","ዝ","ዞ"],
    latinTransliteration: ["ze","zu","zi","za","zie","z","zo"],
    phoneticGroup: "z-sounds",
    order: 28
  },
  {
    geez: ["ዠ","ዡ","ዢ","ዣ","ዤ","ዥ","ዦ"],
    latinTransliteration: ["Ze","Zu","Zi","Za","Zie","Z","Zo"],
    phoneticGroup: "zh-sounds",
    order: 29
  },
  {
    geez: ["የ","ዩ","ዪ","ያ","ዬ","ይ","ዮ"],
    latinTransliteration: ["ye","yu","yi","ya","yie","y","yo"],
    phoneticGroup: "y-sounds",
    order: 30
  },
  {
    geez: ["ደ","ዱ","ዲ","ዳ","ዴ","ድ","ዶ"],
    latinTransliteration: ["de","du","di","da","die","d","do"],
    phoneticGroup: "d-sounds",
    order: 31
  },
  {
    geez: ["ጀ","ጁ","ጂ","ጃ","ጄ","ጅ","ጆ"],
    latinTransliteration: ["je","ju","ji","ja","jie","j","jo"],
    phoneticGroup: "j-sounds",
    order: 32
  },
  {
    geez: ["ገ","ጉ","ጊ","ጋ","ጌ","ግ","ጎ"],
    latinTransliteration: ["ge","gu","gi","ga","gie","g","go"],
    phoneticGroup: "g-sounds",
    order: 33
  },
  {
    geez: ["ጐ","","ጒ","ጓ","ጔ","ጕ",""],
    latinTransliteration: ["gue","","gui","gua","guie","gW",""],
    phoneticGroup: "gu-sounds",
    order: 33
  },
  {
    geez: ["ጠ","ጡ","ጢ","ጣ","ጤ","ጥ","ጦ"],
    latinTransliteration: ["Te","Tu","Ti","Ta","Tie","T","To"],
    phoneticGroup: "t-sounds-alternative",
    order: 34
  },
  {
    geez: ["ጨ","ጩ","ጪ","ጫ","ጬ","ጭ","ጮ"],
    latinTransliteration: ["Ce","Cu","Ci","Ca","Cie","C","Co"],
    phoneticGroup: "ch-sounds-alternative",
    order: 35
  },
  {
    geez: ["ጰ","ጱ","ጲ","ጳ","ጴ","ጵ","ጶ"],
    latinTransliteration: ["Pe","Pu","Pi","Pa","Pie","P","Po"],
    phoneticGroup: "p-sounds-alternative",
    order: 36
  },
  {
    geez: ["ጸ","ጹ","ጺ","ጻ","ጼ","ጽ","ጾ"],
    latinTransliteration: ["xe","xu","xi","xa","xie","x","xo"],
    phoneticGroup: "ts-sounds",
    order: 37
  },
  {
    geez: ["ፀ","ፁ","ፂ","ፃ","ፄ","ፅ","ፆ"],
    latinTransliteration: ["x2e","x2u","x2i","x2a","x2ie","x2","x2o"],
    phoneticGroup: "ts-sounds-alternative",
    order: 38
  },
  {
    geez: ["ፈ","ፉ","ፊ","ፋ","ፌ","ፍ","ፎ"],
    latinTransliteration: ["fe","fu","fi","fa","fie","f","fo"],
    phoneticGroup: "f-sounds",
    order: 39
  },
  {
    geez: ["ፐ","ፑ","ፒ","ፓ","ፔ","ፕ","ፖ"],
    latinTransliteration: ["pe","pu","pi","pa","pie","p","po"],
    phoneticGroup: "p-sounds",
    order: 40
  },
  {
    geez: ["።","፡","፣","፥","፤","፦","."],
    latinTransliteration: [".",";",",",":","::",";-",".."],
    phoneticGroup: "punctuation",
    order: 41
  },
  {
    geez: ["፩","፪","፫","፬","፭","፮","፯","፰","፱"],
    latinTransliteration: ["1^","2^","3^","4^","5^","6^","7^","8^","9^"],
    phoneticGroup: "geez-numerals-ones",
    order: 42
  },
  {
    geez: ["፲","፳","፴","፵","፶","፷","፸","፹","፺"],
    latinTransliteration: ["1^0","2^0","3^0","4^0","5^0","6^0","7^0","8^0","9^0"],
    phoneticGroup: "geez-numerals-tens",
    order: 43
  },
  {
    geez: ["፻","፼"],
    latinTransliteration: ["1^00","1^000"],
    phoneticGroup: "geez-numerals-large",
    order: 44
  },
  {
    geez: ["ጘ","ጙ","ጚ","ጛ","ጜ","ጝ","ጞ"],
    latinTransliteration: ["Ge","Gu","Gi","Ga","Gie","G","Go"],
    phoneticGroup: "g-sounds-extended",
    order: 45
  },
  {
    geez: ["ⶓ","","ⶔ","ጟ","ⶕ","ⶖ",""],
    latinTransliteration: ["Gue","","Gui","Gua","Guie","GW",""],
    phoneticGroup: "gu-sounds-extended",
    order: 46
  },
  {
    geez: ["ሇ","ሏ","ሗ","ሟ","ሧ","ሯ","ሷ","ሿ","ቇ","ቧ","ቯ","ቷ","ቿ","ኗ","ኟ","ኧ"],
    latinTransliteration: ["hoa","lua","Hua","mua","s2ua","rua","sua","Sua","qoa","bua","vua","tua","cua","nua","Nua","ua"],
    phoneticGroup: "ua-sounds-set-one",
    order: 47
  },
  {
    geez: ["ኯ","ዃ","ዏ","ዟ","ዧ","ዯ","ዷ","ጇ","ጏ","ጧ","ጯ","ጷ","ጿ","ፇ","ፏ","ፗ"],
    latinTransliteration: ["koa","Kua","woa","zua","Zua","yoa","dua","jua","goa","Tua","Cua","Pua","xua","x2ua","fua","pua"],
    phoneticGroup: "ua-sounds-set-two",
    order: 48
  }
];
