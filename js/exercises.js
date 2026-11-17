import { supabase } from "../lib/supabase.js";
const $ = s => document.querySelector(s);
const categories = ["All","Chest","Back","Legs","Calves","Shoulders","Arms","Abs"];
let exercises = [];
let selected = "All";
let query = new URLSearchParams(location.search).get("search")?.trim().toLowerCase() || "";
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function safeUrl(value){
  try{const url=new URL(value);return ["https:","http:"].includes(url.protocol)?url.href:"";}catch{return "";}
}
function render(){
  const filtered=exercises.filter(x=>(selected==="All"||x.category===selected)&&(String(x.title+" "+x.description+" "+(x.equipment||"")).toLowerCase().includes(query)));
  $("#categoryTitle").textContent=selected==="All"?"ALL EXERCISES":selected.toUpperCase()+" EXERCISES";
  $("#exerciseCount").textContent=filtered.length+" EXERCISES";
  $("#exerciseGrid").innerHTML=filtered.map(x=>{
    const video=safeUrl(x.video_url), poster=safeUrl(x.poster_url);
    const steps=Array.isArray(x.steps)?x.steps:[];
    const cues=Array.isArray(x.form_cues)?x.form_cues:[];
    const mistakes=Array.isArray(x.common_mistakes)?x.common_mistakes:[];
    return `
      <article class="exercise-card">
        <div class="exercise-top"><span class="tag">${escapeHTML(x.category)}</span><span class="difficulty">${escapeHTML(x.difficulty||"Beginner")}</span></div>
        <h3>${escapeHTML(x.title)}</h3>
        <p>${escapeHTML(x.description)}</p>
        ${video?`<video class="exercise-video" autoplay muted loop playsinline preload="none" poster="${escapeHTML(poster)}" data-video-src="${escapeHTML(video)}" aria-label="${escapeHTML(x.title)} exercise demonstration"></video>`:'<div class="video-placeholder">DEMO VIDEO COMING SOON</div>'}
        <div class="equipment">EQUIPMENT · ${escapeHTML(x.equipment||"Bodyweight")}</div>
        <details class="exercise-guide"><summary>HOW TO PERFORM</summary>
          ${x.instructions?`<p>${escapeHTML(x.instructions)}</p>`:""}
          ${steps.length?`<ol>${steps.map(step=>`<li>${escapeHTML(step)}</li>`).join("")}</ol>`:""}
          ${cues.length?`<h4>FORM CUES</h4><ul>${cues.map(v=>`<li>${escapeHTML(v)}</li>`).join("")}</ul>`:""}
          ${mistakes.length?`<h4>COMMON MISTAKES</h4><ul>${mistakes.map(v=>`<li>${escapeHTML(v)}</li>`).join("")}</ul>`:""}
          ${x.breathing?`<p><b>Breathing:</b> ${escapeHTML(x.breathing)}</p>`:""}
        </details>
      </article>`;
  }).join("")||'<div class="empty">No exercises found. Try another search or category.</div>';
}
// Load each demo shortly before it enters the viewport. Muted looping
// video gives a GIF-like experience without the much larger GIF file size.
function setupLazyExerciseVideos(){
  const videos=[...document.querySelectorAll("video[data-video-src]")];
  const start=video=>{
    if(video.dataset.loaded==="true")return;
    const src=safeUrl(video.dataset.videoSrc);
    if(!src)return;
    video.src=src;
    video.dataset.loaded="true";
    video.load();
    const play=()=>video.play().catch(()=>{});
    if(video.readyState>=2)play();
    else video.addEventListener("loadeddata",play,{once:true});
  };
  if(!("IntersectionObserver" in window)){
    videos.forEach(start);
    return;
  }
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      start(entry.target);
      observer.unobserve(entry.target);
    });
  },{rootMargin:"280px 0px",threshold:0.01});
  videos.forEach(video=>observer.observe(video));
}
async function init(){
  const {data,error}=await supabase.from("exercises").select("id,title,category,description,equipment,difficulty,video_url,poster_url,instructions,steps,form_cues,common_mistakes,breathing,target").order("category").order("title");
  if(error){$("#exerciseGrid").innerHTML='<p class="empty error">Could not load the exercise library. Please refresh the page.</p>';return;}
  exercises=data||[];render();setupLazyExerciseVideos();
  if(query){
    const match=exercises.find(x=>String(x.title||"").toLowerCase()===query)
      || exercises.find(x=>String(x.title||"").toLowerCase().includes(query));
    if(match){
      selected=match.category;
      $("#categoryTabs").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.category===selected));
      render();
      const card=[...$("#exerciseGrid").querySelectorAll(".exercise-card")].find(el=>el.querySelector("h3")?.textContent===match.title);
      card?.querySelector("details")?.setAttribute("open","");
      card?.scrollIntoView({behavior:"smooth",block:"center"});
    }
  }
}
$("#categoryTabs").addEventListener("click",e=>{
  const button=e.target.closest("button[data-category]");if(!button)return;
  selected=button.dataset.category;
  $("#categoryTabs").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b===button));
  render();
});
const searchInput=$("#exerciseSearch");
searchInput.value=query;
searchInput.addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();render();});
init();