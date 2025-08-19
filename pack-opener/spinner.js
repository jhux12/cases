(function(global){
  const state={root:null,items:[],isSpinning:false,listeners:{},muted:false,tileWidth:132,cruiseEmitted:false};

  function emit(name,data){(state.listeners[name]||[]).forEach(fn=>fn(data));}
  function on(name,handler){(state.listeners[name]||(state.listeners[name]=[])).push(handler);} 

  function render(){
    if(!state.root) return;
    state.root.innerHTML='';
    if(state.items.length===0){
      const msg=document.createElement('div');
      msg.className='tile';
      msg.style.background='transparent';
      msg.style.boxShadow='none';
      msg.textContent='No items';
      state.root.appendChild(msg);
      return;
    }
    const frag=document.createDocumentFragment();
    const copies=5;
    for(let c=0;c<copies;c++){
      state.items.forEach(item=>{
        const tile=document.createElement('div');
        tile.className='tile';
        tile.dataset.id=item.id;
        const priceHtml=item.value!==undefined?`<div class="price">${item.value}<img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" alt="coin"/></div>`:'';
        tile.innerHTML=`<img src="${item.image}" alt="${item.name}"/><div class="tile-info"><div class="name">${item.name}</div>${priceHtml}</div>`;
        frag.appendChild(tile);
      });
    }
    state.root.appendChild(frag);
    state.root.style.transform='translate3d(0,0,0)';
    const firstTile=state.root.querySelector('.tile');
    if(firstTile){
      const rect=firstTile.getBoundingClientRect();
      const style=getComputedStyle(firstTile);
      state.tileWidth=rect.width+parseFloat(style.marginLeft)+parseFloat(style.marginRight);
    }
  }

  function init({root,items}){state.root=root;setItems(items||[]);}
  function setItems(items){state.items=items.slice();render();}
  function isSpinning(){return state.isSpinning;}
  function setMuted(v){state.muted=v;}

  function playTick(){
    if(state.muted) return; const ctx=getCtx();
    const osc=ctx.createOscillator();osc.type='triangle';osc.frequency.value=800;
    const gain=ctx.createGain();gain.gain.value=0.02;
    osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.05);
  }
  let audioCtx;function getCtx(){return audioCtx||(audioCtx=new (window.AudioContext||window.webkitAudioContext)());}

  function stinger(rarity){
    if(state.muted) return;const freq={common:400,uncommon:500,rare:600,ultra:700,legendary:800}[rarity]||500;
    const ctx=getCtx();const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=freq;
    const gain=ctx.createGain();gain.gain.setValueAtTime(0.001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1,ctx.currentTime+0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.5);
    osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.5);
  }

  function burstConfetti(){
    const container=document.createElement('div');
    container.style.position='absolute';container.style.top='0';container.style.left='50%';container.style.transform='translateX(-50%)';
    state.root.appendChild(container);
    for(let i=0;i<20;i++){const c=document.createElement('div');c.className='confetti';c.style.left=(Math.random()*20-10)+'px';c.style.background=['#FFD36E','#A6C8FF','#8FE3C9','#C9A7FF'][i%4];container.appendChild(c);} 
    setTimeout(()=>container.remove(),700);
  }

  function spinToIndex(index,opts={}){
    if(state.isSpinning||!state.root) return;
    render();
    const startX=0;
    const duration=opts.durationMs||2400;state.isSpinning=true;
    if(opts.nearMiss){
      const tiles=state.root.children;const midStart=state.items.length*2;
      const highIndex=state.items.findIndex(it=>['legendary','ultra','rare'].includes(it.rarity)&&state.items.indexOf(it)!==index);
      if(highIndex>=0){
        const clone=document.createElement('div');const it=state.items[highIndex];
        clone.className='tile';
        const priceHtml=it.value!==undefined?`<div class="price">${it.value}<img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" alt="coin"/></div>`:'';
        clone.innerHTML=`<img src="${it.image}" alt="${it.name}"/><div class=\"tile-info\"><div class=\"name\">${it.name}</div>${priceHtml}</div>`;
        tiles[midStart+index+1].replaceWith(clone);
      }
    }
    const container=state.root.parentElement;
    const containerWidth=container.clientWidth;
    const centerOffset=containerWidth/2 - state.tileWidth/2;
    const targetIndex=state.items.length*2 + index;
    const finalX=-(targetIndex*state.tileWidth - centerOffset);
    const distance=finalX-startX;
      const accDur=duration*0.3, decelDur=duration*0.3, cruiseDur=duration-accDur-decelDur;
      const accDist=distance*0.3, decelDist=distance*0.3, cruiseDist=distance-accDist-decelDist;
      let lastTick=0;emit('start');
      function easeInCubic(t){return t*t*t;}function easeOutQuart(t){return 1-Math.pow(1-t,4);}
    function animate(now,start){
      const elapsed=now-start;let delta=0;
        if(elapsed<accDur){delta=easeInCubic(elapsed/accDur)*accDist;}
      else if(elapsed<accDur+cruiseDur){const t=(elapsed-accDur)/cruiseDur;delta=accDist+t*cruiseDist;if(!state.cruiseEmitted){emit('cruise');state.cruiseEmitted=true;}}
        else if(elapsed<duration){const t=(elapsed-accDur-cruiseDur)/decelDur;delta=accDist+cruiseDist+easeOutQuart(t)*decelDist;}
      else{delta=distance;}
        const pos=startX+delta;
        state.root.style.transform=`translate3d(${pos}px,0,0)`;
      if(now-lastTick>120){playTick();lastTick=now;}
      if(elapsed<duration){requestAnimationFrame(t=>animate(t,start));}
        else{state.root.style.transform=`translate3d(${finalX}px,0,0)`;state.isSpinning=false;state.cruiseEmitted=false;const item=state.items[index];state.root.children[targetIndex].classList.add('win');stinger(item.rarity);burstConfetti();emit('reveal',item);opts.onReveal&&opts.onReveal(item);emit('finish',item);} }
    requestAnimationFrame(t=>animate(t,t));
  }

  function getCurrentX(){
    const style=getComputedStyle(state.root);
    const matrix=new DOMMatrixReadOnly(style.transform);
    return matrix.m41;
  }

  global.PackOpener={init,setItems,isSpinning,spinToIndex,on,setMuted,_state:state};
})(window);
