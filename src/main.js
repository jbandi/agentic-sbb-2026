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
    const [command, ...rest] = msg.content.split("\n");
    el.innerHTML = `
      <details open>
        <summary><span class="tool-dot">⏺</span><code>${escapeHtml(command)}</code></summary>
        <pre class="tool-output">${escapeHtml(rest.join("\n").trim())}</pre>
      </details>`;
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
    el.appendChild(label);
  }
  el.appendChild(body);
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
  for (const msg of conv.messages) chatEl.appendChild(renderMessage(msg));
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
