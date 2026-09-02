const KEY="rummyScoreAppV1";
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{members:[],games:[],settings:{theme:"dark"}};
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
 const results=inputs.map(i=>{const m=state.members.find(x=>x.id===i.dataset.id);return {memberId:m.id,name:m.name,score:Number(i.value)}}).sort((a,b)=>b.score-a.score);
 results.forEach((r,i)=>r.rank=i+1);
 state.games.push({id:id(),type:currentType,date:new Date().toISOString(),results});
 save(); toast("Game saved successfully"); page("dashboard");
};

function renderMembers(){
 const data=state.members.map(m=>{let rs=state.games.flatMap(g=>g.results||[]).filter(r=>r.memberId===m.id);return {...m,plays:rs.length,wins:rs.filter(r=>r.rank===1).length,losses:rs.filter(r=>r.rank>1).length,total:rs.reduce((a,r)=>a+Number(r.score||0),0)}})
 $("#memberList").innerHTML=data.length?data.map(m=>`<div class="member-card"><div class="member-top"><div class="list-main"><div class="avatar">${initials(m.name)}</div><div><h3>${esc(m.name)}</h3><span class="muted">Member</span></div></div><button class="icon-btn delete-member" data-id="${m.id}" title="Delete">×</button></div><div class="member-stats"><div><b>${m.plays}</b><small>Games</small></div><div><b>${m.wins}</b><small>Wins</small></div><div><b>${m.total}</b><small>Score</small></div></div></div>`).join(""):`<div class="empty">No members. Add your players.</div>`;
 $$(".delete-member").forEach(b=>b.onclick=()=>{if(confirm("Delete this member? Existing game history will remain.")){state.members=state.members.filter(m=>m.id!==b.dataset.id);save();renderMembers();}});
}
$("#addMemberBtn").onclick=()=>openMemberModal();
function openMemberModal(){
 $("#modalContent").innerHTML=`<h2>Add Member</h2><p class="muted">Create a player profile for score tracking.</p><input id="memberName" placeholder="Member name" maxlength="40" autofocus><button class="primary-btn" id="confirmMember">Add Member</button>`;
 $("#modal").classList.remove("hidden"); setTimeout(()=>$("#memberName")?.focus(),50);
 $("#confirmMember").onclick=()=>{const name=$("#memberName").value.trim();if(!name)return toast("Enter a name");if(state.members.some(m=>m.name.toLowerCase()===name.toLowerCase()))return toast("Member already exists");state.members.push({id:id(),name});save();closeModal();toast("Member added");renderMembers();};
}
function showGame(gid){
 const g=state.games.find(x=>x.id===gid);if(!g)return; const sorted=[...g.results].sort((a,b)=>a.rank-b.rank);
 $("#modalContent").innerHTML=`<h2>${g.type}</h2><p class="muted">${formatDate(g.date)}</p><div class="breakdown">${sorted.map(r=>`<div><span>${r.rank===1?"🏆":r.rank===2?"🥈":r.rank===3?"🥉":"•"} ${esc(r.name)}</span><b class="${r.rank===1?"winner":"loser"}">${r.score}</b></div>`).join("")}</div><button class="danger-btn" style="width:100%;margin-top:16px" id="deleteGame">Delete game</button>`;
 $("#modal").classList.remove("hidden");$("#deleteGame").onclick=()=>{if(confirm("Delete this game record?")){state.games=state.games.filter(x=>x.id!==gid);save();closeModal();renderHistory();renderDashboard();toast("Game deleted")}};
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

function renderSettings(){$("#themeToggle").textContent=state.settings.theme==="dark"?"Dark":"Light";document.documentElement.dataset.theme=state.settings.theme}
$("#themeToggle").onclick=()=>{state.settings.theme=state.settings.theme==="dark"?"light":"dark";save();renderSettings()};
$("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`rummy-score-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup exported")};
$("#importInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x.members)||!Array.isArray(x.games))throw Error();state=x;state.settings=state.settings||{theme:"dark"};save();location.reload()}catch{toast("Invalid backup file")}};r.readAsText(f)};
$("#clearBtn").onclick=()=>{if(confirm("Clear ALL members and game history? This cannot be undone.")){state={members:[],games:[],settings:{theme:"dark"}};save();location.reload()}};
$("#menuFab").onclick=()=>{const pages=["dashboard","games","members","history","settings"],cur=$(".page.active")?.id, next=pages[(pages.indexOf(cur)+1)%pages.length];page(next)};
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
document.addEventListener("DOMContentLoaded",()=>{renderDashboard();renderSettings()});
