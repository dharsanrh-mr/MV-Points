const KEY="rummyScoreAppV1";
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{members:[],games:[],settings:{theme:"dark",scoreMode:"high"}};
state.settings=state.settings||{theme:"dark"}; state.settings.scoreMode=state.settings.scoreMode||"high";
let currentType="Rummy";

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
function page(name){$$(".page").forEach(x=>x.classList.toggle("active",x.id===name));$$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.page===name)); if(name==="dashboard")renderDashboard(); if(name==="members")renderMembers(); if(name==="games")renderGames(); if(name==="history")renderHistory(); if(name==="settings")renderSettings(); window.scrollTo({top:0,behavior:"smooth"})}
$$("[data-page]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.page)));

function formatDate(iso){return new Date(iso).toLocaleString(undefined,{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
function dateOnly(iso){return iso.slice(0,10)}
function initials(name){return name.trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}

function renderDashboard(){
 $("#statGames").textContent=state.games.length; $("#statMembers").textContent=state.members.length;
 const wins=state.games.reduce((n,g)=>n+(g.results||[]).filter(r=>r.rank===1).length,0); $("#statWins").textContent=wins;
 const today=new Date().toISOString().slice(0,10); $("#statToday").textContent=state.games.filter(g=>dateOnly(g.date)===today).length;

 const latest=[...state.games].sort((a,b)=>b.date.localeCompare(a.date))[0];
 if(latest){
   const sorted=[...(latest.results||[])].sort((a,b)=>a.rank-b.rank), winner=sorted[0], losers=sorted.slice(1);
   $("#currentResult").innerHTML=`<div class="current-result-head"><div><span class="eyebrow">CURRENT WINNER</span><h3>🏆 ${esc(winner?.name||"—")}</h3><div class="muted">${latest.type} • ${formatDate(latest.date)} • Score ${winner?.score??0}</div></div><div class="winner-badge">🏆 WINNER</div></div>
   <div class="loser-title">🃏 LOSERS</div>
   <div class="loser-list">${losers.length?losers.map(r=>`<div class="loser-chip"><span>🃏 ${esc(r.name)}</span><b>${r.score}</b></div>`).join(""):`<div class="muted">No losers</div>`}</div>`;
 }else{
   $("#currentResult").innerHTML=`<div class="current-empty"><span class="eyebrow">CURRENT RESULT</span><h3>🏆 No game yet</h3><p>Save a game to show the current winner and losers here.</p></div>`;
 }

 const stats=state.members.map(m=>{let rs=state.games.flatMap(g=>g.results||[]).filter(r=>r.memberId===m.id);return {...m,wins:rs.filter(r=>r.rank===1).length,plays:rs.length,total:rs.reduce((a,r)=>a+Number(r.score||0),0)}}).sort((a,b)=>b.wins-a.wins||b.total-a.total).slice(0,5);
 $("#winnerList").innerHTML=stats.length?stats.map((m,i)=>`<div class="list-item"><div class="list-main"><div class="avatar">${initials(m.name)}</div><div><b>${esc(m.name)}</b><div class="muted">${m.plays} games • ${m.wins} wins</div></div></div><span class="winner score">${i===0?"🏆 ":""}${m.wins}</span></div>`).join(""):`<div class="empty">Add members and record your first game.</div>`;
 const recent=[...state.games].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
 $("#recentGames").innerHTML=recent.length?recent.map(gameCard):`<div class="empty">No games recorded yet.</div>`;
}
function gameCard(g){
 const sorted=[...(g.results||[])].sort((a,b)=>a.rank-b.rank), win=sorted[0];
 return `<div class="list-item" data-game="${g.id}"><div class="list-main"><div class="avatar">${g.type==="Rummy"?"♠":"7"}</div><div><b>${g.type}</b><div class="muted">${formatDate(g.date)} • ${g.results.length} players</div><div class="details">Winner: ${esc(win?.name||"—")}</div></div></div><span class="score">${win?.score??0}</span></div>`;
}
$$(".list").forEach(x=>x.addEventListener("click",e=>{const el=e.target.closest("[data-game]");if(el)showGame(el.dataset.game)}));

function renderGames(){
 $("#playerPicker").innerHTML=state.members.length?state.members.map(m=>`<label class="player-check"><input type="checkbox" value="${m.id}"> ${esc(m.name)}</label>`).join(""):`<div class="empty">No members yet. Add one first.</div>`;
 $("#scoreInputs").innerHTML="";
}
$$("[data-game-type]").forEach(b=>b.addEventListener("click",()=>{$$("[data-game-type]").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentType=b.dataset.gameType;updateScoreInputs()}));
$("#playerPicker").addEventListener("change",updateScoreInputs);
function updateScoreInputs(){
 const ids=$$("#playerPicker input:checked").map(x=>x.value);
 $("#scoreInputs").innerHTML=ids.map(mid=>{const m=state.members.find(x=>x.id===mid);return `<div class="score-row"><b>${esc(m.name)}</b><input class="player-score" data-id="${mid}" type="number" step="1" placeholder="Score"></div>`}).join("");
}
$("#addPlayerFromGame").onclick=()=>openMemberModal();

$("#saveGame").onclick=()=>{
 const inputs=$$(".player-score"), ids=inputs.map(i=>i.dataset.id);
 if(ids.length<2)return toast("Select at least 2 players");
 if(inputs.some(i=>i.value===""))return toast("Enter every player's score");
 const results=inputs.map(i=>{const m=state.members.find(x=>x.id===i.dataset.id);return {memberId:m.id,name:m.name,score:Number(i.value)}}).sort((a,b)=>state.settings.scoreMode==="low"?a.score-b.score:b.score-a.score);
 results.forEach((r,i)=>r.rank=i+1);
 state.games.push({id:id(),type:currentType,date:new Date().toISOString(),results});
 save(); toast("Game saved successfully"); page("dashboard");
};

function renderMembers(){
 const data=state.members.map(m=>{let rs=state.games.flatMap(g=>g.results||[]).filter(r=>r.memberId===m.id);return {...m,plays:rs.length,wins:rs.filter(r=>r.rank===1).length,losses:rs.filter(r=>r.rank>1).length,total:rs.reduce((a,r)=>a+Number(r.score||0),0)}})
 $("#memberList").innerHTML=data.length?data.map(m=>`<div class="member-card"><div class="member-top"><div class="list-main"><div class="avatar">${initials(m.name)}</div><div><h3>${esc(m.name)}</h3><span class="muted">Member</span></div></div><div class="member-actions"><button class="icon-btn edit-member" data-id="${m.id}" title="Edit">✎</button><button class="icon-btn delete-member" data-id="${m.id}" title="Delete">×</button></div></div><div class="member-stats"><div><b>${m.plays}</b><small>Games</small></div><div><b>${m.wins}</b><small>Wins</small></div><div><b>${m.total}</b><small>Score</small></div></div></div>`).join(""):`<div class="empty">No members. Add your players.</div>`;
 $$(".edit-member").forEach(b=>b.onclick=()=>openEditMemberModal(b.dataset.id));
 $$(".delete-member").forEach(b=>b.onclick=()=>{if(confirm("Delete this member? Existing game history will remain.")){state.members=state.members.filter(m=>m.id!==b.dataset.id);save();renderMembers();renderDashboard();toast("Member deleted");}});
}
$("#addMemberBtn").onclick=()=>openMemberModal();
function openMemberModal(){
 $("#modalContent").innerHTML=`<h2>Add Member</h2><p class="muted">Create a player profile for score tracking.</p><input id="memberName" placeholder="Member name" maxlength="40" autofocus><button class="primary-btn" id="confirmMember">Add Member</button>`;
 $("#modal").classList.remove("hidden"); setTimeout(()=>$("#memberName")?.focus(),50);
 $("#confirmMember").onclick=()=>{const name=$("#memberName").value.trim();if(!name)return toast("Enter a name");if(state.members.some(m=>m.name.toLowerCase()===name.toLowerCase()))return toast("Member already exists");state.members.push({id:id(),name});save();closeModal();toast("Member added");renderMembers();};
}
function openEditMemberModal(memberId){
 const m=state.members.find(x=>x.id===memberId); if(!m)return;
 $("#modalContent").innerHTML=`<h2>Edit Member</h2><p class="muted">Change this player's name. Existing scores stay linked to the member.</p><input id="editMemberName" value="${esc(m.name)}" maxlength="40"><button class="primary-btn" id="confirmEditMember">Save Changes</button>`;
 $("#modal").classList.remove("hidden");
 setTimeout(()=>$("#editMemberName")?.focus(),50);
 $("#confirmEditMember").onclick=()=>{
   const name=$("#editMemberName").value.trim();
   if(!name)return toast("Enter a name");
   if(state.members.some(x=>x.id!==memberId && x.name.toLowerCase()===name.toLowerCase()))return toast("Member already exists");
   m.name=name;
   state.games.forEach(g=>(g.results||[]).forEach(r=>{if(r.memberId===memberId)r.name=name;}));
   save(); closeModal(); renderMembers(); renderDashboard(); renderHistory(); toast("Member updated");
 };
}
function showGame(gid){
 const g=state.games.find(x=>x.id===gid);if(!g)return; const sorted=[...g.results].sort((a,b)=>a.rank-b.rank);
 $("#modalContent").innerHTML=`<div class="game-modal-head"><div><span class="eyebrow">GAME RESULT</span><h2>${g.type}</h2><p class="muted">${formatDate(g.date)}</p></div><span class="game-badge">MV</span></div><div class="breakdown">${sorted.map(r=>`<div><span>${r.rank===1?"🏆":"🃏"} ${esc(r.name)}</span><b class="${r.rank===1?"winner":"loser"}">${r.score}</b></div>`).join("")}</div><div class="share-actions"><button class="share-btn" id="shareGame">↗ Share</button><button class="pdf-btn" id="pdfGame">▣ Share PDF</button></div><button class="danger-btn" style="width:100%;margin-top:12px" id="deleteGame">Delete game</button>`;
 $("#modal").classList.remove("hidden");
 $("#shareGame").onclick=()=>shareGame(g);
 $("#pdfGame").onclick=()=>shareGamePdf(g);
 $("#deleteGame").onclick=()=>{if(confirm("Delete this game record?")){state.games=state.games.filter(x=>x.id!==gid);save();closeModal();renderHistory();renderDashboard();toast("Game deleted")}};
}

function shareGame(g){
 const sorted=[...g.results].sort((a,b)=>a.rank-b.rank);
 const lines=[`MV Points • ${g.type}`,formatDate(g.date),"",...sorted.map(r=>`${r.rank}. ${r.name} — ${r.score}`)];
 if(navigator.share){navigator.share({title:`MV Points - ${g.type}`,text:lines.join("\n")}).catch(()=>{});}else{navigator.clipboard?.writeText(lines.join("\n"));toast("Score copied to clipboard");}
}

async function shareGamePdf(g){
 if(!window.jspdf?.jsPDF)return toast("PDF library not loaded");
 const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:"mm",format:"a4"});
 const sorted=[...g.results].sort((a,b)=>a.rank-b.rank);
 doc.setFillColor(6,8,13);doc.rect(0,0,210,297,"F");
 doc.setFillColor(105,18,29);doc.roundedRect(16,16,178,265,8,8,"F");
 doc.setDrawColor(230,183,65);doc.setLineWidth(0.8);doc.roundedRect(16,16,178,265,8,8,"S");
 doc.setTextColor(244,196,78);doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("GAME SCORE MANAGER",28,34);
 doc.setTextColor(255,248,224);doc.setFontSize(29);doc.text("MV Points",28,49);
 doc.setTextColor(255,255,255);doc.setFontSize(20);doc.text(g.type,28,70);
 doc.setTextColor(190,190,200);doc.setFontSize(10);doc.text(formatDate(g.date),28,78);
 doc.setFillColor(8,11,17);doc.roundedRect(27,89,156,15,4,4,"F");
 doc.setTextColor(244,196,78);doc.setFontSize(9);doc.text("FINAL SCOREBOARD",35,99);
 let y=116; sorted.forEach((r,i)=>{
   doc.setFillColor(i===0?45:15,i===0?34:17,i===0?10:23);doc.roundedRect(27,y-8,156,18,4,4,"F");
   doc.setTextColor(245,245,245);doc.setFontSize(12);doc.text(`${i+1}. ${r.name}`,35,y+3);
   doc.setTextColor(i===0?244:255,i===0?196:120,i===0?78:135);doc.setFontSize(14);doc.text(String(r.score),171,y+3,{align:"right"}); y+=24;
 });
 doc.setTextColor(170,170,180);doc.setFontSize(9);doc.text("PLAY • SCORE • WIN",105,258,{align:"center"});
 const blob=doc.output("blob"); const file=new File([blob],`MV-Points-${g.type.replace(/\s+/g,"-")}-${dateOnly(g.date)}.pdf`,{type:"application/pdf"});
 if(navigator.canShare?.({files:[file]})){try{await navigator.share({title:`MV Points - ${g.type}`,text:"Game score from MV Points",files:[file]});return}catch(e){if(e.name==="AbortError")return;}}
 const url=URL.createObjectURL(blob); const a=document.createElement("a");a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast("PDF created");
}
function closeModal(){$("#modal").classList.add("hidden")}
$("#modalClose").onclick=closeModal;$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

function renderHistory(){
 const sel=$("#historyMember"); const old=sel.value; sel.innerHTML=`<option value="all">All members</option>`+state.members.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join(""); if(state.members.some(m=>m.id===old))sel.value=old;
 const date=$("#historyDate").value,type=$("#historyType").value,member=sel.value;
 let gs=[...state.games].sort((a,b)=>b.date.localeCompare(a.date));
 gs=gs.filter(g=>(!date||dateOnly(g.date)===date)&&(type==="all"||g.type===type)&&(!member||(g.results||[]).some(r=>r.memberId===member)));
 $("#historyList").innerHTML=gs.length?gs.map(gameCard).join(""):`<div class="empty">No matching games.</div>`;
}
$("#historyDate").onchange=renderHistory;$("#historyType").onchange=renderHistory;$("#historyMember").onchange=renderHistory;

function renderSettings(){$("#themeToggle").textContent=state.settings.theme==="dark"?"Dark":"Light";document.documentElement.dataset.theme=state.settings.theme; if($("#scoreMode"))$("#scoreMode").value=state.settings.scoreMode==="low"?"low":"high"}
$("#themeToggle").onclick=()=>{state.settings.theme=state.settings.theme==="dark"?"light":"dark";save();renderSettings()};
document.addEventListener("change",e=>{if(e.target.id==="scoreMode"){state.settings.scoreMode=e.target.value;save();toast(e.target.value==="low"?"Low score wins":"High score wins");}});
$("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`rummy-score-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup exported")};
$("#importInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x.members)||!Array.isArray(x.games))throw Error();state=x;state.settings=state.settings||{theme:"dark"};save();location.reload()}catch{toast("Invalid backup file")}};r.readAsText(f)};
$("#clearBtn").onclick=()=>{if(confirm("Clear ALL members and game history? This cannot be undone.")){state={members:[],games:[],settings:{theme:"dark"}};save();location.reload()}};
$("#menuFab").onclick=()=>{const pages=["dashboard","games","members","history","settings"],cur=$(".page.active")?.id, next=pages[(pages.indexOf(cur)+1)%pages.length];page(next)};
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
document.addEventListener("DOMContentLoaded",()=>{renderDashboard();renderSettings()});
