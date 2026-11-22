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
  let items=[],timers=[];

  function clearSteps(){timers.forEach(clearTimeout);timers=[];steps.forEach(s=>s.className='');}
  function esc(t){return t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function render(){
    grid.querySelectorAll('.thumb').forEach(n=>n.remove());
    empty.hidden=items.length>0;
    items.forEach((it,i)=>{
      const d=document.createElement('div');d.className='thumb';
      const img=document.createElement('img');img.src=it.url;img.alt='Uploaded shoe photo '+(i+1)+': '+it.file.name;
      const sel=document.createElement('select');sel.setAttribute('aria-label','View for photo '+(i+1));
      VIEWS.forEach(v=>{const o=document.createElement('option');o.textContent=v;if(v===it.view)o.selected=true;sel.appendChild(o);});
      sel.addEventListener('change',()=>{it.view=sel.value;clearSteps();report.innerHTML=EMPTY;});
      const rm=document.createElement('button');rm.type='button';rm.textContent='Remove';
      rm.addEventListener('click',()=>{URL.revokeObjectURL(it.url);items=items.filter(x=>x!==it);clearSteps();report.innerHTML=EMPTY;msg.textContent='';update();});
      d.append(img,sel,rm);grid.appendChild(d);
    });
    runBtn.disabled=items.length===0;
    dropText.textContent=items.length?items.length+' of '+MAXN+' photos selected (click to add more)':DROPTXT;
  }
  function update(){render();}
  function reset(){
    items.forEach(i=>URL.revokeObjectURL(i.url));items=[];file.value='';msg.textContent='';
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
  function showReport(){
    const kb=Math.round(items.reduce((a,i)=>a+i.file.size,0)/1024),have=[...new Set(items.map(i=>i.view))],miss=VIEWS.filter(v=>!have.includes(v));
    report.innerHTML='<p><span class="tag">Unable to assess (demo)</span></p>'+
      '<p class="meta">'+items.length+' photo(s) • '+kb+' KB total</p>'+
      '<p><strong>Views provided:</strong> '+have.map(esc).join(', ')+'</p>'+
      '<p><strong>Missing views:</strong> '+(miss.length?miss.map(esc).join(', '):'none; all 6 views provided')+'</p>'+
      '<p><strong>What the real system would report:</strong></p><ul><li>Image quality for each view</li><li>Visual match with reference records</li><li>Suspicious indicators, if any</li><li>Confidence level and next steps</li></ul>'+
      '<p><strong>Limitations:</strong></p><ul><li>This demo does not analyse the images; the result is a placeholder.</li><li>A real result would still be indicative and never a guarantee of authenticity.</li><li>The full workflow also uses product codes and catalogue checks.</li></ul>'+
      '<p><strong>Recommendation:</strong> for a real purchase, confirm with the brand’s official store or an authorised reseller.</p>';
  }
  function run(){
    if(!items.length)return;
    clearSteps();runBtn.disabled=true;report.innerHTML='<p>Running demo assessment…</p>';
    steps.forEach((s,i)=>timers.push(setTimeout(()=>{if(i>0)steps[i-1].className='done';s.className='run';},i*800)));
    timers.push(setTimeout(()=>{steps[steps.length-1].className='done';showReport();runBtn.disabled=false;},steps.length*800));
  }

  file.addEventListener('change',()=>{add([...file.files]);file.value='';});
  ['dragenter','dragover'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('over');}));
  ['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('over');}));
  drop.addEventListener('drop',ev=>add([...ev.dataTransfer.files]));
  runBtn.addEventListener('click',run);resetBtn.addEventListener('click',reset);
})();
