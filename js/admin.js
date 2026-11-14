import { supabase } from "../lib/supabase.js";
import { requireProfile, logout } from "./common.js";
const $ = s => document.querySelector(s);
const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
$("#logout")?.addEventListener("click",logout);
const ctx=await requireProfile();
if(ctx && ctx.profile.role!=="admin") location.replace("../user/dashboard.html");
if(ctx?.profile.role==="admin"){
  $("#welcome").textContent="Signed in as "+ctx.profile.username;
  await refresh();
}
function notify(text,ok=false){
  const el=$("#adminMessage");if(!el)return;
  el.textContent=text;el.className="msg "+(ok?"success":"error");
}
async function refresh(){
  const [m,x]=await Promise.all([
    supabase.from("profiles").select("id,username,created_at").eq("role","user").eq("is_active",true).order("created_at",{ascending:false}),
    supabase.from("exercises").select("id,title,category,description,equipment,difficulty,video_url").order("category").order("title")
  ]);
  if(m.error||x.error){notify((m.error||x.error).message);return;}
  const members=m.data||[], exercises=x.data||[];
  $("#membersCount").textContent=members.length;
  $("#exerciseCount").textContent=exercises.length;
  $("#members").innerHTML=members.map(member=>`
    <article class="item"><div><strong>${esc(member.username)}</strong><p>Joined ${new Date(member.created_at).toLocaleDateString()}</p></div><button data-action="remove-member" data-id="${member.id}">REMOVE MEMBER</button></article>
  `).join("")||'<p class="empty">No active members right now.</p>';
  $("#exerciseList").innerHTML=exercises.map(ex=>`
    <article class="item"><div><strong>${esc(ex.title)}</strong><p>${esc(ex.category)} · ${esc(ex.equipment||"Bodyweight")} · ${esc(ex.difficulty)} · ${ex.video_url?"Video ready":"No video"}</p></div><button data-action="delete-exercise" data-id="${ex.id}">DELETE</button></article>
  `).join("")||'<p class="empty">No exercises yet.</p>';
}
$("#exerciseForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const button=$("#addExercise");button.disabled=true;
  const row={
    title:$("#eTitle").value.trim(),
    category:$("#eCategory").value,
    description:$("#eDescription").value.trim(),
    equipment:$("#eEquipment").value.trim()||null,
    difficulty:$("#eDifficulty").value,
    video_url:$("#eVideo").value.trim()||null,
    poster_url:$("#ePoster").value.trim()||null,
    steps:$("#eSteps").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)
  };
  if(!row.title||!row.description){button.disabled=false;return notify("Add an exercise name and explanation.");}
  for(const value of [row.video_url,row.poster_url].filter(Boolean)){try{const u=new URL(value);if(!["https:","http:"].includes(u.protocol))throw new Error();}catch{button.disabled=false;return notify("Enter valid http or https media URLs.");}}
  const {error}=await supabase.from("exercises").insert(row);
  button.disabled=false;
  if(error)return notify(error.message);
  event.target.reset();$("#eCategory").value="Chest";$("#eDifficulty").value="Beginner";
  notify("Exercise added to the library.",true);
  await refresh();
});
document.addEventListener("click",async event=>{
  const button=event.target.closest("button[data-action]");if(!button)return;
  const id=button.dataset.id;
  if(button.dataset.action==="remove-member"){
    if(!confirm("Remove this member and disable their IRON FIT access?"))return;
    const {error}=await supabase.from("profiles").update({is_active:false}).eq("id",id).eq("role","user");
    if(error)return notify(error.message);
    notify("Member access disabled.",true);return refresh();
  }
  if(button.dataset.action==="delete-exercise"){
    if(!confirm("Delete this exercise from the public library?"))return;
    const {error}=await supabase.from("exercises").delete().eq("id",id);
    if(error)return notify(error.message);
    notify("Exercise deleted.",true);return refresh();
  }
});
