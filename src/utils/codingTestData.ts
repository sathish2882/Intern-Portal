import { CodingTestData } from "../types";

export const CODING_TEST: CodingTestData = {
  type: "coding",
  title: "Coding Test",
  subtitle: "4 Questions - 30 min - Each 5 marks - Pass: 2/4",
  total: 4,
  pass: 2,
  questions: [
    {
      id: 1,
      title: "Reverse a String",
      difficulty: "Easy",
      description: "Write a function to reverse a given string.",
      example: "Input: 'hello' → Output: 'olleh'",
      testCases: [
        { input: "hello", expected: "olleh" },
        { input: "world", expected: "dlrow" },
        { input: "react", expected: "tcaer" },
      ],
    },
    {
      id: 2,
      title: "Palindrome Check",
      difficulty: "Easy",
      description: "Check if a string is a palindrome.",
      example: "Input: 'madam' → Output: true",
      testCases: [
        { input: "madam", expected: true },
        { input: "racecar", expected: true },
        { input: "hello", expected: false },
      ],
    },
    {
      id: 3,
      title: "Find Largest Number",
      difficulty: "Medium",
      description: "Find the largest number in an array.",
      example: "[1, 5, 3] → 5",
      testCases: [
        { input: [1, 5, 3], expected: 5 },
        { input: [10, 2, 8, 6], expected: 10 },
        { input: [-1, -5, -3], expected: -1 },
      ],
    },
    {
      id: 4,
      title: "FizzBuzz",
      difficulty: "Medium",
      description: "Print numbers from 1 to N with Fizz/Buzz rules.",
      example: "3 → Fizz, 5 → Buzz",
      testCases: [
        {
          input: 5,
          expected: ["1", "2", "Fizz", "4", "Buzz"],
        },
        {
          input: 3,
          expected: ["1", "2", "Fizz"],
        },
      ],
    },
  ],
};

export const CODING_MARKS_PER_Q = 5;

export const CODING_SECTION_BREAKDOWN = [
  { name: "Programming", total: 2 },
  { name: "Data Structures", total: 2 },
];