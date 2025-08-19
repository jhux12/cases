(function(global){
  const state={root:null,items:[],isSpinning:false,listeners:{},tileWidth:132,cruiseEmitted:false,animationId:null,track:null,fast:false};
  const rarityColors={common:'#b6bdc9',uncommon:'#8FE3C9',rare:'#A6C8FF',ultra:'#C9A7FF',ultrarare:'#C9A7FF',legendary:'#FFD36E'};

  function emit(name,data){(state.listeners[name]||[]).forEach(fn=>fn(data));}
  function on(name,fn){(state.listeners[name]=state.listeners[name]||[]).push(fn);}

  function render(){
    if(!state.root) return;
    state.root.innerHTML='';
    const track=document.createElement('div');
    track.className='track';
    const tiles=state.items.concat(state.items,state.items);
    tiles.forEach(item=>{
      const tile=document.createElement('div');
      tile.className='tile';
      tile.innerHTML=`<img src="${item.image}" alt=""/><div>${item.name}</div>`;
      track.appendChild(tile);
    });
    state.root.appendChild(track);
    state.track=track;
  }

  function init({root,items}){state.root=root;setItems(items||[]);}
  function setItems(items){state.items=items.slice();render();}
  function isSpinning(){return state.isSpinning;}

  function burstConfetti(){/* placeholder */}

  function spinToIndex(index,opts={}){
    if(state.isSpinning||!state.track) return;
    const duration=opts.durationMs||2400;
    const count=state.items.length;
    const target=index+count; // middle set
    const startX=getOffset();
    const offset=opts.nearMiss?((Math.random()<0.5?-1:1)*state.tileWidth*0.4):0;
    const finalX=-(target*state.tileWidth)+offset;
    state.isSpinning=true;state.cruiseEmitted=false;
    const accDur=duration*0.25,decelDur=duration*0.45,cruiseDur=duration-accDur-decelDur;
    const start=performance.now();
    function easeInCubic(t){return t*t*t;}
    function easeOutQuart(t){return 1-Math.pow(1-t,4);}
    function step(now){
      const elapsed=now-start;
      let pos;
      if(elapsed<accDur){
        const p=easeInCubic(elapsed/accDur);
        pos=startX + p*(finalX-startX)*(accDur/duration);
      }else if(elapsed<accDur+cruiseDur){
        if(!state.cruiseEmitted){emit('cruise');state.cruiseEmitted=true;}
        const p=(elapsed-accDur)/cruiseDur;
        pos=startX + (finalX-startX)*(accDur/duration) + p*(finalX-startX)*(cruiseDur/duration);
      }else if(elapsed<duration){
        const p=easeOutQuart((elapsed-accDur-cruiseDur)/decelDur);
        pos=startX + (finalX-startX)*(accDur+cruiseDur)/duration + p*(finalX-startX)*(decelDur/duration);
      }else{
        pos=finalX;
      }
      state.track.style.transform=`translate3d(${pos}px,0,0)`;
      if(elapsed<duration){
        state.animationId=requestAnimationFrame(step);
      }else{
        state.animationId=null;
        state.isSpinning=false;
        const item=state.items[index];
        const winTile=state.track.children[target];
        winTile.style.border=`2px solid ${rarityColors[item.rarity]||'#fff'}`;
        burstConfetti();
        emit('reveal',item);
        opts.onReveal&&opts.onReveal(item);
        emit('finish',item);
        if(offset!==0){
          setTimeout(()=>{
            state.track.style.transition='transform 150ms';
            state.track.style.transform=`translate3d(${-target*state.tileWidth}px,0,0)`;
            setTimeout(()=>{state.track.style.transition='';},160);
          },200);
        }
      }
    }
    emit('start');
    state.animationId=requestAnimationFrame(step);
  }

  function getOffset(){
    if(!state.track) return 0;
    const matrix=new WebKitCSSMatrix(getComputedStyle(state.track).transform);
    return matrix.m41;
  }

  global.PackOpener={init,setItems,isSpinning,spinToIndex,on,_state:state};
})(window);
