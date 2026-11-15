document.getElementById('menu').addEventListener('click',()=>document.getElementById('links').classList.toggle('open'));
document.querySelectorAll('#links a').forEach(a=>a.addEventListener('click',()=>document.getElementById('links').classList.remove('open')));

(function(){
  const file=document.getElementById('shoeFile'),drop=document.querySelector('.drop'),dropText=document.getElementById('dropText'),
    msg=document.getElementById('uploadMsg'),img=document.getElementById('previewImg'),empty=document.getElementById('previewEmpty'),
    runBtn=document.getElementById('runBtn'),resetBtn=document.getElementById('resetBtn'),steps=[...document.querySelectorAll('#steps li')],
    report=document.getElementById('report');
  const ALLOWED=['image/jpeg','image/png','image/webp'],MAX=5*1024*1024,EMPTY='<p>The report will appear here after you run the demo assessment.</p>';
  let url=null,current=null,timers=[];

  function clearSteps(){timers.forEach(clearTimeout);timers=[];steps.forEach(s=>s.className='');}
  function reset(){
    if(url)URL.revokeObjectURL(url);url=null;current=null;file.value='';
    img.hidden=true;img.removeAttribute('src');empty.hidden=false;msg.textContent='';
    dropText.textContent='Choose a shoe photo (JPG, PNG or WebP, up to 5 MB)';
    runBtn.disabled=true;clearSteps();report.innerHTML=EMPTY;
  }
  function load(f){
    clearSteps();report.innerHTML=EMPTY;
    if(!f)return;
    if(!ALLOWED.includes(f.type)){reset();msg.textContent='Unsupported file. Please choose a JPG, PNG or WebP image.';return;}
    if(f.size>MAX){reset();msg.textContent='File is too large. Please choose an image under 5 MB.';return;}
    msg.textContent='';if(url)URL.revokeObjectURL(url);
    url=URL.createObjectURL(f);current=f;
    img.src=url;img.alt='Preview of uploaded shoe: '+f.name;img.hidden=false;empty.hidden=true;
    dropText.textContent='Selected: '+f.name+' (click to change)';runBtn.disabled=false;
  }
  function esc(t){return t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function showReport(){
    const kb=(current.size/1024).toFixed(0);
    report.innerHTML='<p><span class="tag">Unable to assess (demo)</span></p>'+
      '<p class="meta">File: '+esc(current.name)+' • '+kb+' KB • '+esc(current.type)+'</p>'+
      '<p><strong>What the real system would report:</strong></p><ul><li>Image quality and angle coverage</li><li>Visual match with reference records</li><li>Suspicious indicators, if any</li><li>Confidence level and next steps</li></ul>'+
      '<p><strong>Limitations:</strong></p><ul><li>This demo does not analyse the image; the result is a placeholder.</li><li>A real result would still be indicative and never a guarantee of authenticity.</li><li>One photo is not enough; the full workflow uses front, side, heel and label images plus product codes.</li></ul>'+
      '<p><strong>Recommendation:</strong> for a real purchase, confirm with the brand’s official store or an authorised reseller.</p>';
  }
  function run(){
    if(!current)return;
    clearSteps();runBtn.disabled=true;report.innerHTML='<p>Running demo assessment…</p>';
    steps.forEach((s,i)=>{
      timers.push(setTimeout(()=>{if(i>0)steps[i-1].className='done';s.className='run';},i*800));
    });
    timers.push(setTimeout(()=>{steps[steps.length-1].className='done';showReport();runBtn.disabled=false;},steps.length*800));
  }

  file.addEventListener('change',()=>load(file.files[0]));
  ['dragenter','dragover'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add('over');}));
  ['dragleave','drop'].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove('over');}));
  drop.addEventListener('drop',ev=>{const f=ev.dataTransfer.files[0];if(f){try{const dt=new DataTransfer();dt.items.add(f);file.files=dt.files;}catch(e){}load(f);}});
  runBtn.addEventListener('click',run);resetBtn.addEventListener('click',reset);
})();
