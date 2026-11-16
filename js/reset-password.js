import {supabase} from "../lib/supabase.js";
import {msg} from "./common.js";
const form=document.querySelector("#resetForm"),box=document.querySelector("#message");
const {data:{session}}=await supabase.auth.getSession();
if(!session){msg(box,"Open the password reset link from your email to continue.");form.querySelector("button").disabled=true;}
form.addEventListener("submit",async e=>{e.preventDefault();const a=document.querySelector("#newPassword").value,b=document.querySelector("#confirmPassword").value;if(a!==b){msg(box,"The passwords do not match.");return;}if(a.length<8){msg(box,"Use at least 8 characters.");return;}const {error}=await supabase.auth.updateUser({password:a});if(error){msg(box,error.message);return;}msg(box,"Password updated. You can now sign in.",false);form.reset();});
