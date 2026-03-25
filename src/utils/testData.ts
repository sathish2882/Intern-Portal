import { TestData } from '../types'

export const APTITUDE_TEST: TestData = {
  title:    'Aptitude Test — Batch 1',
  subtitle: '22 Questions · 45 min · Pass: 60% (14/22)',
  total:    22,
  pass:     14,
  questions: [
    { section: '📐 Quantitative — Number System',     q: 'Find the remainder when 2¹⁰⁰ is divided by 7.',                                                         opts: ['1','2','4','6'],                               ans: 0 },
    { section: '📐 Quantitative — Number System',     q: 'The LCM of two numbers is 2310 and their HCF is 30. If one number is 210, find the other.',               opts: ['330','630','420','390'],                       ans: 0 },
    { section: '📐 Quantitative — Percentages',       q: 'A trader marks up goods by 40% then gives 25% discount. Actual profit/loss %?',                          opts: ['5% Profit','5% Loss','10% Profit','No change'], ans: 0 },
    { section: '📐 Quantitative — Profit & Loss',     q: 'A sold to B at 20% profit. B→C at 10% loss. C→D at 25% profit. D paid Rs.2700. What did A pay?',         opts: ['Rs.2000','Rs.1800','Rs.2400','Rs.2100'],       ans: 0 },
    { section: '📐 Quantitative — Time & Distance',   q: 'Two trains 500 km apart start towards each other at 11AM at 60km/h and 40km/h. When do they meet?',      opts: ['3:00 PM','4:00 PM','2:00 PM','5:00 PM'],      ans: 1 },
    { section: '📐 Quantitative — Time & Work',       q: 'A does work in 12d, B in 15d, C in 20d. A starts, B joins after 2d, C after 4d. How many more days for C?', opts: ['2.67','3','2','4'],                           ans: 0 },
    { section: '📐 Quantitative — Interest',          q: 'A sum becomes Rs.8820 in 2 years at 5% compound interest. Find principal.',                              opts: ['Rs.8000','Rs.7500','Rs.8200','Rs.8100'],       ans: 0 },
    { section: '📐 Quantitative — Ratio',             q: 'If A:B=3:4, B:C=5:6, C:D=7:8, then A:B:C:D=?',                                                          opts: ['105:140:168:192','3:4:5:6','21:28:30:35','15:20:24:32'], ans: 0 },
    { section: '📐 Quantitative — Averages',          q: 'Average of 25 numbers is 18. First 13 avg is 20, last 13 avg is 17. Find 13th number.',                   opts: ['31','27','23','29'],                           ans: 0 },
    { section: '📐 Quantitative — Algebra',           q: 'If x+y=7 and x²+y²=29, find xy.',                                                                        opts: ['10','12','8','15'],                            ans: 0 },
    { section: '📐 Quantitative — Mensuration',       q: 'Cylinder r=7cm, h=10cm. Cone of same base carved out. Remaining volume? (π=22/7)',                       opts: ['1026.67 cm³','1540 cm³','513.33 cm³','1026 cm³'], ans: 0 },
    { section: '📐 Quantitative — P & C',             q: '5 boys 4 girls in a row. No two girls adjacent. How many ways?',                                          opts: ['14400','43200','86400','28800'],               ans: 0 },
    { section: '🧠 Logical — Series',                 q: 'Next number: 2, 6, 12, 20, 30, ?',                                                                       opts: ['42','40','44','38'],                           ans: 0 },
    { section: '🧠 Logical — Coding',                 q: 'If FRIEND = HUMJTK, how is CANDLE coded?',                                                                opts: ['EDRIRL','EDRIRG','FCQHJG','DCQHJF'],          ans: 0 },
    { section: '🧠 Logical — Blood Relations',        q: "A is B's brother. C, B's sister, has son D and daughter E. F is D's maternal uncle. How is A related to D?", opts: ['Cousin','Nephew','Uncle','Brother'],         ans: 0 },
    { section: '🧠 Logical — Directions',             q: 'Ravi walks 5km N, 3km E, 5km S, 3km W. Where is he from start?',                                         opts: ['Starting point','6km East','3km North','5km South'], ans: 0 },
    { section: '📊 Data Interpretation',              q: '80 students: 45% passed Maths, 55% Science, 40% both. How many passed at least one?',                    opts: ['64','60','72','56'],                           ans: 1 },
    { section: '📊 Data Interpretation',              q: 'Sales 2023=₹4.2L, 2024=₹5.04L. What is % increase?',                                                     opts: ['20%','15%','25%','18%'],                       ans: 0 },
    { section: '📝 Verbal — Synonyms',                q: 'Synonym of ELOQUENT:',                                                                                   opts: ['Articulate','Silent','Confused','Harsh'],      ans: 0 },
    { section: '📝 Verbal — Antonyms',                q: 'Antonym of BENEVOLENT:',                                                                                  opts: ['Malevolent','Generous','Kind','Charitable'],   ans: 0 },
    { section: '📝 Verbal — Sentence',                q: 'Identify the correct sentence:',                                                                          opts: ["She don't know.","She doesn't knows.","She doesn't know.","She not know."], ans: 2 },
    { section: '📝 Verbal — Vocabulary',              q: 'Most similar to TENACIOUS:',                                                                              opts: ['Persistent','Fragile','Timid','Careless'],     ans: 0 },
  ],
}

export const SECTION_BREAKDOWN = [
  { name: 'Quantitative', total: 12 },
  { name: 'Logical',      total: 4  },
  { name: 'Data Interp.', total: 2  },
  { name: 'Verbal',       total: 4  },
]
