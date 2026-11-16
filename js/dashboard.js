import {supabase} from "../lib/supabase.js";
import {requireProfile} from "./common.js";
const $=s=>document.querySelector(s);
const ctx=await requireProfile();
if(!ctx) throw new Error("Authentication required");
document.querySelectorAll(".exercise-item").forEach(label=>{const name=label.querySelector("span")?.textContent?.trim();const input=label.querySelector("input");if(name&&input)input.dataset.title=name;});
const items=[...document.querySelectorAll(".exercise-check")];
const today=new Date(),dateKey=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
const {data:logs,error}=await supabase.from("workout_logs").select("exercise_title,completed").eq("user_id",ctx.user.id).eq("workout_date",dateKey);
if(error)console.error(error);
const done=new Set((logs||[]).filter(x=>x.completed).map(x=>x.exercise_title));
items.forEach(x=>{x.checked=done.has(x.dataset.title);x.addEventListener("change",async()=>{
 x.disabled=true;const result=x.checked?await supabase.from("workout_logs").upsert({user_id:ctx.user.id,workout_date:dateKey,exercise_title:x.dataset.title,completed:true},{onConflict:"user_id,workout_date,exercise_title"}):await supabase.from("workout_logs").delete().eq("user_id",ctx.user.id).eq("workout_date",dateKey).eq("exercise_title",x.dataset.title);
 x.disabled=false;if(result.error){x.checked=!x.checked;alert("Could not save progress: "+result.error.message);}update();await loadWeek();
});});
function update(){const count=items.filter(x=>x.checked).length,total=items.length,pct=total?Math.round(count/total*100):0;$("#workout-count").textContent=count;$("#goal-count").textContent=pct+"%";$("#remaining-count").textContent=total-count;$("#progress-fill").style.width=pct+"%";$("#progress-text").textContent=count+" of "+total+" completed";}
async function loadWeek(){
 const since=new Date();since.setDate(since.getDate()-6);const sinceKey=[since.getFullYear(),String(since.getMonth()+1).padStart(2,"0"),String(since.getDate()).padStart(2,"0")].join("-");
 const {data:week,error}=await supabase.from("workout_logs").select("workout_date,completed").eq("user_id",ctx.user.id).gte("workout_date",sinceKey);
 if(error){console.error(error);return;}
 const counts=Array(7).fill(0);(week||[]).forEach(row=>{if(!row.completed)return;const idx=Math.round((new Date(row.workout_date+"T12:00:00")-new Date(sinceKey+"T12:00:00"))/86400000);if(idx>=0&&idx<7)counts[idx]++;});
 const peak=Math.max(1,...counts),days=[...document.querySelectorAll(".chart-column")];
 days.forEach((d,i)=>{const bar=d.querySelector(".chart-bar");if(bar)bar.style.height=(counts[i]?Math.max(8,counts[i]/peak*100):3)+"%";const label=d.querySelector("small");if(label){const date=new Date(since);date.setDate(since.getDate()+i);label.textContent=date.toLocaleDateString(undefined,{weekday:"short"}).toUpperCase();}});
}
window.resetWorkout=async()=>{if(!confirm("Reset today's workout progress?"))return;const {error}=await supabase.from("workout_logs").delete().eq("user_id",ctx.user.id).eq("workout_date",dateKey);if(error){alert(error.message);return;}items.forEach(x=>x.checked=false);update();await loadWeek();};
update();await loadWeek();
