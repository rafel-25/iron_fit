import {supabase} from "../lib/supabase.js";
import {requireProfile,logout} from "./common.js";
const $=s=>document.querySelector(s);
const ctx=await requireProfile();
if(!ctx) throw new Error("Authentication required");
document.querySelectorAll(".exercise-item").forEach(label=>{const name=label.querySelector("span")?.textContent?.trim();const input=label.querySelector("input");if(name&&input)input.dataset.title=name;});
const items=[...document.querySelectorAll(".exercise-check")];
const today=new Date(); const dateKey=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
const {data:logs,error}=await supabase.from("workout_logs").select("exercise_title,completed").eq("user_id",ctx.user.id).eq("workout_date",dateKey);
if(error) console.error(error);
const done=new Set((logs||[]).filter(x=>x.completed).map(x=>x.exercise_title));
items.forEach(x=>{x.checked=done.has(x.dataset.title);x.addEventListener("change",async()=>{
 x.disabled=true; const title=x.dataset.title;
 const result=x.checked?await supabase.from("workout_logs").upsert({user_id:ctx.user.id,workout_date:dateKey,exercise_title:title,completed:true},{onConflict:"user_id,workout_date,exercise_title"}):await supabase.from("workout_logs").delete().eq("user_id",ctx.user.id).eq("workout_date",dateKey).eq("exercise_title",title);
 x.disabled=false;if(result.error){x.checked=!x.checked;alert("Could not save progress: "+result.error.message);}update();
});});
function update(){const count=items.filter(x=>x.checked).length,total=items.length,pct=total?Math.round(count/total*100):0;$("#workout-count").textContent=count;$("#goal-count").textContent=pct+"%";$("#remaining-count").textContent=total-count;$("#progress-fill").style.width=pct+"%";$("#progress-text").textContent=count+" of "+total+" completed";}
window.resetWorkout=async()=>{if(!confirm("Reset today's workout progress?"))return;const {error}=await supabase.from("workout_logs").delete().eq("user_id",ctx.user.id).eq("workout_date",dateKey);if(error){alert(error.message);return;}items.forEach(x=>x.checked=false);update();};
update();
