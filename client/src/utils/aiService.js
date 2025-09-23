// client/src/utils/aiService.js
function cleanMarkdown(t){return t.replace(/```[\s\S]*?```/g,'').replace(/^#+\s*/gm,'').replace(/\*\*(.*?)\*\*/g,'$1').replace(/__(.*?)__/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/_(.*?)_/g,'$1').replace(/^>\s?/gm,'').replace(/[-*_]{3,}/g,'').replace(/^\|.*\|$/gm,'').replace(/\n{2,}/g,'\n').trim();}
function renderPrompt(messages){const sys=messages.find(m=>m.role==='system')?.content||'';const rest=messages.filter(m=>m.role!=='system');let out=sys?`System: ${sys}\n\n`:'';for(const m of rest) out+=`${m.role==='assistant'?'Assistant':'User'}: ${m.content}\n`;out+='Assistant:';return out;}
export async function sendToAI(prompt, logs=[]) {
  const messages=[{role:'system',content:'You are an expert Texas Holdem poker coach. Keep every response under 60 words and in 1–3 sentences. Focus only on actionable strategy for the current poker scenario.'}];
  for (const l of logs) messages.push({role:l.sender==='ai'?'assistant':'user',content:l.message});
  messages.push({role:'user',content:prompt});

  const model='mistralai/Mistral-7B-Instruct-v0.3'; // change if gated
  const promptText=renderPrompt(messages);

  const res=await fetch('/api/hf-proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    endpoint:`models/${model}`,                      // inference endpoint
    payload:{inputs:promptText,parameters:{max_new_tokens:256,temperature:0.7}}
  })});

  if(!res.ok){const err=await res.text().catch(()=> ''); throw new Error(`HF proxy error ${res.status}: ${err||res.statusText}`);}
  const txt=await res.text();
  try{const d=JSON.parse(txt);const out=Array.isArray(d)?d[0]?.generated_text:d?.generated_text;return cleanMarkdown(String(out||'').trim());}
  catch{return cleanMarkdown(txt.trim());}
}
