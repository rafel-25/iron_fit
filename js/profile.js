import {supabase} from "../lib/supabase.js";
import {requireProfile,logout} from "./common.js";
const $=s=>document.querySelector(s);
const ctx=await requireProfile();
if(!ctx) throw new Error("Authentication required");
$("#profile-form").addEventListener("submit",async e=>{
 e.preventDefault(); const button=e.submitter; button.disabled=true;
 const row={full_name:$("#profile-name").value.trim(),age:Number($("#profile-age").value),weight_kg:Number($("#profile-weight").value),height_cm:Number($("#profile-height").value),fitness_goal:$("#profile-goal").value};
 const {error}=await supabase.from("profiles").update(row).eq("id",ctx.user.id);
 button.disabled=false; $("#profile-message").textContent=error?error.message:"Profile saved to your account.";
 $("#profile-message").style.color=error?"#ff8189":"#78d99c";
 if(!error) $("#profile-display-name").textContent=row.full_name;
});
async function load(){
 const {data,error}=await supabase.from("profiles").select("full_name,age,weight_kg,height_cm,fitness_goal").eq("id",ctx.user.id).single();
 if(error){$("#profile-message").textContent=error.message;return;}
 const p=data||{}; $("#profile-name").value=p.full_name||ctx.profile.username||"";
 $("#profile-age").value=p.age||""; $("#profile-weight").value=p.weight_kg||""; $("#profile-height").value=p.height_cm||"";
 $("#profile-goal").value=p.fitness_goal||"Stay Fit"; $("#profile-display-name").textContent=p.full_name||ctx.profile.username||"Your Name";
}
load();
