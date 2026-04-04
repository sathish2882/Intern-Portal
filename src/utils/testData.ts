import { CodingTestData, TestData, TestType } from '../types'
import { CODING_TEST } from './codingTestData'
import { CODING_SECTION_BREAKDOWN } from './codingTestData'

export const APTITUDE_TEST: TestData = {
  title: 'Aptitude Test',
  subtitle: '30 Questions - 45 min - Pass: 60% (18/30)',
  total: 30,
  pass: 18,
  questions: [
    { section: 'Quantitative - Number System', q: 'Find the remainder when 3^50 is divided by 7.', opts: ['1', '2', '4', '6'], ans: 1 },
    { section: 'Quantitative - Number System', q: 'The HCF of two numbers is 18 and their product is 1944. If one number is 54, the other is:', opts: ['18', '24', '36', '42'], ans: 2 },
    { section: 'Quantitative - Percentages', q: 'A student scored 360 marks out of 450. What is the percentage score?', opts: ['75%', '80%', '82%', '84%'], ans: 1 },
    { section: 'Quantitative - Profit and Loss', q: 'An article bought for Rs.800 is sold at a profit of 12.5%. Selling price is:', opts: ['Rs.880', 'Rs.900', 'Rs.920', 'Rs.940'], ans: 1 },
    { section: 'Quantitative - Ratio', q: 'If A:B = 4:7 and B:C = 3:5, then A:B:C is:', opts: ['12:21:35', '4:7:5', '12:7:15', '8:21:35'], ans: 0 },
    { section: 'Quantitative - Averages', q: 'The average of 8 numbers is 24. If one number 32 is removed, the new average becomes:', opts: ['22', '23', '24', '25'], ans: 1 },
    { section: 'Quantitative - Algebra', q: 'If x + y = 11 and xy = 24, then x^2 + y^2 =', opts: ['49', '61', '73', '97'], ans: 2 },
    { section: 'Quantitative - Time and Work', q: 'A can finish a work in 10 days and B in 15 days. In how many days can they finish it together?', opts: ['5', '6', '7.5', '8'], ans: 1 },
    { section: 'Quantitative - Time and Distance', q: 'A car travels 150 km in 3 hours. Its speed is:', opts: ['45 km/h', '50 km/h', '55 km/h', '60 km/h'], ans: 1 },
    { section: 'Quantitative - Simple Interest', q: 'Find the simple interest on Rs.5000 at 8% per annum for 3 years.', opts: ['Rs.1000', 'Rs.1100', 'Rs.1200', 'Rs.1300'], ans: 2 },
    { section: 'Quantitative - Compound Interest', q: 'A sum of Rs.10000 amounts to Rs.12100 in 2 years at compound interest. The rate is:', opts: ['8%', '9%', '10%', '11%'], ans: 2 },
    { section: 'Quantitative - Mensuration', q: 'What is the area of a circle with radius 7 cm? (Use pi = 22/7)', opts: ['144 sq cm', '154 sq cm', '164 sq cm', '174 sq cm'], ans: 1 },
    { section: 'Logical - Series', q: 'Find the next term: 5, 11, 19, 29, 41, ?', opts: ['51', '53', '55', '57'], ans: 2 },
    { section: 'Logical - Analogy', q: 'Book is to Reading as Fork is to:', opts: ['Drawing', 'Writing', 'Eating', 'Cooking'], ans: 2 },
    { section: 'Logical - Coding Decoding', q: 'If CAT is coded as DBU, then DOG is coded as:', opts: ['EPH', 'EPI', 'FPH', 'EPG'], ans: 0 },
    { section: 'Logical - Blood Relations', q: 'Pointing to a man, Riya said, "He is the son of my grandfather\'s only son." How is the man related to Riya?', opts: ['Brother', 'Father', 'Cousin', 'Uncle'], ans: 0 },
    { section: 'Logical - Direction Sense', q: 'A person walks 10 m north, then 6 m east, then 10 m south. How far is the person from the starting point?', opts: ['4 m', '6 m', '10 m', '16 m'], ans: 1 },
    { section: 'Logical - Syllogism', q: 'Statements: All pens are books. Some books are bags. Which conclusion follows?', opts: ['All bags are pens', 'Some bags are pens', 'Some books are pens', 'No pen is a bag'], ans: 2 },
    { section: 'Logical - Odd One Out', q: 'Choose the odd one out.', opts: ['Square', 'Rectangle', 'Triangle', 'Circle'], ans: 1 },
    { section: 'Logical - Seating', q: 'Five people A, B, C, D and E sit in a row. A is left of B, C is right of D, and B is right of E. Who can be in the middle?', opts: ['A', 'B', 'C', 'E'], ans: 1 },
    { section: 'Data Interpretation - Table', q: 'A company sold 120, 150, 180 and 210 units in four quarters. Average quarterly sales are:', opts: ['155', '160', '165', '170'], ans: 2 },
    { section: 'Data Interpretation - Percentages', q: 'Out of 200 students, 120 passed. The pass percentage is:', opts: ['50%', '55%', '60%', '65%'], ans: 2 },
    { section: 'Data Interpretation - Pie Chart', q: 'If 25% of a budget of Rs.80000 is spent on transport, the transport expense is:', opts: ['Rs.18000', 'Rs.20000', 'Rs.22000', 'Rs.25000'], ans: 1 },
    { section: 'Data Interpretation - Bar Graph', q: 'Production in two months is 320 and 280 units. What is the difference?', opts: ['20', '30', '40', '50'], ans: 2 },
    { section: 'Verbal - Synonyms', q: 'Choose the synonym of "Brief".', opts: ['Short', 'Bright', 'Broad', 'Swift'], ans: 0 },
    { section: 'Verbal - Antonyms', q: 'Choose the antonym of "Expand".', opts: ['Increase', 'Stretch', 'Contract', 'Enlarge'], ans: 2 },
    { section: 'Verbal - Grammar', q: 'Choose the correct sentence.', opts: ['He go to office daily.', 'He goes to office daily.', 'He going to office daily.', 'He gone to office daily.'], ans: 1 },
    { section: 'Verbal - Vocabulary', q: 'Choose the word closest in meaning to "Diligent".', opts: ['Lazy', 'Careful', 'Hardworking', 'Careless'], ans: 2 },
    { section: 'Verbal - Sentence Completion', q: 'She was tired, ____ she completed the assignment on time.', opts: ['because', 'but', 'although', 'unless'], ans: 1 },
    { section: 'Verbal - Reading Logic', q: 'If all roses are flowers and some flowers fade quickly, which statement is definitely true?', opts: ['All flowers are roses', 'Some roses fade quickly', 'All roses are flowers', 'No roses fade quickly'], ans: 2 },
  ],
}

export const SECTION_BREAKDOWN = [
  { name: 'Quantitative', total: 12 },
  { name: 'Logical', total: 8 },
  { name: 'Data Interp.', total: 4 },
  { name: 'Verbal', total: 6 },
]

export const TECHNICAL_TEST: TestData = {
  title: 'Technical Test - General Programming',
  subtitle: '20 Questions - 30 min - Pass: 60% (12/20)',
  total: 20,
  pass: 12,
  questions: [
    { section: 'Programming Fundamentals', q: 'Which data structure follows the Last In First Out principle?', opts: ['Queue', 'Stack', 'Array', 'Linked List'], ans: 1 },
    { section: 'Programming Fundamentals', q: 'Which keyword is commonly used to define a constant in JavaScript?', opts: ['var', 'let', 'const', 'static'], ans: 2 },
    { section: 'Programming Fundamentals', q: 'What is the output type of 5 / 2 in most modern programming languages with floating-point division?', opts: ['Integer', 'Float or Double', 'Boolean', 'Character'], ans: 1 },
    { section: 'Programming Fundamentals', q: 'Which control structure is best suited when the number of iterations is unknown in advance?', opts: ['for loop', 'while loop', 'switch', 'array'], ans: 1 },
    { section: 'C and C++ Basics', q: 'Which symbol is used to access a member through a pointer in C++?', opts: ['.', '::', '->', '&'], ans: 2 },
    { section: 'C and C++ Basics', q: 'Which of the following is not a valid C data type?', opts: ['int', 'float', 'real', 'char'], ans: 2 },
    { section: 'Java Basics', q: 'Which of these is used to achieve inheritance in Java?', opts: ['this', 'super', 'extends', 'implements'], ans: 2 },
    { section: 'Java Basics', q: 'Which method is the entry point of a Java program?', opts: ['start()', 'main()', 'run()', 'init()'], ans: 1 },
    { section: 'Python Basics', q: 'Which of the following creates a list in Python?', opts: ['{}', '[]', '()', '<>'], ans: 1 },
    { section: 'Python Basics', q: 'What is the output of len("hello") in Python?', opts: ['4', '5', '6', 'Error'], ans: 1 },
    { section: 'Web Basics', q: 'Which HTML tag is used to create a hyperlink?', opts: ['<link>', '<a>', '<href>', '<url>'], ans: 1 },
    { section: 'Web Basics', q: 'Which CSS property changes the text color?', opts: ['font-color', 'text-style', 'color', 'background-color'], ans: 2 },
    { section: 'JavaScript Basics', q: 'Which of the following is a JavaScript framework or library for building user interfaces?', opts: ['React', 'Laravel', 'Django', 'Flask'], ans: 0 },
    { section: 'JavaScript Basics', q: 'What does === check in JavaScript?', opts: ['Value only', 'Reference only', 'Value and type equality', 'Assignment'], ans: 2 },
    { section: 'Database Basics', q: 'Which SQL statement is used to retrieve data from a table?', opts: ['GET', 'OPEN', 'SELECT', 'FETCH'], ans: 2 },
    { section: 'Database Basics', q: 'Which clause is used to filter records in SQL?', opts: ['ORDER BY', 'WHERE', 'GROUP BY', 'VALUES'], ans: 1 },
    { section: 'OOP Concepts', q: 'Bundling data and methods together in a class is called:', opts: ['Inheritance', 'Encapsulation', 'Polymorphism', 'Abstraction'], ans: 1 },
    { section: 'OOP Concepts', q: 'When one interface has many forms, it is known as:', opts: ['Compilation', 'Polymorphism', 'Encapsulation', 'Overloading only'], ans: 1 },
    { section: 'Algorithms', q: 'Which searching algorithm requires sorted data for efficient operation?', opts: ['Linear Search', 'Binary Search', 'Depth First Search', 'Breadth First Search'], ans: 1 },
    { section: 'Algorithms', q: 'What is the time complexity of binary search?', opts: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], ans: 1 },
  ],
}

export const TECHNICAL_SECTION_BREAKDOWN = [
  { name: 'Programming', total: 4 },
  { name: 'C/C++', total: 2 },
  { name: 'Java', total: 2 },
  { name: 'Python', total: 2 },
  { name: 'Web', total: 2 },
  { name: 'JavaScript', total: 2 },
  { name: 'Database', total: 2 },
  { name: 'OOP', total: 2 },
  { name: 'Algorithms', total: 2 },
]

export const TEST_CONFIG = {
  aptitude: {
    data: APTITUDE_TEST,
    sectionBreakdown: SECTION_BREAKDOWN,
    durationSeconds: 45 * 60,
    route: '/user/test',
    resultRoute: '/user/result',
  },
  technical: {
    data: TECHNICAL_TEST,
    sectionBreakdown: TECHNICAL_SECTION_BREAKDOWN,
    durationSeconds: 30 * 60,
    route: '/user/test',
    resultRoute: '/user/result',
  }, 
  coding: {
    data: CODING_TEST,
    sectionBreakdown: CODING_SECTION_BREAKDOWN,
    durationSeconds: 60 * 60,
    route: '/user/coding-test',
    resultRoute: '/user/result',
  }
} satisfies Record<
  TestType,
  {
    data: TestData | CodingTestData
    sectionBreakdown: { name: string; total: number }[]
    durationSeconds: number
    route: string
    resultRoute: string
  }
>
