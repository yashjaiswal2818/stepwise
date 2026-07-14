export type TokenClass = "kw" | "fn" | "num" | "str" | "com" | "punct" | "var" | "ws";
export interface Token {
  text: string;
  cls: TokenClass;
}

export type HlLang = "js" | "py" | "c";

/** Union of keywords across JS / Python / C. Highlighting a word that is a
 *  keyword in another language is harmless since sources are per-language. */
const KEYWORDS = new Set([
  // js/ts
  "function", "const", "let", "var", "if", "else", "for", "while", "return",
  "new", "of", "in", "true", "false", "null", "undefined", "typeof", "do",
  "switch", "case", "default", "class", "extends", "this", "break", "continue",
  // python
  "def", "elif", "None", "True", "False", "and", "or", "not", "is", "lambda",
  "pass", "import", "from", "as", "with", "range", "len", "print", "self", "while",
  // c
  "int", "char", "void", "struct", "unsigned", "sizeof", "NULL", "bool",
  "static", "typedef", "long", "short", "float", "double", "size_t", "include",
  "define", "printf",
]);

export function tokenizeLine(line: string, lang: HlLang = "js"): Token[] {
  const tokens: Token[] = [];
  const n = line.length;
  let i = 0;

  while (i < n) {
    const ch = line[i];

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < n && /\s/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), cls: "ws" });
      i = j;
      continue;
    }
    // Python comment
    if (lang === "py" && ch === "#") {
      tokens.push({ text: line.slice(i), cls: "com" });
      break;
    }
    // C preprocessor directive (#include, #define)
    if (lang === "c" && ch === "#") {
      let j = i + 1;
      while (j < n && /[A-Za-z]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), cls: "kw" });
      i = j;
      continue;
    }
    // line comment
    if (ch === "/" && line[i + 1] === "/") {
      tokens.push({ text: line.slice(i), cls: "com" });
      break;
    }
    // string
    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < n && line[j] !== ch) j++;
      j = Math.min(j + 1, n);
      tokens.push({ text: line.slice(i, j), cls: "str" });
      i = j;
      continue;
    }
    // number
    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[0-9.]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), cls: "num" });
      i = j;
      continue;
    }
    // identifier
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      let cls: TokenClass = "var";
      if (KEYWORDS.has(word)) {
        cls = "kw";
      } else {
        let k = j;
        while (k < n && /\s/.test(line[k])) k++;
        if (line[k] === "(") cls = "fn";
      }
      tokens.push({ text: word, cls });
      i = j;
      continue;
    }
    tokens.push({ text: ch, cls: "punct" });
    i++;
  }

  return tokens;
}

export function tokenizeLines(code: string, lang: HlLang = "js"): Token[][] {
  return code.replace(/\r\n/g, "\n").split("\n").map((l) => tokenizeLine(l, lang));
}
