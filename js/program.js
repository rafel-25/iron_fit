import { supabase } from "../lib/supabase.js";

const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[ch]));
const params = new URLSearchParams(location.search);
const id = Number(params.get("id"));

async function loadProgram() {
  if (!Number.isInteger(id) || id < 1) return showError("This program link is not valid.");
  const [{ data: program, error: programError }, { data: exercises, error: exerciseError }] = await Promise.all([
    supabase.from("workouts").select("id,title,category,level,duration_minutes,description,image_url").eq("id", id).maybeSingle(),
    supabase.from("program_exercises").select("id,title,muscle_group,sets,reps,rest_seconds,instructions,sort_order").eq("workout_id", id).order("sort_order", { ascending: true }).order("id", { ascending: true })
  ]);
  if (programError) return showError(programError.message);
  if (!program) return showError("This program is not available.");
  if (exerciseError) return showError(exerciseError.message);

  document.title = program.title + " | IRON FIT";
  $("#programTitle").textContent = program.title.toUpperCase();
  $("#programDescription").textContent = program.description || "A structured training plan designed to help you progress.";
  $("#programCategory").textContent = program.category || "TRAINING";
  $("#programLevel").textContent = program.level || "ALL LEVELS";
  $("#programDuration").textContent = (Number(program.duration_minutes) || 30) + " MIN / SESSION";
  const photo = $("#programPhoto");
  const validImage = safeImage(program.image_url);
  if (validImage) photo.style.backgroundImage = "linear-gradient(90deg,rgba(8,8,8,.1),rgba(8,8,8,.25)),url('" + validImage.replace(/'/g,"%27") + "')";
  else photo.classList.add("photo-fallback");

  $("#exerciseList").innerHTML = (exercises || []).map((item, index) => `
    <article class="exercise-card">
      <div class="exercise-number">${String(index + 1).padStart(2,"0")}</div>
      <div class="exercise-main">
        <span class="muscle-tag">${escapeHTML(item.muscle_group || "FULL BODY")}</span>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.instructions || "Perform each repetition with controlled movement and proper form.")}</p>
        <div class="exercise-stats">
          <span><b>${item.sets}</b><small>SETS</small></span>
          <span><b>${escapeHTML(item.reps)}</b><small>REPS</small></span>
          <span><b>${item.rest_seconds}s</b><small>REST</small></span>
        </div>
      </div>
    </article>`).join("") || '<div class="empty-state"><h3>EXERCISES COMING SOON</h3><p>This program has no exercises yet. Check back soon.</p></div>';
}
function safeImage(value) {
  try { const url = new URL(value); return ["https:","http:"].includes(url.protocol) ? url.href : ""; }
  catch { return ""; }
}
function showError(text) {
  $("#programTitle").textContent = "PROGRAM UNAVAILABLE";
  $("#programDescription").textContent = text;
  $("#exerciseList").innerHTML = '<div class="empty-state"><p>Return to the programs list and choose another program.</p><a href="index.html#programs">VIEW PROGRAMS →</a></div>';
}
loadProgram();
