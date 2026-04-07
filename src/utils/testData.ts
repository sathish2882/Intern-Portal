import { CodingTestData, TestData, TestType } from "../types";
import { CODING_TEST } from "./codingTestData";
import { CODING_SECTION_BREAKDOWN, CODING_MARKS_PER_Q } from "./codingTestData";

export const APTITUDE_TEST: TestData = {
  title: "Aptitude Test",
  subtitle: "15 Questions - 15 min - 1 mark each - Pass: 7/15",
  total: 15,
  pass: 7,
  questions: [
    {
      section: "Quantitative - Number System",
      q: "Find the unit digit of 7^222.",
      opts: ["1", "3", "7", "9"],
      ans: 3,
    },

    {
      section: "Logical - Series",
      q: "Find the next term: 3, 9, 27, 81, ?",
      opts: ["162", "243", "324", "361"],
      ans: 1,
    },

    {
      section: "Verbal - Synonyms",
      q: 'Choose the synonym of "Abundant".',
      opts: ["Scarce", "Plenty", "Rare", "Empty"],
      ans: 1,
    },

    {
      section: "Quantitative - Percentages",
      q: "A number is increased by 20% and then decreased by 20%. What is the net change?",
      opts: ["0%", "4% decrease", "4% increase", "2% decrease"],
      ans: 1,
    },

    {
      section: "Logical - Coding Decoding",
      q: "If PEN is coded as 123 and BOOK is coded as 4567, then POKE is coded as:",
      opts: ["1458", "1548", "1568", "1457"],
      ans: 0,
    },

    {
      section: "Verbal - Antonyms",
      q: 'Choose the antonym of "Expand".',
      opts: ["Increase", "Extend", "Contract", "Grow"],
      ans: 2,
    },

    {
      section: "Quantitative - Time and Work",
      q: "A can complete work in 8 days and B in 12 days. In how many days can they complete together?",
      opts: ["4.8", "5", "6", "7"],
      ans: 0,
    },

    {
      section: "Logical - Direction Sense",
      q: "A person walks 10m south, then 10m west, then 10m north. How far from starting point?",
      opts: ["0m", "10m", "20m", "30m"],
      ans: 1,
    },

    {
      section: "Verbal - Grammar",
      q: "Choose the correct sentence.",
      opts: [
        "He have completed work.",
        "He has completed work.",
        "He had complete work.",
        "He completing work.",
      ],
      ans: 1,
    },

    {
      section: "Quantitative - Profit and Loss",
      q: "A shopkeeper marks goods 20% above cost and gives 10% discount. Profit percentage is:",
      opts: ["8%", "10%", "12%", "15%"],
      ans: 0,
    },

    {
      section: "Logical - Seating Arrangement",
      q: "Five people A, B, C, D, E sit in a row. A is left of B, B is left of C. Who is in middle?",
      opts: ["A", "B", "C", "D"],
      ans: 1,
    },

    {
      section: "Verbal - Sentence Completion",
      q: "Although he was tired, ____ he continued working.",
      opts: ["but", "so", "yet", "because"],
      ans: 2,
    },

    {
      section: "Quantitative - Averages",
      q: "The average of 10 numbers is 50. If one number 100 is removed, new average is:",
      opts: ["45", "46", "48", "50"],
      ans: 1,
    },

    {
      section: "Logical - Blood Relation",
      q: "A is the father of B. B is the sister of C. How is A related to C?",
      opts: ["Father", "Brother", "Uncle", "Grandfather"],
      ans: 0,
    },

    {
      section: "Verbal - Vocabulary",
      q: 'Choose the word closest in meaning to "Reluctant".',
      opts: ["Willing", "Eager", "Unwilling", "Happy"],
      ans: 2,
    },
  ],
};

export const SECTION_BREAKDOWN = [
  { name: "Quantitative", total: 5 },
  { name: "Logical", total: 5 },
  { name: "Verbal", total: 5 },
];

export const TECHNICAL_TEST: TestData = {
  title: "Technical Test - General Programming",
  subtitle: "15 Questions - 15 min - 1 mark each - Pass: 6/15",
  total: 15,
  pass: 6,
  questions: [
    {
      section: "Programming Fundamentals",
      q: "Which data structure follows the Last In First Out principle?",
      opts: ["Queue", "Stack", "Array", "Linked List"],
      ans: 1,
    },
    {
      section: "Programming Fundamentals",
      q: "Which keyword is commonly used to define a constant in JavaScript?",
      opts: ["var", "let", "const", "static"],
      ans: 2,
    },
    {
      section: "C and C++ Basics",
      q: "Which symbol is used to access a member through a pointer in C++?",
      opts: [".", "::", "->", "&"],
      ans: 2,
    },
    {
      section: "C and C++ Basics",
      q: "Which of the following is not a valid C data type?",
      opts: ["int", "float", "real", "char"],
      ans: 2,
    },
    {
      section: "Java Basics",
      q: "Which of these is used to achieve inheritance in Java?",
      opts: ["this", "super", "extends", "implements"],
      ans: 2,
    },
    {
      section: "Java Basics",
      q: "Which method is the entry point of a Java program?",
      opts: ["start()", "main()", "run()", "init()"],
      ans: 1,
    },
    {
      section: "Python Basics",
      q: "Which of the following creates a list in Python?",
      opts: ["{}", "[]", "()", "<>"],
      ans: 1,
    },
    {
      section: "Python Basics",
      q: 'What is the output of len("hello") in Python?',
      opts: ["4", "5", "6", "Error"],
      ans: 1,
    },
    {
      section: "Web Basics",
      q: "Which HTML tag is used to create a hyperlink?",
      opts: ["<link>", "<a>", "<href>", "<url>"],
      ans: 1,
    },
    {
      section: "Web Basics",
      q: "Which CSS property changes the text color?",
      opts: ["font-color", "text-style", "color", "background-color"],
      ans: 2,
    },
    {
      section: "JavaScript Basics",
      q: "Which of the following is a JavaScript library for building UI?",
      opts: ["React", "Laravel", "Django", "Flask"],
      ans: 0,
    },
    {
      section: "JavaScript Basics",
      q: "What does === check in JavaScript?",
      opts: [
        "Value only",
        "Reference only",
        "Value and type equality",
        "Assignment",
      ],
      ans: 2,
    },
    {
      section: "Database Basics",
      q: "Which SQL statement is used to retrieve data from a table?",
      opts: ["GET", "OPEN", "SELECT", "FETCH"],
      ans: 2,
    },
    {
      section: "OOP Concepts",
      q: "Bundling data and methods together in a class is called:",
      opts: ["Inheritance", "Encapsulation", "Polymorphism", "Abstraction"],
      ans: 1,
    },
    {
      section: "Algorithms",
      q: "What is the time complexity of binary search?",
      opts: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      ans: 1,
    },
  ],
};

export const TECHNICAL_SECTION_BREAKDOWN = [
  { name: "Programming", total: 2 },
  { name: "C/C++", total: 2 },
  { name: "Java", total: 2 },
  { name: "Python", total: 2 },
  { name: "Web", total: 2 },
  { name: "JavaScript", total: 2 },
  { name: "Database", total: 1 },
  { name: "OOP", total: 1 },
  { name: "Algorithms", total: 1 },
];

// ─── Overall Pass & Scholarship ────────────────────────────────────────────
export const OVERALL_PASS_MARK = 23;
export const SCHOLARSHIP_THRESHOLD = 23; // scored more than 23 = eligible
export const TOTAL_MARKS = APTITUDE_TEST.total + TECHNICAL_TEST.total + (CODING_TEST.total * CODING_MARKS_PER_Q); // 15+15+20 = 50
export { CODING_MARKS_PER_Q };

export const TEST_CONFIG = {
  aptitude: {
    data: APTITUDE_TEST,
    sectionBreakdown: SECTION_BREAKDOWN,
    durationSeconds: 15 * 60,
    route: "/user/test",
    resultRoute: "/user/result",
  },
  technical: {
    data: TECHNICAL_TEST,
    sectionBreakdown: TECHNICAL_SECTION_BREAKDOWN,
    durationSeconds: 15 * 60,
    route: "/user/test",
    resultRoute: "/user/result",
  },
  coding: {
    data: CODING_TEST,
    sectionBreakdown: CODING_SECTION_BREAKDOWN,
    durationSeconds: 30 * 60,
    route: "/user/coding-test",
    resultRoute: "/user/result",
  },
} satisfies Record<
  TestType,
  {
    data: TestData | CodingTestData;
    sectionBreakdown: { name: string; total: number }[];
    durationSeconds: number;
    route: string;
    resultRoute: string;
  }
>;
