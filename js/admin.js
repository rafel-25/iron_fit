import { supabase } from "../lib/supabase.js";
import { requireProfile, logout } from "./common.js";

const $ = (selector) => document.querySelector(selector);
const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
$("#logout")?.addEventListener("click", logout);

const ctx = await requireProfile();
if (ctx && ctx.profile.role !== "admin") location.replace("../user/dashboard.html");
if (ctx?.profile.role === "admin") {
  $("#welcome").textContent = `Signed in as ${ctx.profile.username} · Administrator`;
  await refresh();
}

function message(text, ok = false) {
  let el = $("#adminMessage");
  if (!el) { el = document.createElement("p"); el.id = "adminMessage"; $(".panel").prepend(el); }
  el.className = ok ? "success" : "alert";
  el.textContent = text;
}

async function refresh() {
  const [m, w, p] = await Promise.all([
    supabase.from("profiles").select("id,username,role,is_active,created_at").order("created_at", {ascending:false}),
    supabase.from("workouts").select("*").order("created_at", {ascending:false}),
    supabase.from("nutrition_plans").select("*").order("created_at", {ascending:false})
  ]);
  const error = m.error || w.error || p.error;
  if (error) return message(error.message);
  const members=m.data||[], workouts=w.data||[], plans=p.data||[];
  $("#membersCount").textContent=members.length;
  $("#activeCount").textContent=members.filter(x=>x.is_active).length;
  $("#workoutCount").textContent=workouts.length;
  $("#planCount").textContent=plans.length;

  $("#members").innerHTML = `<div class="table-wrap"><table><thead><tr><th>USERNAME</th><th>ROLE</th><th>STATUS</th><th>JOINED</th><th>ACTION</th></tr></thead><tbody>${members.map(x=>{
    const self=x.id===ctx.user.id;
    return `<tr><td>${esc(x.username)}</td><td><select class="member-role" data-id="${x.id}" ${self?"disabled":""}><option value="user" ${x.role==="user"?"selected":""}>User</option><option value="admin" ${x.role==="admin"?"selected":""}>Admin</option></select></td><td class="${x.is_active?"status-on":"status-off"}">${x.is_active?"Active":"Disabled"}</td><td>${new Date(x.created_at).toLocaleDateString()}</td><td><button class="mini ${x.is_active?"danger":""}" data-action="toggle" data-id="${x.id}" data-active="${x.is_active}" ${self?"disabled":""}>${x.is_active?"Disable":"Activate"}</button></td></tr>`;
  }).join("")}</tbody></table></div><p class="muted">Your own admin account cannot be disabled or have its role changed here.</p>`;

  $("#workouts").innerHTML = workouts.map(x=>`<article class="item"><strong>${esc(x.title)}</strong><p class="muted">${esc(x.category)} · ${esc(x.level)} · ${x.duration_minutes} min</p><p class="muted">${esc(x.description||"")}</p><button class="mini" data-action="edit-workout" data-id="${x.id}">Edit</button><button class="mini danger" data-action="delete-workout" data-id="${x.id}">Delete</button></article>`).join("") || '<p class="muted">No workouts yet.</p>';
  $("#plans").innerHTML = plans.map(x=>`<article class="item"><strong>${esc(x.title)}</strong><p class="muted">${esc(x.goal)} · ${x.calories} kcal/day</p><p class="muted">${esc(x.description||"")}</p><button class="mini" data-action="edit-plan" data-id="${x.id}">Edit</button><button class="mini danger" data-action="delete-plan" data-id="${x.id}">Delete</button></article>`).join("") || '<p class="muted">No nutrition plans yet.</p>';
}

$("#workoutForm").addEventListener("submit", async e => {
  e.preventDefault();
  const data={title:$("#wTitle").value.trim(),category:$("#wCategory").value.trim()||"General",level:$("#wLevel").value,duration_minutes:Number($("#wDuration").value),description:$("#wDescription").value.trim()||null};
  if(!data.title||!Number.isInteger(data.duration_minutes)||data.duration_minutes<1||data.duration_minutes>600)return message("Enter a title and valid duration.");
  const {error}=await supabase.from("workouts").insert(data);
  if(error)return message(error.message);
  e.target.reset();$("#wDuration").value=30;message("Workout added.",true);await refresh();
});

$("#planForm").addEventListener("submit", async e => {
  e.preventDefault();
  const data={title:$("#pTitle").value.trim(),goal:$("#pGoal").value.trim()||"General fitness",calories:Number($("#pCalories").value),description:$("#pDescription").value.trim()||null};
  if(!data.title||!Number.isInteger(data.calories)||data.calories<0)return message("Enter a title and valid calories.");
  const {error}=await supabase.from("nutrition_plans").insert(data);
  if(error)return message(error.message);
  e.target.reset();$("#pCalories").value=2000;message("Nutrition plan added.",true);await refresh();
});

document.addEventListener("change", async e=>{
  if(!e.target.matches(".member-role"))return;
  const {error}=await supabase.from("profiles").update({role:e.target.value}).eq("id",e.target.dataset.id);
  if(error){message(error.message);return refresh();}
  message("Member role updated.",true);await refresh();
});

document.addEventListener("click", async e=>{
  const b=e.target.closest("button[data-action]");if(!b)return;
  const {action,id}=b.dataset;
  if(action==="toggle"){
    const {error}=await supabase.from("profiles").update({is_active:b.dataset.active!=="true"}).eq("id",id);
    if(error)return message(error.message);
    message("Member status updated.",true);return refresh();
  }
  if(action==="delete-workout"||action==="delete-plan"){
    if(!confirm("Delete this item?"))return;
    const table=action==="delete-workout"?"workouts":"nutrition_plans";
    const {error}=await supabase.from(table).delete().eq("id",id);
    if(error)return message(error.message);
    message("Item deleted.",true);return refresh();
  }
  if(action==="edit-workout"){
    const title=prompt("Workout title:");if(title===null||!title.trim())return;
    const category=prompt("Category:");if(category===null)return;
    const level=prompt("Level (Beginner, Intermediate, Advanced):");if(level===null)return;
    if(!["Beginner","Intermediate","Advanced"].includes(level))return message("Invalid level.");
    const duration=Number(prompt("Duration in minutes:"));if(!Number.isInteger(duration)||duration<1||duration>600)return message("Invalid duration.");
    const description=prompt("Description:");if(description===null)return;
    const {error}=await supabase.from("workouts").update({title:title.trim(),category:category.trim()||"General",level,duration_minutes:duration,description:description.trim()||null}).eq("id",id);
    if(error)return message(error.message);message("Workout updated.",true);return refresh();
  }
  if(action==="edit-plan"){
    const title=prompt("Plan title:");if(title===null||!title.trim())return;
    const goal=prompt("Goal:");if(goal===null)return;
    const calories=Number(prompt("Calories per day:"));if(!Number.isInteger(calories)||calories<0)return message("Invalid calories.");
    const description=prompt("Description:");if(description===null)return;
    const {error}=await supabase.from("nutrition_plans").update({title:title.trim(),goal:goal.trim()||"General fitness",calories,description:description.trim()||null}).eq("id",id);
    if(error)return message(error.message);message("Nutrition plan updated.",true);return refresh();
  }
});


/* HOME PAGE WEBSITE BUILDER */
const siteForm = $("#siteContentForm");
const siteMsg = $("#siteContentMessage");
let currentSiteContent = {};

function siteValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}
function setSiteValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}
function showSiteMessage(text, ok = false) {
  if (!siteMsg) return;
  siteMsg.textContent = text;
  siteMsg.className = ok ? "success" : "alert";
}

async function loadSiteContentEditor() {
  if (!siteForm) return;
  const { data, error } = await supabase
    .from("site_content")
    .select("content")
    .eq("id", "home")
    .maybeSingle();

  if (error) return showSiteMessage(error.message);
  currentSiteContent = data?.content || {};
  const c = currentSiteContent;

  const fields = {
    sHeroTitleMain: "heroTitleMain",
    sHeroTitleAccent: "heroTitleAccent",
    sHeroDescription: "heroDescription",
    sHeroButton: "heroButton",
    sProgramEyebrow: "programEyebrow",
    sProgramTitle: "programTitle",
    sProgramDescription: "programDescription",
    sAboutTitle: "aboutTitle",
    sAboutDescription: "aboutDescription",
    sNutritionEyebrow: "nutritionEyebrow",
    sNutritionTitle: "nutritionTitle",
    sNutritionDescription: "nutritionDescription",
    sContactTitle: "contactTitle",
    sContactButton: "contactButton",
    sContactEmail: "contactEmail",
    sFooterText: "footerText"
  };
  Object.entries(fields).forEach(([id, key]) => setSiteValue(id, c[key]));

  (c.programs || []).forEach((item, i) => {
    ["Eyebrow", "Title", "Description", "Image"].forEach(part => {
      const key = part.toLowerCase();
      setSiteValue(`sProgram${i}${part}`, item[key]);
    });
  });
  (c.nutritionCards || []).forEach((item, i) => {
    setSiteValue(`sNutrition${i}Icon`, item.icon);
    setSiteValue(`sNutrition${i}Title`, item.title);
    setSiteValue(`sNutrition${i}Description`, item.description);
    setSiteValue(`sNutrition${i}Points`, (item.points || "").split("|").join("\n"));
  });
}

if (siteForm) {
  siteForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = siteForm.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    showSiteMessage("Saving home page…", true);

    const next = {
      ...currentSiteContent,
      heroTitleMain: siteValue("sHeroTitleMain"),
      heroTitleAccent: siteValue("sHeroTitleAccent"),
      heroDescription: siteValue("sHeroDescription"),
      heroButton: siteValue("sHeroButton"),
      programEyebrow: siteValue("sProgramEyebrow"),
      programTitle: siteValue("sProgramTitle"),
      programDescription: siteValue("sProgramDescription"),
      programs: [0,1,2].map(i => ({
        eyebrow: siteValue(`sProgram${i}Eyebrow`),
        title: siteValue(`sProgram${i}Title`),
        description: siteValue(`sProgram${i}Description`),
        image: siteValue(`sProgram${i}Image`)
      })),
      aboutTitle: siteValue("sAboutTitle"),
      aboutDescription: siteValue("sAboutDescription"),
      nutritionEyebrow: siteValue("sNutritionEyebrow"),
      nutritionTitle: siteValue("sNutritionTitle"),
      nutritionDescription: siteValue("sNutritionDescription"),
      nutritionCards: [0,1,2].map(i => ({
        icon: siteValue(`sNutrition${i}Icon`),
        title: siteValue(`sNutrition${i}Title`),
        description: siteValue(`sNutrition${i}Description`),
        points: siteValue(`sNutrition${i}Points`).split("\n").map(x => x.trim()).filter(Boolean).join("|")
      })),
      contactTitle: siteValue("sContactTitle"),
      contactButton: siteValue("sContactButton"),
      contactEmail: siteValue("sContactEmail"),
      footerText: siteValue("sFooterText")
    };

    const { error } = await supabase
      .from("site_content")
      .update({ content: next, updated_at: new Date().toISOString() })
      .eq("id", "home");

    if (button) button.disabled = false;
    if (error) return showSiteMessage(error.message);
    currentSiteContent = next;
    showSiteMessage("Home page saved successfully. Refresh the website to see the changes.", true);
  });
}
