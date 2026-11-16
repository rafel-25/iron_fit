import {supabase} from "../lib/supabase.js";
const {data:{user}}=await supabase.auth.getUser();
if(user){
 const {data:p}=await supabase.from("profiles").select("age,weight_kg,height_cm").eq("id",user.id).single();
 if(p){
  const weight=document.querySelector("#weight"),height=document.querySelector("#height"),age=document.querySelector("#age"),calWeight=document.querySelector("#cal-weight"),calHeight=document.querySelector("#cal-height");
  if(weight&&p.weight_kg)weight.value=p.weight_kg;
  if(height&&p.height_cm)height.value=p.height_cm;
  if(age&&p.age)age.value=p.age;
  if(calWeight&&p.weight_kg)calWeight.value=p.weight_kg;
  if(calHeight&&p.height_cm)calHeight.value=p.height_cm;
  const note=document.querySelector("#profile-prefill-note");if(note)note.textContent="Your saved profile values have been loaded. You can edit them before calculating.";
 }
}
