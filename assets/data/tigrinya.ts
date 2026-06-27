export interface TigrinyaCharacter {
  tigrinya: string[];
  latinTransliteration: string[];
  phoneticGroup: string;
  order: number;
}

export const tigrinyaAlphabet: TigrinyaCharacter[] = [
  {
    tigrinya: ["ሀ", "ሁ", "ሂ", "ሃ", "ሄ", "ህ", "ሆ"],
    latinTransliteration: ["he", "hu", "hi", "ha", "hie", "h", "ho"],
    phoneticGroup: "h-sounds",
    order: 1
  },
  {
    tigrinya: ["ለ", "ሉ", "ሊ", "ላ", "ሌ", "ል", "ሎ"],
    latinTransliteration: ["le", "lu", "li", "la", "lie", "l", "lo"],
    phoneticGroup: "l-sounds",
    order: 2
  },
  {
    tigrinya: ["ሐ", "ሑ", "ሒ", "ሓ", "ሔ", "ሕ", "ሖ"],
    latinTransliteration: ["He", "Hu", "Hi", "Ha", "Hie", "H", "Ho"],
    phoneticGroup: "h-sounds-alternative",
    order: 3
  },
  {
    tigrinya: ["መ", "ሙ", "ሚ", "ማ", "ሜ", "ም", "ሞ"],
    latinTransliteration: ["me", "mu", "mi", "ma", "mie", "m", "mo"],
    phoneticGroup: "m-sounds",
    order: 4
  },
  {
    tigrinya: ["ሠ", "ሡ", "ሢ", "ሣ", "ሤ", "ሥ", "ሦ"],
    latinTransliteration: ["s2e", "s2u", "s2i", "s2a", "s2ie", "s2", "s2o"],
    phoneticGroup: "s-sounds-alternative",
    order: 5
  },
  {
    tigrinya: ["ረ", "ሩ", "ሪ", "ራ", "ሬ", "ር", "ሮ"],
    latinTransliteration: ["re", "ru", "ri", "ra", "rie", "r", "ro"],
    phoneticGroup: "r-sounds",
    order: 6
  },
  {
    tigrinya: ["ሰ", "ሱ", "ሲ", "ሳ", "ሴ", "ስ", "ሶ"],
    latinTransliteration: ["se", "su", "si", "sa", "sie", "s", "so"],
    phoneticGroup: "s-sounds",
    order: 7
  },
  {
    tigrinya: ["ሸ", "ሹ", "ሺ", "ሻ", "ሼ", "ሽ", "ሾ"],
    latinTransliteration: ["Se", "Su", "Si", "Sa", "Sie", "S", "So"],
    phoneticGroup: "sh-sounds",
    order: 8
  },
  {
    tigrinya: ["ቀ", "ቁ", "ቂ", "ቃ", "ቄ", "ቅ", "ቆ"],
    latinTransliteration: ["qe", "qu", "qi", "qa", "qie", "q", "qo"],
    phoneticGroup: "q-sounds",
    order: 9
  },
  {
    tigrinya: ["ቈ", "ቊ", "ቋ", "ቌ", "ቍ"],
    latinTransliteration: ["que", "qui", "qua", "quie", "qW"],
    phoneticGroup: "qu-sounds",
    order: 10
  },
  {
    tigrinya: ["ቐ", "ቑ", "ቒ", "ቓ", "ቔ", "ቕ", "ቖ"],
    latinTransliteration: ["Qe", "Qu", "Qi", "Qa", "Qie", "Q", "Qo"],
    phoneticGroup: "q-sounds-alternative",
    order: 11
  },
  {
    tigrinya: ["ቘ", "ቚ", "ቛ", "ቜ", "ቝ"],
    latinTransliteration: ["Que", "Qui", "Qua", "Quie", "QW"],
    phoneticGroup: "qu-sounds-alternative",
    order: 12
  },
  {
    tigrinya: ["በ", "ቡ", "ቢ", "ባ", "ቤ", "ብ", "ቦ"],
    latinTransliteration: ["be", "bu", "bi", "ba", "bie", "b", "bo"],
    phoneticGroup: "b-sounds",
    order: 13
  },
  {
    tigrinya: ["ቨ", "ቩ", "ቪ", "ቫ", "ቬ", "ቭ", "ቮ"],
    latinTransliteration: ["ve", "vu", "vi", "va", "vie", "v", "vo"],
    phoneticGroup: "v-sounds",
    order: 14
  },
  {
    tigrinya: ["ተ", "ቱ", "ቲ", "ታ", "ቴ", "ት", "ቶ"],
    latinTransliteration: ["te", "tu", "ti", "ta", "tie", "t", "to"],
    phoneticGroup: "t-sounds",
    order: 15
  },
  {
    tigrinya: ["ቸ", "ቹ", "ቺ", "ቻ", "ቼ", "ች", "ቾ"],
    latinTransliteration: ["ce", "cu", "ci", "ca", "cie", "c", "co"],
    phoneticGroup: "ch-sounds",
    order: 16
  },
  {
    tigrinya: ["ኀ", "ኁ", "ኂ", "ኃ", "ኄ", "ኅ", "ኆ"],
    latinTransliteration: ["h2e", "h2u", "h2i", "h2a", "h2ie", "h2", "h2o"],
    phoneticGroup: "h-sounds-variant",
    order: 17
  },
  {
    tigrinya: ["ኈ", "ኊ", "ኋ", "ኌ", "ኍ"],
    latinTransliteration: ["hue", "hui", "hua", "huie", "hW"],
    phoneticGroup: "hu-sounds",
    order: 18
  },
  {
    tigrinya: ["ነ", "ኑ", "ኒ", "ና", "ኔ", "ን", "ኖ"],
    latinTransliteration: ["ne", "nu", "ni", "na", "nie", "n", "no"],
    phoneticGroup: "n-sounds",
    order: 19
  },
  {
    tigrinya: ["ኘ", "ኙ", "ኚ", "ኛ", "ኜ", "ኝ", "ኞ"],
    latinTransliteration: ["Ne", "Nu", "Ni", "Na", "Nie", "N", "No"],
    phoneticGroup: "ny-sounds",
    order: 20
  },
  {
    tigrinya: ["አ", "ኡ", "ኢ", "ኣ", "ኤ", "እ", "ኦ"],
    latinTransliteration: ["e", "u", "i", "a", "ie", "A", "o"],
    phoneticGroup: "vowels",
    order: 21
  },
  {
    tigrinya: ["ከ", "ኩ", "ኪ", "ካ", "ኬ", "ክ", "ኮ"],
    latinTransliteration: ["ke", "ku", "ki", "ka", "kie", "k", "ko"],
    phoneticGroup: "k-sounds",
    order: 22
  },
  {
    tigrinya: ["ኰ", "ኲ", "ኳ", "ኴ", "ኵ"],
    latinTransliteration: ["kue", "kui", "kua", "kuie", "kW"],
    phoneticGroup: "ku-sounds",
    order: 23
  },
  {
    tigrinya: ["ኸ", "ኹ", "ኺ", "ኻ", "ኼ", "ኽ", "ኾ"],
    latinTransliteration: ["Ke", "Ku", "Ki", "Ka", "Kie", "K", "Ko"],
    phoneticGroup: "kh-sounds",
    order: 24
  },
  {
    tigrinya: ["ዀ", "ዂ", "ዃ", "ዄ", "ዅ"],
    latinTransliteration: ["Kue", "Kui", "Kua", "Kuie", "KW"],
    phoneticGroup: "khu-sounds",
    order: 25
  },
  {
    tigrinya: ["ወ", "ዉ", "ዊ", "ዋ", "ዌ", "ው", "ዎ"],
    latinTransliteration: ["we", "wu", "wi", "wa", "wie", "w", "wo"],
    phoneticGroup: "w-sounds",
    order: 26
  },
  {
    tigrinya: ["ዐ", "ዑ", "ዒ", "ዓ", "ዔ", "ዕ", "ዖ"],
    latinTransliteration: ["Oe", "Ou", "Oi", "Oa", "Oie", "O", "Oo"],
    phoneticGroup: "o-sounds",
    order: 27
  },
  {
    tigrinya: ["ዘ", "ዙ", "ዚ", "ዛ", "ዜ", "ዝ", "ዞ"],
    latinTransliteration: ["ze", "zu", "zi", "za", "zie", "z", "zo"],
    phoneticGroup: "z-sounds",
    order: 28
  },
  {
    tigrinya: ["ዠ", "ዡ", "ዢ", "ዣ", "ዤ", "ዥ", "ዦ"],
    latinTransliteration: ["Ze", "Zu", "Zi", "Za", "Zie", "Z", "Zo"],
    phoneticGroup: "zh-sounds",
    order: 29
  },
  {
    tigrinya: ["የ", "ዩ", "ዪ", "ያ", "ዬ", "ይ", "ዮ"],
    latinTransliteration: ["ye", "yu", "yi", "ya", "yie", "y", "yo"],
    phoneticGroup: "y-sounds",
    order: 30
  },
  {
    tigrinya: ["ደ", "ዱ", "ዲ", "ዳ", "ዴ", "ድ", "ዶ"],
    latinTransliteration: ["de", "du", "di", "da", "die", "d", "do"],
    phoneticGroup: "d-sounds",
    order: 31
  },
  {
    tigrinya: ["ጀ", "ጁ", "ጂ", "ጃ", "ጄ", "ጅ", "ጆ"],
    latinTransliteration: ["je", "ju", "ji", "ja", "jie", "j", "jo"],
    phoneticGroup: "j-sounds",
    order: 32
  },
  {
    tigrinya: ["ገ", "ጉ", "ጊ", "ጋ", "ጌ", "ግ", "ጎ"],
    latinTransliteration: ["ge", "gu", "gi", "ga", "gie", "g", "go"],
    phoneticGroup: "g-sounds",
    order: 33
  },
  {
    tigrinya: ["ጐ", "ጒ", "ጓ", "ጔ", "ጕ"],
    latinTransliteration: ["gue", "gui", "gua", "guie", "gW"],
    phoneticGroup: "gu-sounds",
    order: 33
  },
  {
    tigrinya: ["ጠ", "ጡ", "ጢ", "ጣ", "ጤ", "ጥ", "ጦ"],
    latinTransliteration: ["Te", "Tu", "Ti", "Ta", "Tie", "T", "To"],
    phoneticGroup: "t-sounds-alternative",
    order: 34
  },
  {
    tigrinya: ["ጨ", "ጩ", "ጪ", "ጫ", "ጬ", "ጭ", "ጮ"],
    latinTransliteration: ["Ce", "Cu", "Ci", "Ca", "Cie", "C", "Co"],
    phoneticGroup: "ch-sounds-alternative",
    order: 35
  },
  {
    tigrinya: ["ጰ", "ጱ", "ጲ", "ጳ", "ጴ", "ጵ", "ጶ"],
    latinTransliteration: ["Pe", "Pu", "Pi", "Pa", "Pie", "P", "Po"],
    phoneticGroup: "p-sounds-alternative",
    order: 36
  },
  {
    tigrinya: ["ጸ", "ጹ", "ጺ", "ጻ", "ጼ", "ጽ", "ጾ"],
    latinTransliteration: ["xe", "xu", "xi", "xa", "xie", "x", "xo"],
    phoneticGroup: "ts-sounds",
    order: 37
  },
  {
    tigrinya: ["ፀ", "ፁ", "ፂ", "ፃ", "ፄ", "ፅ", "ፆ"],
    latinTransliteration: ["x2e", "x2u", "x2i", "x2a", "x2ie", "x2", "x2o"],
    phoneticGroup: "ts-sounds-alternative",
    order: 38
  },
  {
    tigrinya: ["ፈ", "ፉ", "ፊ", "ፋ", "ፌ", "ፍ", "ፎ"],
    latinTransliteration: ["fe", "fu", "fi", "fa", "fie", "f", "fo"],
    phoneticGroup: "f-sounds",
    order: 39
  },
  {
    tigrinya: ["ፐ", "ፑ", "ፒ", "ፓ", "ፔ", "ፕ", "ፖ"],
    latinTransliteration: ["pe", "pu", "pi", "pa", "pie", "p", "po"],
    phoneticGroup: "p-sounds",
    order: 40
  },
  {
    tigrinya: ["።", "፡", "፣", "፥", "፤", "፦", "."],
    latinTransliteration: [".", ";", ",", ":", "::", ";-", ".."],
    phoneticGroup: "punctuation",
    order: 41
  }
];
