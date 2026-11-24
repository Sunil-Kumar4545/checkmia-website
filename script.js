document.getElementById('menu').addEventListener('click',()=>document.getElementById('links').classList.toggle('open'));
document.querySelectorAll('#links a').forEach(a=>a.addEventListener('click',()=>document.getElementById('links').classList.remove('open')));

(function(){
  const file=document.getElementById('shoeFile'),drop=document.querySelector('.drop'),dropText=document.getElementById('dropText'),
    msg=document.getElementById('uploadMsg'),grid=document.getElementById('previewGrid'),empty=document.getElementById('previewEmpty'),
    runBtn=document.getElementById('runBtn'),resetBtn=document.getElementById('resetBtn'),steps=[...document.querySelectorAll('#steps li')],
    report=document.getElementById('report');
  const ALLOWED=['image/jpeg','image/png','image/webp'],MAX=5*1024*1024,MAXN=6,
    VIEWS=['Front','Side','Heel','Outsole','Size tag','Box label'],
    EMPTY='<p>The report will appear here after you run the demo assessment.</p>',
    DROPTXT='Choose up to 6 shoe photos: front, side, heel, outsole, tag, box (JPG, PNG or WebP, 5 MB each)';
  let items=[],timers=[],runId=0;

  function clearSteps(){runId++;timers.forEach(clearTimeout);timers=[];steps.forEach(s=>s.className='');}
  function esc(t){return t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function render(){
    grid.querySelectorAll('.thumb').forEach(n=>n.remove());
    empty.hidden=items.length>0;
    items.forEach((it,i)=>{
      const d=document.createElement('div');d.className='thumb';
      const img=document.createElement('img');img.src=it.url;img.alt='Uploaded shoe photo '+(i+1)+': '+it.file.name;
      const sel=document.createElement('select');sel.setAttribute('aria-label','View for photo '+(i+1));
      VIEWS.forEach(v=>{const o=document.createElement('option');o.textContent=v;if(v===it.view)o.selected=true;sel.appendChild(o);});
      sel.addEventListener('change',()=>{it.view=sel.value;clearSteps();report.innerHTML=EMPTY;runBtn.disabled=false;});
      const rm=document.createElement('button');rm.type='button';rm.textContent='Remove';
      rm.addEventListener('click',()=>{URL.revokeObjectURL(it.url);items=items.filter(x=>x!==it);clearSteps();report.innerHTML=EMPTY;msg.textContent='';update();});
      d.append(img,sel,rm);grid.appendChild(d);
    });
    runBtn.disabled=items.length===0;
    dropText.textContent=items.length?items.length+' of '+MAXN+' photos selected (click to add more)':DROPTXT;
  }
  function update(){render();}
  function reset(){
    runId++;items.forEach(i=>URL.revokeObjectURL(i.url));items=[];file.value='';msg.textContent='';
    clearSteps();report.innerHTML=EMPTY;render();
  }
  function add(list){
    clearSteps();report.innerHTML=EMPTY;const errs=[];
    for(const f of list){
      if(items.length>=MAXN){errs.push('Only '+MAXN+' photos are allowed; extra files were ignored.');break;}
      if(!ALLOWED.includes(f.type)){errs.push(f.name+': unsupported type (use JPG, PNG or WebP).');continue;}
      if(f.size>MAX){errs.push(f.name+': larger than 5 MB.');continue;}
      if(items.some(i=>i.file.name===f.name&&i.file.size===f.size&&i.file.lastModified===f.lastModified)){errs.push(f.name+': already added.');continue;}
      const used=items.map(i=>i.view),view=VIEWS.find(v=>!used.includes(v))||VIEWS[0];
      items.push({file:f,url:URL.createObjectURL(f),view});
    }
    msg.textContent=errs.join(' ');render();
  }
  function analyze(it){
    return new Promise(res=>{
      const im=new Image();
      im.onload=()=>{
        try{
          const w=im.naturalWidth,h=im.naturalHeight,sc=Math.min(1,256/Math.max(w,h)),cw=Math.max(8,Math.round(w*sc)),ch=Math.max(8,Math.round(h*sc));
          const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const cx=cv.getContext('2d');cx.drawImage(im,0,0,cw,ch);
          const d=cx.getImageData(0,0,cw,ch).data,g=new Float32Array(cw*ch);let sum=0;
          for(let i=0;i<g.length;i++){g[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];sum+=g[i];}
          const mean=sum/g.length;let v=0;for(let i=0;i<g.length;i++)v+=(g[i]-mean)*(g[i]-mean);const std=Math.sqrt(v/g.length);
          let lsum=0,lsq=0,n=0;
          for(let y=1;y<ch-1;y++)for(let x=1;x<cw-1;x++){const i=y*cw+x,l=4*g[i]-g[i-1]-g[i+1]-g[i-cw]-g[i+cw];lsum+=l;lsq+=l*l;n++;}
          const lap=lsq/n-(lsum/n)*(lsum/n);
          it.stats={w,h,mean,std,lap};
        }catch(e){it.stats=null;}
        res();
      };
      im.onerror=()=>{it.stats=null;res();};
      im.src=it.url;
    });
  }
  function rate(st){
    if(!st)return{verdict:'bad',label:'Could not read',notes:['image could not be analysed']};
    const notes=[];let bad=false,warn=false;const m=Math.min(st.w,st.h);
    if(m<300){bad=true;notes.push('very low resolution');}else if(m<500){warn=true;notes.push('low resolution');}
    if(st.lap<40){bad=true;notes.push('blurry');}else if(st.lap<100){warn=true;notes.push('slightly soft');}else notes.push('sharp');
    if(st.mean<45){bad=true;notes.push('too dark');}else if(st.mean<60){warn=true;notes.push('dark');}
    else if(st.mean>235){bad=true;notes.push('too bright');}else if(st.mean>215){warn=true;notes.push('bright');}
    if(st.std<25&&!bad){warn=true;notes.push('low contrast');}
    return{verdict:bad?'bad':warn?'warn':'ok',label:bad?'Poor':warn?'Check':'Good',notes};
  }
  function showReport(list){
    const rated=list.map(it=>({it,r:rate(it.stats)})),usable=rated.filter(x=>x.r.verdict!=='bad').length,poor=rated.length-usable,
      have=[...new Set(list.map(i=>i.view))],miss=VIEWS.filter(v=>!have.includes(v)),ok=usable>=3;
    const rows=rated.map(x=>'<li><span class="v '+x.r.verdict+'">'+x.r.label+'</span>'+esc(x.it.view)+(x.it.stats?' · '+x.it.stats.w+'×'+x.it.stats.h:'')+' · '+x.r.notes.join(', ')+'</li>').join('');
    report.innerHTML='<p><span class="tag">'+(ok?'Needs review (quality OK)':'Unable to assess')+'</span></p>'+
      '<p>'+(ok?'Photo quality is good enough to analyse. Authenticity is <strong>not</strong> decided, because this demo has no trained model.':'Fewer than 3 usable photos. The system abstains instead of guessing.')+'</p>'+
      '<p><strong>Photo quality check</strong> ('+usable+' of '+list.length+' usable'+(poor?', '+poor+' poor':'')+')</p><ul class="plist">'+rows+'</ul>'+
      '<p><strong>Missing views:</strong> '+(miss.length?miss.map(esc).join(', '):'none; all 6 views provided')+'</p>'+
      '<p><strong>Next steps:</strong> '+(poor?'retake the poor photos in even light, held steady. ':'')+(miss.length?'Add the missing views. ':'')+'For a real purchase, confirm with the brand’s official store or an authorised reseller.</p>'+
      '<p class="meta">Limitation: this demo measures photo quality only. Judging genuine vs counterfeit needs the trained model and reference data planned for the full project, and would still be indicative, not a guarantee.</p>';
  }
  function run(){
    if(!items.length)return;
    clearSteps();const my=++runId,snap=items.slice();
    runBtn.disabled=true;report.innerHTML='<p>Running demo assessment…</p>';
    steps.forEach((s,i)=>timers.push(setTimeout(()=>{if(i>0)steps[i-1].className='done';s.className='run';},i*800)));
    const anim=new Promise(r=>timers.push(setTimeout(r,steps.length*800)));
    Promise.all([Promise.all(snap.map(analyze)),anim]).then(()=>{
      if(my!==runId)return;
      steps[steps.length-1].className='done';showReport(snap);runBtn.disabled=false;
    });
  }

  file.addEventListener('change',()=>{add([...file.files]);file.value='';});
  ['dragenter','dragover'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('over');}));
  ['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('over');}));
  drop.addEventListener('drop',ev=>add([...ev.dataTransfer.files]));
  runBtn.addEventListener('click',run);resetBtn.addEventListener('click',reset);
})();
