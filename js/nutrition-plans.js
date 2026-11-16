import {supabase} from "../lib/supabase.js";
const grid=document.querySelector("#nutritionPlanGrid");
const {data,error}=await supabase.from("nutrition_plans").select("id,title,goal,calories,protein_g,carbs_g,fat_g,description").order("created_at",{ascending:false});
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
if(error)grid.innerHTML='<p>Nutrition plans are temporarily unavailable.</p>';
else grid.innerHTML=(data||[]).map(p=>'<article class="nutrition-card"><div class="nutrition-icon">🥗</div><h3>'+esc(p.title)+'</h3><p>'+esc(p.description||p.goal)+'</p><ul><li>'+p.calories+' kcal / day</li><li>Protein '+p.protein_g+' g</li><li>Carbs '+p.carbs_g+' g</li><li>Fat '+p.fat_g+' g</li></ul></article>').join("")||'<p>No nutrition plans have been published yet.</p>';
