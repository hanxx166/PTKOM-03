export interface Article {
  id: number | string;
  title: string;
  tag: string;
  body: string[];
  mins: number;
  date?: string;
}

export interface Symptom {
  id: string;
  label: string;
  w: number;
  danger: boolean;
}

export interface Task3M {
  id: number | string;
  text: string;
}

export interface QuizItem {
  s: string;
  a: boolean;
  e: string;
}

export interface Fact {
  id: number | string;
  big: string;
  text: string;
}

/** FAQ: pertanyaan umum. `answer` boleh memakai markdown **tebal**. */
export interface Faq {
  id: number | string;
  question: string;
  answer: string;
}

export interface ContentBundle {
  articles: Article[];
  symptoms: Symptom[];
  tasks: Task3M[];
  quiz: QuizItem[];
  facts: Fact[];
  faq: Faq[];
  contact: { maps: string };
}

export interface User {
  name: string;
  email: string;
  role: "user" | "admin";
}
