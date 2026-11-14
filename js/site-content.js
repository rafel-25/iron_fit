import { supabase } from "../lib/supabase.js";

const setText = (key, value) => {
  const el = document.querySelector(`[data-site="${key}"]`);
  if (el && typeof value === "string") el.textContent = value;
};

const setImage = (key, value) => {
  const el = document.querySelector(`[data-site-img="${key}"]`);
  if (!el || typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") el.src = url.href;
  } catch (_) {}
};

const setList = (key, value) => {
  const el = document.querySelector(`[data-site-list="${key}"]`);
  if (!el || typeof value !== "string") return;
  const items = value.split("|").map(x => x.trim()).filter(Boolean).slice(0, 8);
  el.replaceChildren(...items.map(item => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }));
};

async function loadHomeContent() {
  const { data, error } = await supabase
    .from("site_content")
    .select("content")
    .eq("id", "home")
    .maybeSingle();

  if (error || !data?.content) {
    if (error) console.warn("IRON FIT home content could not be loaded:", error.message);
    return;
  }

  const c = data.content;
  [
    "heroTitleMain","heroTitleAccent","heroDescription","heroButton",
    "programEyebrow","programTitle","programDescription",
    "aboutTitle","aboutDescription",
    "nutritionEyebrow","nutritionTitle","nutritionDescription",
    "contactTitle","contactButton","footerText"
  ].forEach(key => setText(key, c[key]));

  (c.programs || []).slice(0, 3).forEach((card, i) => {
    setText(`program${i}Eyebrow`, card.eyebrow);
    setText(`program${i}Title`, card.title);
    setText(`program${i}Description`, card.description);
    setImage(`program${i}`, card.image);
  });

  (c.nutritionCards || []).slice(0, 3).forEach((card, i) => {
    setText(`nutrition${i}Icon`, card.icon);
    setText(`nutrition${i}Title`, card.title);
    setText(`nutrition${i}Description`, card.description);
    setList(`nutrition${i}Points`, card.points);
  });

  const contact = document.querySelector("[data-site-contact]");
  if (contact && typeof c.contactEmail === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.contactEmail)) {
    contact.href = `mailto:${c.contactEmail}`;
  }
}

loadHomeContent();


async function loadPublishedPrograms() {
  const container = document.querySelector("#public-programs");
  if (!container) return;
  const { data, error } = await supabase
    .from("workouts")
    .select("id,title,category,level,duration_minutes,description,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("IRON FIT programs could not be loaded:", error.message);
    return;
  }

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));

  if (!data?.length) {
    container.innerHTML = '<p class="program-empty">No programs published yet. Check back soon.</p>';
    return;
  }

  const photos = [
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=900",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900"
  ];

  container.innerHTML = data.map((program, index) => `
    <article class="program-card">
      <img src="${photos[index % photos.length]}" alt="${escapeHTML(program.title)}" loading="lazy">
      <div class="card-content">
        <span>${escapeHTML(program.category || "TRAINING")} / ${escapeHTML(program.level || "ALL LEVELS")}</span>
        <h3>${escapeHTML(program.title)}</h3>
        <p>${escapeHTML(program.description || "")}</p>
        <small>${Number(program.duration_minutes) || 30} MINUTES</small>
      </div>
    </article>
  `).join("");
}

loadPublishedPrograms();
