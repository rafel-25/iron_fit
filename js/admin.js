import { supabase } from "../lib/supabase.js";
import { requireProfile, logout } from "./common.js";

const $ = (selector) => document.querySelector(selector);
const siteForm = $("#siteContentForm");
const siteMsg = $("#siteContentMessage");
let currentSiteContent = {};
let selectedProgramId = null;
const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
$("#logout")?.addEventListener("click", logout);

const ctx = await requireProfile();
if (ctx && ctx.profile.role !== "admin") location.replace("../user/dashboard.html");
if (ctx?.profile.role === "admin") {
  $("#welcome").textContent = `Signed in as ${ctx.profile.username} · Administrator`;
  await refresh();
  await loadSiteContentEditor();
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

  $("#workouts").innerHTML = workouts.map(x=>`<article class="item program-admin-item"><strong>${esc(x.title)}</strong><p class="muted">${esc(x.category)} · ${esc(x.level)} · ${x.duration_minutes} min</p><p class="muted">${esc(x.description||"")}</p><div class="admin-actions"><button class="mini" data-action="manage-exercises" data-id="${x.id}" data-title="${esc(x.title)}">Manage exercises</button><a class="mini" href="../program.html?id=${x.id}" target="_blank" rel="noopener">Preview page</a><button class="mini" data-action="edit-workout" data-id="${x.id}">Edit</button><button class="mini danger" data-action="delete-workout" data-id="${x.id}">Delete</button></div></article>`).join("") || '<p class="muted">No programs yet. Add your first program above.</p>';
  $("#plans").innerHTML = plans.map(x=>`<article class="item"><strong>${esc(x.title)}</strong><p class="muted">${esc(x.goal)} · ${x.calories} kcal/day</p><p class="muted">${esc(x.description||"")}</p><button class="mini" data-action="edit-plan" data-id="${x.id}">Edit</button><button class="mini danger" data-action="delete-plan" data-id="${x.id}">Delete</button></article>`).join("") || '<p class="muted">No nutrition plans yet.</p>';
}

$("#workoutForm").addEventListener("submit", async e => {
  e.preventDefault();
  const data={title:$("#wTitle").value.trim(),category:$("#wCategory").value.trim()||"General",level:$("#wLevel").value,duration_minutes:Number($("#wDuration").value),description:$("#wDescription").value.trim()||null,image_url:$("#wImage").value.trim()||null};
  if(!data.title||!Number.isInteger(data.duration_minutes)||data.duration_minutes<1||data.duration_minutes>600)return message("Enter a title and valid duration.");
  const {error}=await supabase.from("workouts").insert(data);
  if(error)return message(error.message);
  e.target.reset();$("#wDuration").value=30;message("Program added.",true);await refresh();
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
  if(action==="manage-exercises"){
    selectedProgramId=id;
    const panel=$("#exerciseManager");
    panel.hidden=false;
    $("#exerciseManagerTitle").textContent=`EXERCISES · ${b.dataset.title || "PROGRAM"}`;
    $("#exerciseForm").reset();
    $("#eSets").value=3;$("#eReps").value="10-12";$("#eRest").value=60;$("#eOrder").value=0;
    await loadProgramExercises();
    panel.scrollIntoView({behavior:"smooth",block:"start"});
    return;
  }
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
    const image_url=prompt("Program image URL (https://...):");if(image_url===null)return;
    const {error}=await supabase.from("workouts").update({title:title.trim(),category:category.trim()||"General",level,duration_minutes:duration,description:description.trim()||null,image_url:image_url.trim()||null}).eq("id",id);
    if(error)return message(error.message);message("Workout updated.",true);return refresh();
  }
  if(action==="edit-exercise"){
    const title=prompt("Exercise name:",b.dataset.title||"");if(title===null||!title.trim())return;
    const muscle_group=prompt("Muscle group:",b.dataset.muscle||"");if(muscle_group===null)return;
    const sets=Number(prompt("Sets:",b.dataset.sets||"3"));if(!Number.isInteger(sets)||sets<1||sets>20)return message("Sets must be between 1 and 20.");
    const reps=prompt("Reps:",b.dataset.reps||"10-12");if(reps===null||!reps.trim())return;
    const rest_seconds=Number(prompt("Rest seconds:",b.dataset.rest||"60"));if(!Number.isInteger(rest_seconds)||rest_seconds<0||rest_seconds>900)return message("Invalid rest time.");
    const instructions=prompt("Instructions:",b.dataset.instructions||"");if(instructions===null)return;
    const {error}=await supabase.from("program_exercises").update({title:title.trim(),muscle_group:muscle_group.trim()||null,sets,reps:reps.trim(),rest_seconds,instructions:instructions.trim()||null}).eq("id",id);
    if(error)return message(error.message);message("Exercise updated.",true);return loadProgramExercises();
  }
  if(action==="delete-exercise"){
    if(!confirm("Delete this exercise?"))return;
    const {error}=await supabase.from("program_exercises").delete().eq("id",id);
    if(error)return message(error.message);message("Exercise deleted.",true);return loadProgramExercises();
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


async function loadProgramExercises() {
  if (!selectedProgramId) return;
  const { data, error } = await supabase.from("program_exercises")
    .select("*").eq("workout_id", selectedProgramId)
    .order("sort_order", { ascending: true }).order("id", { ascending: true });
  if (error) return message(error.message);
  $("#programExercises").innerHTML = (data || []).map(x => `
    <article class="item">
      <strong>${esc(x.title)}</strong>
      <p class="muted">${esc(x.muscle_group || "Full body")} · ${x.sets} sets × ${esc(x.reps)} reps · ${x.rest_seconds}s rest</p>
      <p class="muted">${esc(x.instructions || "")}</p>
      <button class="mini" data-action="edit-exercise" data-id="${x.id}" data-title="${esc(x.title)}" data-muscle="${esc(x.muscle_group || "")}" data-sets="${x.sets}" data-reps="${esc(x.reps)}" data-rest="${x.rest_seconds}" data-instructions="${esc(x.instructions || "")}">Edit</button>
      <button class="mini danger" data-action="delete-exercise" data-id="${x.id}">Delete</button>
    </article>`).join("") || '<p class="muted">No exercises added to this program yet.</p>';
}

$("#exerciseForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!selectedProgramId) return message("Choose a program first.");
  const data = {
    workout_id: selectedProgramId,
    title: $("#eTitle").value.trim(),
    muscle_group: $("#eMuscle").value.trim() || null,
    sets: Number($("#eSets").value),
    reps: $("#eReps").value.trim(),
    rest_seconds: Number($("#eRest").value),
    sort_order: Number($("#eOrder").value) || 0,
    instructions: $("#eInstructions").value.trim() || null
  };
  if (!data.title || !data.reps || !Number.isInteger(data.sets) || data.sets < 1 || data.sets > 20 || !Number.isInteger(data.rest_seconds) || data.rest_seconds < 0 || data.rest_seconds > 900) {
    return message("Check the exercise name, sets, reps and rest time.");
  }
  const { error } = await supabase.from("program_exercises").insert(data);
  if (error) return message(error.message);
  event.target.reset();
  $("#eSets").value = 3; $("#eReps").value = "10-12"; $("#eRest").value = 60;
  message("Exercise added to program.", true);
  await loadProgramExercises();
});
