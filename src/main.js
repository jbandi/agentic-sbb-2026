import { marked } from "marked";
import hljs from "highlight.js/lib/common";
import hljsDark from "highlight.js/styles/github-dark-dimmed.css?inline";
import hljsLight from "highlight.js/styles/github.css?inline";
import "./style.css";
import { parseConversation } from "./parser.js";

// Every .md file in /conversations shows up automatically — just drop a file in.
const files = import.meta.glob("../conversations/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

marked.setOptions({ gfm: true, breaks: false });

const conversations = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, raw]) => {
    const filename = path.split("/").pop().replace(/\.md$/, "");
    const slug = filename.replace(/^\d+[-_]?/, "");
    return { slug, ...parseConversation(raw, filename) };
  });

const listEl = document.getElementById("conversation-list");
const chatEl = document.getElementById("chat");
const titleEl = document.getElementById("conversation-title");
const sidebarEl = document.getElementById("sidebar");

document.getElementById("sidebar-toggle").addEventListener("click", () => {
  sidebarEl.classList.toggle("collapsed");
});

// Theme switch: swaps the CSS variables and the highlight.js stylesheet.
const themeToggle = document.getElementById("theme-toggle");
const hljsStyle = document.createElement("style");
document.head.appendChild(hljsStyle);

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  hljsStyle.textContent = theme === "light" ? hljsLight : hljsDark;
  themeToggle.textContent = theme === "light" ? "☾" : "☀";
  localStorage.setItem("t3-theme", theme);
}

themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
});

applyTheme(localStorage.getItem("t3-theme") ?? "dark");

function renderList(activeSlug) {
  listEl.innerHTML = "";
  for (const conv of conversations) {
    const a = document.createElement("a");
    a.href = `#${conv.slug}`;
    a.textContent = conv.title;
    a.className = conv.slug === activeSlug ? "active" : "";
    listEl.appendChild(a);
  }
}

function renderMessage(msg) {
  const el = document.createElement("div");
  el.className = `message ${msg.role}`;

  if (msg.role === "tool") {
    el.appendChild(renderToolCall(msg));
    return el;
  }

  const body = document.createElement("div");
  body.className = "bubble";
  body.innerHTML = marked.parse(msg.content);
  body.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));
  if (msg.role === "agent") {
    const label = document.createElement("div");
    label.className = "agent-label";
    label.innerHTML = `<span class="brand-mark">▲</span> Agent`;
    if (msg.duration) {
      const duration = document.createElement("span");
      duration.className = "agent-duration";
      duration.textContent = ` (Dauer: ${msg.duration})`;
      label.appendChild(duration);
    }
    el.appendChild(label);
  }
  el.appendChild(body);
  return el;
}

function renderToolCall(msg) {
  const [command, ...rest] = msg.content.split("\n");
  const details = document.createElement("details");
  details.className = "tool-call";
  details.innerHTML = `
    <summary><span class="tool-dot">⏺</span><code>${escapeHtml(command)}</code></summary>
    <pre class="tool-output">${escapeHtml(rest.join("\n").trim())}</pre>`;
  return details;
}

function renderProgressUpdate(msg) {
  const el = document.createElement("div");
  el.className = "progress-update";
  el.innerHTML = `<span class="progress-mark">▲</span>`;

  const body = document.createElement("div");
  body.className = "bubble progress-body";
  body.innerHTML = marked.parse(msg.content);
  body.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));
  el.appendChild(body);
  return el;
}

function parseDurationInSeconds(value) {
  const match = value?.trim().match(/^(?:(\d+)\s*min\s*)?(?:(\d+)\s*s)?$/i);
  if (!match || (match[1] === undefined && match[2] === undefined)) return undefined;
  return Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (!minutes) return `${remainingSeconds} s`;
  if (!remainingSeconds) return `${minutes} min`;
  return `${minutes} min ${remainingSeconds} s`;
}

function getWorkDuration(messages, fallbackDuration) {
  const durations = messages
    .filter((msg) => msg.role === "progress" && msg.duration)
    .map((msg) => msg.duration);
  const seconds = durations.map(parseDurationInSeconds);
  if (seconds.length && seconds.every((value) => value !== undefined)) {
    return formatDuration(seconds.reduce((total, value) => total + value, 0));
  }
  return fallbackDuration ?? durations.at(-1) ?? "a while";
}

function renderWorkGroup(messages, fallbackDuration) {
  const el = document.createElement("div");
  el.className = "message work-group";

  const details = document.createElement("details");
  details.className = "work-group-details";

  const summary = document.createElement("summary");
  summary.textContent = `Worked for ${getWorkDuration(messages, fallbackDuration)}`;
  details.appendChild(summary);

  const content = document.createElement("div");
  content.className = "work-group-content";
  for (const msg of messages) {
    content.appendChild(
      msg.role === "tool" ? renderToolCall(msg) : renderProgressUpdate(msg)
    );
  }
  details.appendChild(content);

  el.appendChild(details);
  return el;
}

function renderConversation(slug) {
  const conv = conversations.find((c) => c.slug === slug) ?? conversations[0];
  if (!conv) {
    titleEl.textContent = "";
    chatEl.innerHTML = `<div class="empty">Keine Konversationen gefunden. Lege eine <code>.md</code>-Datei im Ordner <code>conversations/</code> ab.</div>`;
    return;
  }
  renderList(conv.slug);
  titleEl.textContent = conv.title;
  chatEl.innerHTML = "";
  for (let index = 0; index < conv.messages.length;) {
    const msg = conv.messages[index];
    const isWorkMessage = (message) => ["tool", "progress"].includes(message?.role);
    if (!isWorkMessage(msg)) {
      chatEl.appendChild(renderMessage(msg));
      index += 1;
      continue;
    }

    let groupEnd = index + 1;
    while (isWorkMessage(conv.messages[groupEnd])) groupEnd += 1;
    const workMessages = conv.messages.slice(index, groupEnd);
    const toolCount = workMessages.filter((message) => message.role === "tool").length;
    const hasProgress = workMessages.some((message) => message.role === "progress");

    if (hasProgress || toolCount > 1) {
      const nextAgentDuration = conv.messages[groupEnd]?.role === "agent"
        ? conv.messages[groupEnd].duration
        : undefined;
      const previousAgentDuration = conv.messages[index - 1]?.role === "agent"
        ? conv.messages[index - 1].duration
        : undefined;
      chatEl.appendChild(
        renderWorkGroup(workMessages, nextAgentDuration ?? previousAgentDuration)
      );
    } else {
      chatEl.appendChild(renderMessage(msg));
    }
    index = groupEnd;
  }
  chatEl.scrollTop = 0;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

window.addEventListener("hashchange", () =>
  renderConversation(decodeURIComponent(location.hash.slice(1)))
);
renderConversation(decodeURIComponent(location.hash.slice(1)));
