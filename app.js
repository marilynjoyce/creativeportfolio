const {territories, topics, works, filmIds} = window.portfolioData;
const $ = selector => document.querySelector(selector);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const smallScreen = matchMedia('(max-width: 600px)');
const territoryById = new Map(territories.map(t => [t.id, t]));
const workById = new Map(works.map(w => [w.id, w]));
const films = filmIds.map(id => workById.get(id));
const tagName = id => topics.find(t => t.id === id)?.name || works.flatMap(w => w.tags).find(t => t.id === id)?.name || id;
const image = work => work.img ? `assets/${work.img}.jpg` : null;
const mediumIcons = {films:'▸',commentary:'↗',music:'♪',gaming:'✳',projects:'⌘',writing:'≡'};
const sourceNames = {instagram:'Instagram',tiktok:'TikTok',substack:'Substack'};
const state = {territory:null, topic:null, medium:'all', search:'', limit:12};
let currentFilm = 2, resumeRoomAfterDialog = false;
const dialog = $('#film-dialog');
dialog.setAttribute('aria-labelledby', 'dialog-title');

function makeThumbnail(work, className='work-thumbnail') {
  let el;
  if (image(work)) {el=document.createElement('img');el.src=image(work);el.alt='';el.loading='lazy';}
  else {el=document.createElement('span');el.className='type-thumbnail';el.textContent=mediumIcons[work.medium]||'↗';el.setAttribute('aria-hidden','true');}
  el.classList.add(className);
  el.style.setProperty('--piece-color',territoryById.get(work.primary).color);
  return el;
}
function openWork(work) {
  if(work.source==='substack'){window.open(work.url,'_blank','noopener');return;}
  $('#dialog-title').textContent=work.title;
  $('#dialog-description').textContent=work.description||work.format||'';
  $('#dialog-tags').replaceChildren(...work.tags.map(tag=>{
    const button=document.createElement('button');button.textContent=tag.name;
    button.onclick=()=>{dialog.close();selectTopic(tag.id);$('#atlas').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'});};
    return button;
  }));
  const player=document.createElement(work.video?'video':'iframe');
  $('#embed-slot').classList.toggle('tiktok-player',work.source==='tiktok');
  if(work.video){player.src=work.video;player.controls=true;player.autoplay=true;player.playsInline=true;player.preload='metadata';if(image(work))player.poster=image(work);player.setAttribute('aria-label',work.title);}
  else {player.src=work.source==='tiktok'?`https://www.tiktok.com/player/v1/${work.tiktokId}?autoplay=1`:`https://www.instagram.com/p/${work.id}/embed/`;player.title=work.title;player.allow='autoplay; encrypted-media; fullscreen';player.setAttribute('allowfullscreen','');}
  $('#embed-slot').replaceChildren(player);
  $('#original-link').href=work.url;
  $('#original-link').textContent=`open original on ${sourceNames[work.source]} ↗`;
  $('.embed-note').hidden=!!work.video;
  if(!dialog.open){const room=$('#room-video');resumeRoomAfterDialog=!room.paused;room.pause();dialog.showModal();document.body.style.overflow='hidden';}
}
$('#close-dialog').onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{
  $('#embed-slot').replaceChildren();document.body.style.overflow='';
  if(resumeRoomAfterDialog&&!reducedMotion.matches)$('#room-video').play().catch(()=>{});
});
dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const r=dialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
});

// Selected films remain a direct route into the four native video players.
films.forEach((film,i)=>{
  const button=document.createElement('button');button.className='film-card';button.setAttribute('aria-label',`Watch ${film.title}`);
  const cover=document.createElement('div');cover.className='film-cover';cover.append(makeThumbnail(film,'film-poster'));
  const play=document.createElement('span');play.className='play';play.innerHTML='<span aria-hidden="true">▶</span>';
  const number=document.createElement('span');number.className='film-number mono';number.textContent=`0${i+1} / SHORT FILM`;cover.append(play,number);
  const caption=document.createElement('div');caption.className='film-caption';
  const details=document.createElement('div'),title=document.createElement('h3'),tags=document.createElement('p'),arrow=document.createElement('span');
  title.textContent=film.title;tags.className='mono';tags.textContent=film.tags.slice(0,3).map(t=>t.name).join(' / ');arrow.textContent='↗';
  details.append(title,tags);caption.append(details,arrow);button.append(cover,caption);button.onclick=()=>openWork(film);$('#film-grid').append(button);
});

// Keep the room scene and its four TV channels.
function updateTVControl(){ $('#tv-motion').textContent=$('#room-video').paused?'play video':'pause video'; }
function setTV(index){
  currentFilm=index;const film=films[index],video=$('#room-video');
  $('#tv-poster').src=image(film);$('#tv-poster').alt=film.title+' on the TV';$('#tv-title').textContent=film.title.toLowerCase();$('#tv-open').setAttribute('aria-label','Watch '+film.title);
  document.querySelectorAll('.channel').forEach((button,i)=>{button.classList.toggle('active',i===index);button.setAttribute('aria-pressed',String(i===index));});
  video.src=film.video;video.poster=image(film);video.hidden=false;video.style.objectFit='contain';$('#tv-poster').hidden=true;$('.tv-play').hidden=true;$('#tv-motion').hidden=false;
  if(!reducedMotion.matches)video.play().catch(updateTVControl);else video.pause();updateTVControl();
}
films.forEach((film,i)=>{
  const button=document.createElement('button');button.className='channel';button.setAttribute('aria-label','Show '+film.title+' on the TV');
  const n=document.createElement('span'),title=document.createElement('span');n.className='mono';n.textContent='0'+(i+1);title.textContent=film.title;button.append(n,title);button.onclick=()=>setTV(i);$('#film-channels').append(button);
});
$('#tv-open').onclick=$('#tv-watch').onclick=()=>openWork(films[currentFilm]);
$('#tv-motion').onclick=()=>{const video=$('#room-video');if(video.paused)video.play().catch(updateTVControl);else video.pause();updateTVControl();};
$('#room-video').addEventListener('play',updateTVControl);$('#room-video').addEventListener('pause',updateTVControl);
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)$('#room-video').pause();});
setTV(2);

// Writing previews use the published subtitles, or opening excerpts when absent.
works.filter(w=>w.source==='substack').forEach(work=>{
  const link=document.createElement('a');link.className='article';link.href=work.url;link.target='_blank';link.rel='noopener';
  const date=document.createElement('p'),title=document.createElement('h3'),subtitle=document.createElement('p'),arrow=document.createElement('span');
  date.className='mono';date.textContent=work.date;title.textContent=work.title;subtitle.className='article-subtitle';subtitle.textContent=work.description;arrow.className='article-arrow';arrow.textContent='↗';link.append(date,title,subtitle,arrow);$('#article-list').append(link);
});

function filteredWorks(){
  const query=state.search.trim().toLowerCase();
  return works.filter(work=>(!state.territory||work.territories.includes(state.territory))&&(!state.topic||work.tags.some(t=>t.id===state.topic))&&(state.medium==='all'||work.medium===state.medium)&&(!query||[work.title,work.description,work.medium,...work.tags.map(t=>t.name)].join(' ').toLowerCase().includes(query)));
}
function chooseTerritory(id){state.territory=id;state.topic=null;state.limit=12;refresh();}
function selectTopic(id){state.topic=id;state.territory=null;state.limit=12;refresh();}
function clearAll(){state.territory=null;state.topic=null;state.medium='all';state.search='';state.limit=12;$('#work-search').value='';refresh();}
function renderCollection(items){
  const list=$('#work-list');list.replaceChildren();
  for(const work of items.slice(0,state.limit)){
    const row=document.createElement('article');row.className='work-row';row.style.setProperty('--piece-color',territoryById.get(work.primary).color);
    const main=document.createElement('button');main.className='work-main';main.setAttribute('aria-label',(work.source==='substack'?'Read ':'Watch ')+work.title);main.onclick=()=>openWork(work);main.append(makeThumbnail(work));
    const details=document.createElement('span');details.className='work-body';const title=document.createElement('span');title.className='work-title';title.textContent=work.title;
    const tags=document.createElement('span');tags.className='work-tags';tags.textContent=work.tags.map(t=>t.name).join(' · ');details.append(title,tags);main.append(details);
    const meta=document.createElement('span');meta.className='work-medium mono';meta.textContent=work.medium==='films'?'film':work.medium;
    const source=document.createElement('a');source.className='work-source';source.href=work.url;source.target='_blank';source.rel='noopener';source.textContent=sourceNames[work.source]+' ↗';source.setAttribute('aria-label',work.title+' on '+sourceNames[work.source]);
    row.append(main,meta,source);list.append(row);
  }
  if(!items.length){const empty=document.createElement('div');empty.className='empty-work';empty.textContent='nothing here with those filters. try another combination.';list.append(empty);}
  $('#show-more').hidden=items.length<=state.limit;$('#show-more').textContent=`show more (${items.length-state.limit} left) ↓`;
  const selection=state.topic?tagName(state.topic):state.territory?territoryById.get(state.territory).name:'all topics';
  $('#result-count').textContent=`${items.length} ${items.length===1?'piece':'pieces'} / ${selection}`;
  $('#clear-filters').hidden=!state.topic&&!state.territory&&state.medium==='all'&&!state.search;
}
$('#show-more').onclick=()=>{state.limit+=12;renderCollection(filteredWorks());};
$('#work-search').addEventListener('input',event=>{state.search=event.target.value;state.limit=12;refresh();});
$('#clear-filters').onclick=clearAll;
for(const territory of territories){const option=document.createElement('option');option.value=territory.id;option.textContent=territory.name;$('#territory-filter').append(option);}
$('#territory-filter').onchange=event=>chooseTerritory(event.target.value==='all'?null:event.target.value);
for(const medium of ['all','films','commentary','music','gaming','projects','writing']){
  const button=document.createElement('button');button.dataset.medium=medium;button.textContent=medium==='all'?'all formats':medium;button.onclick=()=>{state.medium=medium;state.limit=12;refresh();};$('#medium-filters').append(button);
}

// The graph connects topics through shared pieces, rather than a single category.
const nodeData=[...territories.map(t=>({...t,key:'territory:'+t.id,type:'territory'})),...topics.map(t=>({...t,key:'topic:'+t.id,type:'topic',color:territoryById.get(t.territory).color}))];
const nodeElements=new Map(),svg=$('#network-lines'),edges=[];
function svgLine(from,to,cross=false){const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.classList.add(cross?'cross-edge':'cluster-edge');svg.append(line);edges.push({from,to,line});}
for(const territory of territories){svgLine('center','territory:'+territory.id);for(const id of territory.topics)svgLine('territory:'+territory.id,'topic:'+id);}
const topicPairs=new Set();
for(const work of works){const present=topics.filter(topic=>work.tags.some(tag=>tag.id===topic.id));for(let i=0;i<present.length;i++)for(let j=i+1;j<present.length;j++){if(present[i].territory===present[j].territory)continue;const pair=[present[i].id,present[j].id].sort();const key=pair.join('|');if(!topicPairs.has(key)){topicPairs.add(key);svgLine('topic:'+pair[0],'topic:'+pair[1],true);}}}
for(const node of nodeData){
  const button=document.createElement('button');button.className='graph-node '+(node.type==='territory'?'territory-node':'topic-node');if(node.main)button.classList.add('main-territory');button.style.setProperty('--node-color',node.color);button.dataset.node=node.key;button.setAttribute('aria-pressed','false');
  const orb=document.createElement('span');orb.className='orb';orb.setAttribute('aria-hidden','true');const label=document.createElement('span');label.className='node-label';label.textContent=node.name;button.append(orb,label);
  button.onclick=()=>node.type==='territory'?chooseTerritory(node.id):selectTopic(node.id);
  button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')highlight(node.key);});button.addEventListener('pointerleave',()=>highlight());button.addEventListener('focus',()=>highlight(node.key));button.addEventListener('blur',()=>highlight());
  $('#network-nodes').append(button);nodeElements.set(node.key,button);
}
function positionNetwork(){
  const positions=new Map([['center',smallScreen.matches?[50,32]:[49,49]]]);
  nodeData.forEach(node=>{const position=smallScreen.matches?node.mobile:node.position;positions.set(node.key,position);const button=nodeElements.get(node.key);button.style.left=position[0]+'%';button.style.top=position[1]+'%';});
  const center=positions.get('center');$('#network-center').style.left=center[0]+'%';$('#network-center').style.top=center[1]+'%';
  edges.forEach(({from,to,line})=>{const a=positions.get(from),b=positions.get(to);line.setAttribute('x1',a[0]*10);line.setAttribute('y1',a[1]*6.4);line.setAttribute('x2',b[0]*10);line.setAttribute('y2',b[1]*6.4);});
}
function highlight(hoverKey){
  const key=hoverKey||(state.topic?'topic:'+state.topic:state.territory?'territory:'+state.territory:null);
  const selectedWorks=!key?[]:key.startsWith('topic:')?works.filter(w=>w.tags.some(t=>t.id===key.slice(6))):works.filter(w=>w.territories.includes(key.slice(10)));
  const related=new Set(['center']);if(key)related.add(key);
  selectedWorks.forEach(work=>{work.tags.forEach(tag=>related.add('topic:'+tag.id));work.territories.forEach(id=>related.add('territory:'+id));});
  $('#network').classList.toggle('is-highlighting',!!key);
  nodeElements.forEach((button,k)=>{button.classList.toggle('is-related',related.has(k));button.classList.toggle('is-selected',k===(state.topic?'topic:'+state.topic:state.territory?'territory:'+state.territory:null));button.setAttribute('aria-pressed',String(button.classList.contains('is-selected')));});
  edges.forEach(edge=>edge.line.classList.toggle('is-related',related.has(edge.from)&&related.has(edge.to)));
}
function renderTopicPanel(items){
  $('#map-title').textContent=state.topic?tagName(state.topic):state.territory?territoryById.get(state.territory).name:'start anywhere.';
  $('#map-description').textContent=state.topic?'a few things connected to this.':state.territory?territoryById.get(state.territory).description:'Pick a topic. A piece can belong to more than one place.';
  $('#map-count').textContent=`${items.length} ${items.length===1?'matching piece':'matching pieces'}`;
  const picks=state.topic||state.territory||state.medium!=='all'||state.search?items.slice(0,3):[films[0],films[3],workById.get('DdzcdIXJ4-0')];
  $('#map-picks').replaceChildren(...picks.map(work=>{const button=document.createElement('button');button.className='map-pick';button.append(makeThumbnail(work,'pick-thumbnail'));const text=document.createElement('span');text.textContent=work.title;const small=document.createElement('small');small.textContent=work.medium==='films'?'short film':work.medium;text.append(small);button.append(text);button.onclick=()=>openWork(work);return button;}));
}
function refresh(){
  const items=filteredWorks();renderCollection(items);renderTopicPanel(items);highlight();
  $('#surprise-me').disabled=!items.length;$('#territory-filter').value=state.territory||'all';document.querySelectorAll('[data-medium]').forEach(button=>{const active=button.dataset.medium===state.medium;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
}
$('#network-center').onclick=clearAll;$('#reset-map').onclick=()=>{state.topic=null;state.territory=null;state.limit=12;refresh();};
$('#surprise-me').onclick=()=>{const pool=filteredWorks();if(pool.length)openWork(pool[Math.floor(Math.random()*pool.length)]);};
smallScreen.addEventListener('change',positionNetwork);
positionNetwork();refresh();
