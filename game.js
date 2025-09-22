// ====== ELEMENTOS ======
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const petalCountEl = document.getElementById('petalCount');
const stageLabel = document.getElementById('stageLabel');
const messageBox = document.getElementById('message');
const finalMessageBox = document.getElementById('finalMessage');

// Menu / Seleção
const menu = document.getElementById('menu');
const btnPlay = document.getElementById('btnPlay');
const btnAbout = document.getElementById('btnAbout');
const aboutModal = document.getElementById('aboutModal');
const closeAbout = document.getElementById('closeAbout');
const charSelect = document.getElementById('charSelect');
const gameWrap = document.getElementById('gameWrap');

// Sons
const sndMenu = document.getElementById('sndMenu');
const sndJump = document.getElementById('sndJump');
const sndDash = document.getElementById('sndDash');
const sndCollect = document.getElementById('sndCollect');
const sndExplosion = document.getElementById('sndExplosion');

// ====== ESTADO ======
const keys = {};
window.addEventListener('keydown', e => keys[e.code]=true);
window.addEventListener('keyup', e => keys[e.code]=false);

let W = canvas.width, H = canvas.height;
let gameState = "menu";

// ====== PERSONAGEM ======
const characters = {
  cloe: { color:"#FFD93D", name:"Cloe", gender:"F" }
};
let selectedChar = characters.cloe;

// ====== PLAYER ======
const player = {
  x:40,y:440,w:18,h:28,vx:0,vy:0,grounded:false,canDouble:true,canDash:true,facing:1,
  speed:0.3, grav:0.5, friction:0.9,
  state:"idle", animFrame:0, animTimer:0
};

// ====== PARTÍCULAS ======
const particles = [];
function spawnParticles(x,y, n=80, base="#FFD93D"){
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2;
    const s = 2 + Math.random()*3.5;
    particles.push({
      x,y, vx: Math.cos(a)*s, vy: Math.sin(a)*s - 1,
      life: 60+Math.random()*30, color: Math.random()<0.35 ? "#fff7b0" : base, r: 1.8+Math.random()*2.2
    });
  }
}
function updateParticles(){
  for(let p of particles){
    p.x += p.vx;
    p.vy += 0.06;
    p.y += p.vy;
    p.life--;
  }
  for(let i=particles.length-1;i>=0;i--) if(particles[i].life<=0) particles.splice(i,1);
}
function renderParticles(){
  for(let p of particles){
    ctx.globalAlpha = Math.max(0, p.life/100);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ====== NUVENS ======
const clouds = [];
for(let i=0;i<9;i++){
  clouds.push({ x: Math.random()*W, y: 40+Math.random()*220, speed: 0.25+Math.random()*0.55, scale: 0.7+Math.random()*1.4, alpha: 0.06+Math.random()*0.09 });
}
function renderCloud(cx, cy, s, a){
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha = a; ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0,0,36,0,Math.PI*2);
  ctx.arc(-30,6,26,0,Math.PI*2);
  ctx.arc(30,8,24,0,Math.PI*2);
  ctx.arc(10,-10,28,0,Math.PI*2);
  ctx.fill(); ctx.restore();
}

// ====== PLANTAS ======
function renderPlants(){
  ctx.fillStyle = "#17361f";
  for(let x=0; x<W; x+=50){
    const h = 7+((x*13)%6);
    ctx.fillRect(x, 500-h, 2, h);
    ctx.fillRect(x+6, 502-h*0.9, 2, h*0.9);
    ctx.fillRect(x+12, 503-h*1.1, 2, h*1.1);
  }
  for(let x=20; x<W; x+=140){
    ctx.fillStyle = "#1e5a2d";
    ctx.beginPath(); ctx.ellipse(x, 498, 20, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#2a7a3d";
    ctx.beginPath(); ctx.ellipse(x+12, 501, 26, 12, 0, 0, Math.PI*2); ctx.fill();
  }
}

// ====== MENSAGENS ======
const petalMessages = [
  "Você é importante. Sua existência faz diferença.",
  "Mesmo nos dias nublados, você continua sendo luz.",
  "Falar é um ato de coragem. Ouvir é um gesto de amor.",
  "Você não está sozinho. Tem gente que se importa com você.",
  "A vida pode ser difícil, mas ela também pode surpreender com beleza.",
  "Respira. Um passo de cada vez. Você está indo bem.",
  "Seu valor não depende do que você sente hoje. Você é precioso.",
  "Tudo bem não estar bem. Mas não precisa enfrentar isso sozinho.",
  "A dor pode parecer eterna, mas ela também pode passar. Há esperança.",
  "Falar salva vidas. Ouvir também."
];
let petalIndex = 0;

// ====== FASES ======
let petalsCollected = 0;
const stages = [
  {
    platforms: [
      {x:0,y:500,w:900,h:40},
      {x:160,y:430,w:120,h:18},
      {x:320,y:380,w:120,h:18},
      {x:500,y:330,w:120,h:18},
      {x:690,y:290,w:120,h:18}
    ],
    petals: [
      {x:190,y:402,r:8,text:"Você importa."},
      {x:350,y:352,r:8,text:"Falar é coragem."},
      {x:530,y:304,r:8,text:"Seu passo é valioso."}
    ],
    door: {x:840,y:248,w:28,h:48, t:0}
  },
  {
    platforms: [
      {x:0,y:500,w:900,h:40},
      {x:120,y:420,w:140,h:18},
      {x:320,y:360,w:110,h:18},
      {x:470,y:300,w:110,h:18},
      {x:590,y:350,w:110,h:18},
      {x:740,y:310,w:110,h:18}
    ],
    petals: [
      {x:150,y:392,r:8,text:"Você não está só."},
      {x:350,y:332,r:8,text:"Pedir ajuda é força."},
      {x:500,y:272,r:8,text:"Seu sentir merece cuidado."},
      {x:770,y:282,r:8,text:"Há caminhos possíveis."}
    ],
    door: {x:850,y:270,w:28,h:48, t:0}
  },
  {
    platforms: [
      {x:0,y:500,w:900,h:40},
      {x:180,y:440,w:120,h:18},
      {x:340,y:380,w:120,h:18},
      {x:520,y:330,w:120,h:18},
      {x:700,y:330,w:120,h:18}
    ],
    petals: [
      {x:370,y:350,r:8,text:"Sua presença ilumina."},
      {x:540,y:300,r:8,text:"Você é valioso(a)."}
    ],
    goal: {x:790,y:290,r:28}
  }
];
let stage = 0;

// ====== UI ======
btnPlay.addEventListener('click', ()=>{ 
  gameState = "char"; 
  menu.style.display = "none";
  charSelect.style.display = "block";
});
btnAbout.addEventListener('click', ()=> aboutModal.setAttribute('aria-hidden','false'));
closeAbout.addEventListener('click', ()=> aboutModal.setAttribute('aria-hidden','true'));
aboutModal.addEventListener('click', (e)=>{ if(e.target===aboutModal) aboutModal.setAttribute('aria-hidden','true'); });

document.querySelectorAll('.char-card').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const charName = btn.getAttribute('data-char');
    startGame(charName);
  });
});

// Música do menu
if(sndMenu) { sndMenu.volume = 0.6; sndMenu.play().catch(()=>{}); }

// ====== INICIAR JOGO ======
function startGame(charName){
  selectedChar = characters[charName] || characters.cloe;
  stage = 0; petalsCollected = 0; petalIndex = 0; updateHUD(); resetPlayer();
  charSelect.style.display="none"; gameWrap.style.display="flex"; gameState="playing";
  if(sndMenu) try{ sndMenu.pause(); sndMenu.currentTime = 0; }catch{}
  loop(0);
}
window.startGame = startGame;

// ====== LOOP ======
let last=0, rafId=null;
function loop(ts){
  const dt=Math.min(32,ts-last)/16.666; last=ts;
  update(dt); render();
  if(gameState!=="end") rafId = requestAnimationFrame(loop);
}

// ====== CONTROLES E FÍSICA ======
function resetPlayer(){
  player.x=40; player.y=440; player.vx=0; player.vy=0;
  player.grounded=false; player.canDouble=true; player.canDash=true; player.facing=1;
  player.state="idle"; player.animFrame=0; player.animTimer=0;
}

function update(dt){
  if(gameState!=="playing") return;

  // movimentos básicos
  if(keys["ArrowLeft"]||keys["KeyA"]){ player.vx-=player.speed; player.facing=-1; }
  if(keys["ArrowRight"]||keys["KeyD"]){ player.vx+=player.speed; player.facing=1; }

  player.vy+=player.grav;
  player.x+=player.vx; player.y+=player.vy;
  player.vx*=player.friction;

  // colisões plataformas
  const plats = stages[stage].platforms;
  player.grounded=false;
  for(let p of plats){
    if(player.x < p.x+p.w && player.x+player.w > p.x && player.y+player.h > p.y && player.y+player.h < p.y+p.h){
      player.y=p.y-player.h; player.vy=0; player.grounded=true; player.canDash=true;
    }
  }

  // pulo
  if((keys["Space"]||keys["KeyZ"]) && player.grounded){
    player.vy=-10; player.canDouble=true;
    if(sndJump) try{ sndJump.currentTime=0; sndJump.play(); }catch{}
  } else if((keys["Space"]||keys["KeyZ"]) && player.canDouble){
    player.vy=-9; player.canDouble=false;
    if(sndJump) try{ sndJump.currentTime=0; sndJump.play(); }catch{}
  }

  // dash
  if((keys["KeyX"] || keys["ShiftLeft"] || keys["ShiftRight"]) && player.canDash){
    player.vx=player.facing*14; player.vy=0; player.canDash=false;
    if(sndDash) try{ sndDash.currentTime=0; sndDash.play(); }catch{}
  }

  updatePlayerState();
  player.animTimer++;
  if(player.animTimer > 7){
    player.animFrame=(player.animFrame+1)%4;
    player.animTimer=0;
  }

  // coletar pétalas
  for(let petal of stages[stage].petals){
    if(!petal.collected){
      const dx=(player.x+player.w/2)-petal.x, dy=(player.y+player.h/2)-petal.y;
      if(Math.hypot(dx,dy)<20){
        petal.collected=true;
        petalsCollected++; updateHUD();
        const msg = petal.text ? petal.text : petalMessages[petalIndex % petalMessages.length];
        petalIndex++;
        showMessage(msg);
        if(sndCollect) try{ sndCollect.currentTime=0; sndCollect.play(); }catch{}
        spawnParticles(petal.x, petal.y, 18, "#FFD93D");
      }
    }
  }

  // portas
  if(stages[stage].door){
    const d = stages[stage].door;
    d.t += 0.03;
    if(aabb(player.x,player.y,player.w,player.h, d.x,d.y,d.w,d.h)){
      stage++;
      if(stage >= stages.length){ stage = stages.length-1; }
      updateHUD(); resetPlayer();
      showMessage(`Fase ${stage+1}/3`);
    }
  }

  // objetivo final
  if(stages[stage].goal){
    let g=stages[stage].goal;
    const dx=(player.x+player.w/2)-g.x, dy=(player.y+player.h/2)-g.y;
    if(Math.hypot(dx,dy)<g.r+8){
      spawnParticles(g.x, g.y, 140, "#FFD93D");
      if(sndExplosion) try{ sndExplosion.currentTime=0; sndExplosion.play(); }catch{}
      gameState="end";
      endGameMessage();
      setTimeout(()=>{
        gameWrap.style.display="none"; menu.style.display="block"; gameState="menu";
        finalMessageBox.style.display="none";
        try{ sndMenu.currentTime=0; sndMenu.play(); }catch{}
      }, 13000);
    }
  }

  if(player.x<0) player.x=0;
  if(player.x+player.w>W) player.x=W-player.w;
  if(player.y>H) resetPlayer();
}

function aabb(ax,ay,aw,ah, bx,by,bw,bh){
  return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
}

// ====== ANIMAÇÃO ======
function updatePlayerState(){
  if(!player.grounded) player.state="jump";
  else if(Math.abs(player.vx)>0.6) player.state="run";
  else player.state="idle";
}

// ====== DESENHO DO PERSONAGEM ======
function drawCharacter(x, y){
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = selectedChar.color;
  ctx.fillRect(0, 0, player.w, player.h);

  ctx.restore();
}

// ====== RENDER ======
function render(){
  ctx.fillStyle="#0b1220"; ctx.fillRect(0,0,W,H);
  for(let c of clouds){
    renderCloud(c.x, c.y, c.scale, c.alpha);
    c.x += c.speed;
    if(c.x > W+100) { c.x = -120; c.y = 40+Math.random()*220; }
  }

  for(let p of stages[stage].platforms) {
    ctx.fillStyle="#1f2937"; ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.fillStyle="#273142"; ctx.fillRect(p.x,p.y,p.w,4);
  }

  renderPlants();

  for(let petal of stages[stage].petals) if(!petal.collected){
    ctx.fillStyle="#FFD93D";
    ctx.beginPath(); ctx.arc(petal.x, petal.y, 6, 0, Math.PI*2); ctx.fill();
  }

  if(stages[stage].door){
    const d = stages[stage].door;
    ctx.fillStyle="#2b3b55";
    ctx.fillRect(d.x,d.y,d.w,d.h);
  }

  if(stages[stage].goal){
    const g = stages[stage].goal;
    ctx.fillStyle="#FFD93D";
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI*2); ctx.fill();
  }

  drawCharacter(player.x, player.y);

  updateParticles();
  renderParticles();
}

// ====== HUD ======
function updateHUD(){
  petalCountEl.textContent = petalsCollected;
  stageLabel.textContent = `${stage+1}/3`;
}
function showMessage(text, duration=2200){
  messageBox.style.display="block"; messageBox.textContent=text;
  setTimeout(()=>{ messageBox.style.display="none"; }, duration);
}

// ====== MENSAGEM FINAL ======
function endGameMessage() {
  finalMessageBox.innerHTML = `
    <h2>Você não está sozinho</h2>
    <p>
    Talvez hoje o mundo esteja pesado demais. Talvez o silêncio grite mais alto que as palavras. 
    Mas por favor, não se esqueça: você é feito de histórias que ainda não foram contadas, 
    de afetos que ainda vão te encontrar, de dias que ainda vão te surpreender.
    </p>
    <p>
    A dor não define quem você é. Ela é só uma página — não o livro inteiro. 
    Falar sobre o que sente não é fraqueza, é coragem. 
    E pedir ajuda é um ato de amor próprio.
    </p>
    <p>
    Você merece estar aqui. Você merece ser cuidado. Você merece viver. 
    E mesmo que você não enxergue isso agora, há pessoas que enxergam por você.
    </p>
  `;
  finalMessageBox.style.display = "block";
}
