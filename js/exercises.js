import { supabase } from "../lib/supabase.js";
const $ = s => document.querySelector(s);
const categories = ["All","Chest","Back","Legs","Shoulders","Arms","Abs"];
let exercises = [];
let selected = "All";
let query = "";
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function render(){
  const filtered = exercises.filter(x => (selected==="All" || x.category===selected) && (String(x.title+" "+x.description+" "+(x.equipment||"")).toLowerCase().includes(query)));
  $("#categoryTitle").textContent = selected==="All" ? "ALL EXERCISES" : selected.toUpperCase()+" EXERCISES";
  $("#exerciseCount").textContent = filtered.length+" EXERCISES";
  $("#exerciseGrid").innerHTML = filtered.map(x=>`
    <article class="exercise-card">
      <div class="exercise-top"><span class="tag">${escapeHTML(x.category)}</span><span class="difficulty">${escapeHTML(x.difficulty||"Beginner")}</span></div>
      <h3>${escapeHTML(x.title)}</h3>
      <p>${escapeHTML(x.description)}</p>
      <div class="equipment">EQUIPMENT · ${escapeHTML(x.equipment||"Bodyweight")}</div>
      ${x.demo_url ? `<a class="demo-link" href="${escapeHTML(x.demo_url)}" target="_blank" rel="noopener noreferrer">WATCH ANIMATED DEMO <span>↗</span></a>` : '<span class="demo-link">DEMO COMING SOON</span>'}
    </article>`).join("") || '<div class="empty">No exercises found. Try another search or category.</div>';
}
async function init(){
  const {data,error}=await supabase.from("exercises").select("id,title,category,description,equipment,difficulty,demo_url").order("category").order("title");
  if(error){$("#exerciseGrid").innerHTML='<p class="empty error">Could not load the exercise library. Please refresh the page.</p>';return;}
  exercises=data||[];
  render();
}
$("#categoryTabs").addEventListener("click",e=>{
  const button=e.target.closest("button[data-category]");if(!button)return;
  selected=button.dataset.category;
  $("#categoryTabs").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b===button));
  render();
});
$("#exerciseSearch").addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();render();});
init();