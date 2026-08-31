// Parses a conversation file into { title, messages }.
//
// File format (Markdown with role markers on their own line):
//
//   # Optional title
//
//   ===USER===
//   text of the user message
//
//   ===AGENT===
//   markdown answer of the agent
//
//   ===TOOL===
//   $ command on the first line
//   output on the following lines
//
const MARKER = /^===(USER|AGENT|TOOL)===\s*$/;

export function parseConversation(raw, fallbackTitle) {
  const lines = raw.split(/\r?\n/);
  let title = fallbackTitle;
  const messages = [];
  let current = null;

  for (const line of lines) {
    const match = line.match(MARKER);
    if (match) {
      if (current) messages.push(finish(current));
      current = { role: match[1].toLowerCase(), lines: [] };
      continue;
    }
    if (!current) {
      const heading = line.match(/^#\s+(.*)/);
      if (heading) title = heading[1].trim();
      continue;
    }
    current.lines.push(line);
  }
  if (current) messages.push(finish(current));

  return { title, messages };
}

function finish(section) {
  return { role: section.role, content: section.lines.join("\n").trim() };
}
