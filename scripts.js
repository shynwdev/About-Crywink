(function(){
  'use strict';

  var OWNER_KEY = 'draig_owner';
  var isOwner   = localStorage.getItem(OWNER_KEY) === '1';

  (function buildNav(){
    var nav = document.getElementById('nav');
    if(!nav) return;
    var items = [
      {label:'Home',    href:'#home'},
      {label:'Skills',  href:'#skills'},
      {label:'Payment', href:'#payment'},
      {label:'Social',  href:'#social'}
    ];
    var pill = document.createElement('div');
    pill.className = 'nav-pill';
    nav.appendChild(pill);
    items.forEach(function(item, i){
      if(i > 0){ var sep = document.createElement('div'); sep.className = 'nav-sep'; pill.appendChild(sep); }
      var a   = document.createElement('a');   a.className = 'nav-item'; a.href = item.href;
      var dot = document.createElement('div'); dot.className = 'nav-item-dot';
      var lbl = document.createElement('div'); lbl.className = 'nav-item-label'; lbl.textContent = item.label;
      a.appendChild(dot); a.appendChild(lbl); pill.appendChild(a);
    });
    var sections = items.map(function(it){ return document.querySelector(it.href); });
    var links    = nav.querySelectorAll('.nav-item');
    function setActive(){
      var active = 0;
      sections.forEach(function(sec, i){ if(sec && sec.getBoundingClientRect().top <= window.innerHeight * 0.4) active = i; });
      links.forEach(function(lk, i){ lk.classList.toggle('active', i === active); });
    }
    window.addEventListener('scroll', setActive, {passive:true});
    setActive();
  })();

  (function scrollReveal(){
    var allCards = document.querySelectorAll('.skill-card, .pay-card, .soc-card');
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var el = entry.target;
        var i  = el.dataset.revealIdx ? +el.dataset.revealIdx : 0;
        clearTimeout(el._revealTimer);
        if(entry.isIntersecting){
          el._revealTimer = setTimeout(function(){
            el.classList.add('reveal');
            var fill = el.querySelector('.sk-fill');
            if(fill) fill.style.width = (fill.getAttribute('data-w') || 0) + '%';
          }, i * 80);
        } else {
          el._revealTimer = setTimeout(function(){
            el.classList.remove('reveal');
            var fill = el.querySelector('.sk-fill');
            if(fill) fill.style.width = '0%';
          }, 60);
        }
      });
    }, {threshold: 0.35, rootMargin: '0px 0px -80px 0px'});
    var gc = {};
    allCards.forEach(function(el){
      var g = el.classList.contains('skill-card') ? 'skill' : el.classList.contains('pay-card') ? 'pay' : 'soc';
      gc[g] = gc[g] || 0; el.dataset.revealIdx = gc[g]++; obs.observe(el);
    });
  })();

  (function qrOverlay(){
    var overlay = document.createElement('div');
    overlay.className = 'qr-overlay';
    overlay.innerHTML =
      '<div class="qr-overlay-card" id="qr-card">' +
        '<button class="qr-overlay-close" id="qr-close"><i class="fas fa-times"></i></button>' +
        '<div class="qr-overlay-icon" id="qr-icon"></div>' +
        '<div class="qr-overlay-img"><img id="qr-img" src="" alt="QR"></div>' +
        '<div class="qr-overlay-name" id="qr-name"></div>' +
        '<div class="qr-overlay-num" id="qr-num"></div>' +
        '<div class="qr-overlay-hint">Quét mã QR để thanh toán</div>' +
      '</div>';
    document.body.appendChild(overlay);
    var card=document.getElementById('qr-card'), qrClose=document.getElementById('qr-close'),
        qrIcon=document.getElementById('qr-icon'), qrImg=document.getElementById('qr-img'),
        qrName=document.getElementById('qr-name'), qrNum=document.getElementById('qr-num');
    function openQR(pc){
      var icon=pc.querySelector('.pay-icon i'), img=pc.querySelector('.qr-wrap img'),
          name=pc.querySelector('.pay-name'),   num=pc.querySelector('.pay-num');
      qrIcon.innerHTML=icon?icon.outerHTML:''; qrImg.src=img?img.src:''; qrImg.alt=img?img.alt:'';
      qrName.textContent=name?name.textContent:''; qrNum.textContent=num?num.textContent:'';
      overlay.classList.add('active'); document.body.style.overflow='hidden';
    }
    function closeQR(){ overlay.classList.remove('active'); document.body.style.overflow=''; }
    document.querySelectorAll('.pay-card').forEach(function(pc){
      pc.addEventListener('click', function(e){ e.stopPropagation(); openQR(pc); });
    });
    qrClose.addEventListener('click', function(e){ e.stopPropagation(); closeQR(); });
    overlay.addEventListener('click', function(e){ if(!card.contains(e.target)) closeQR(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeQR(); });
  })();

  (function commentPanel(){
    var STORE = 'draig_comments';
    var activeTab = 'all';

    function load(){ try{ return JSON.parse(localStorage.getItem(STORE)) || []; }catch(e){ return []; } }
    function save(d){ localStorage.setItem(STORE, JSON.stringify(d)); }

    function timeAgo(ts){
      var s = (Date.now() - ts) / 1000;
      if(s < 60) return 'just now';
      if(s < 3600) return Math.floor(s/60) + 'm ago';
      if(s < 86400) return Math.floor(s/3600) + 'h ago';
      return Math.floor(s/86400) + 'd ago';
    }

    function initials(name){
      return name.trim().split(/\s+/).map(function(w){ return w[0]; }).join('').slice(0,2).toUpperCase() || '?';
    }

    var toggle = document.createElement('div');
    toggle.className = 'cm-toggle';
    toggle.innerHTML = '<i class="fas fa-comment-dots"></i><span class="cm-toggle-label">Comments</span><span class="cm-badge" id="cm-badge">0</span>';
    document.body.appendChild(toggle);

    var panel = document.createElement('div');
    panel.className = 'cm-panel';
    panel.innerHTML =
      '<div class="cm-panel-head">' +
        '<div class="cm-panel-title"><i class="fas fa-comment-dots"></i> Comments</div>' +
        '<button class="cm-panel-close" id="cm-close"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="cm-tabs">' +
        '<button class="cm-tab active" data-tab="all">All</button>' +
        '<button class="cm-tab" data-tab="pinned">⭐ Pinned</button>' +
      '</div>' +
      '<div class="cm-list" id="cm-list"></div>' +
      '<div class="cm-input-wrap">' +
        '<div class="cm-name-row">' +
          '<input class="cm-input" id="cm-name" placeholder="Your name…" style="flex:1">' +
        '</div>' +
        '<textarea class="cm-input" id="cm-text" rows="3" placeholder="Leave a comment…"></textarea>' +
        '<button class="cm-send" id="cm-send">Send Comment</button>' +
      '</div>';
    document.body.appendChild(panel);

    var list   = document.getElementById('cm-list');
    var badge  = document.getElementById('cm-badge');
    var nameIn = document.getElementById('cm-name');
    var textIn = document.getElementById('cm-text');
    var sendBtn= document.getElementById('cm-send');

    function updateBadge(){
      var d = load();
      badge.textContent = d.length;
    }

    function render(){
      var d = load();
      var shown = activeTab === 'pinned' ? d.filter(function(c){ return c.pinned; }) : d;
      list.innerHTML = '';

      if(!shown.length){
        var em = document.createElement('div');
        em.className = 'cm-empty';
        em.innerHTML = '<i class="fas fa-' + (activeTab==='pinned'?'star':'comment') + '"></i>' +
          (activeTab==='pinned' ? 'No pinned comments yet.' : 'Be the first to comment!');
        list.appendChild(em);
        updateBadge(); return;
      }

      shown.slice().reverse().forEach(function(c){
        var item = document.createElement('div');
        item.className = 'cm-item' + (c.pinned ? ' pinned' : '');

        var pinBadge = c.pinned ? '<div class="cm-pin-badge"><i class="fas fa-star"></i> Pinned</div>' : '';

        var repliesHTML = '';
        if(c.replies && c.replies.length){
          repliesHTML = '<div class="cm-replies">' + c.replies.map(function(r){
            return '<div class="cm-reply">' +
              '<div class="cm-reply-avatar">' + initials(r.name) + '</div>' +
              '<div class="cm-reply-body">' +
                '<div class="cm-reply-name">' + esc(r.name) + (r.isOwner ? '<span class="cm-owner-tag">Owner</span>' : '') + '</div>' +
                '<div class="cm-reply-text">' + esc(r.text) + '</div>' +
              '</div></div>';
          }).join('') + '</div>';
        }

        item.innerHTML =
          pinBadge +
          '<div class="cm-item-head">' +
            '<div class="cm-avatar">' + initials(c.name) + '</div>' +
            '<div class="cm-meta">' +
              '<div class="cm-name">' + esc(c.name) + (c.isOwner ? '<span class="cm-owner-tag">Owner</span>' : '') + '</div>' +
              '<div class="cm-time">' + timeAgo(c.ts) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cm-text">' + esc(c.text) + '</div>' +
          '<div class="cm-actions">' +
            '<button class="cm-btn like-btn' + (c.liked ? ' liked' : '') + '" data-id="' + c.id + '">' +
              '<i class="fas fa-heart"></i> ' + (c.likes || 0) +
            '</button>' +
            (isOwner ? (
              '<button class="cm-btn reply-toggle" data-id="' + c.id + '"><i class="fas fa-reply"></i> Reply</button>' +
              '<button class="cm-btn pin-btn' + (c.pinned ? ' pinned-btn' : '') + '" data-id="' + c.id + '">' +
                '<i class="fas fa-star"></i> ' + (c.pinned ? 'Unpin' : 'Pin') +
              '</button>' +
              '<button class="cm-btn del-btn" data-id="' + c.id + '" style="margin-left:auto;color:#884444"><i class="fas fa-trash"></i></button>'
            ) : '') +
          '</div>' +
          repliesHTML +
          (isOwner ? (
            '<div class="cm-reply-box" id="rb-' + c.id + '">' +
              '<textarea class="cm-input" rows="2" placeholder="Write a reply…" id="rt-' + c.id + '"></textarea>' +
              '<button class="cm-send" style="margin-top:4px" data-rid="' + c.id + '">Reply</button>' +
            '</div>'
          ) : '');

        list.appendChild(item);
      });

      list.querySelectorAll('.like-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var id = this.dataset.id;
          var d  = load();
          var c  = d.find(function(x){ return x.id === id; });
          if(!c) return;
          c.liked = !c.liked;
          c.likes = (c.likes || 0) + (c.liked ? 1 : -1);
          save(d); render();
        });
      });

      if(isOwner){
        list.querySelectorAll('.pin-btn').forEach(function(btn){
          btn.addEventListener('click', function(){
            var id = this.dataset.id, d = load(), c = d.find(function(x){ return x.id===id; });
            if(!c) return; c.pinned = !c.pinned; save(d); render();
          });
        });
        list.querySelectorAll('.del-btn').forEach(function(btn){
          btn.addEventListener('click', function(){
            var id = this.dataset.id, d = load();
            save(d.filter(function(x){ return x.id!==id; })); render();
          });
        });
        list.querySelectorAll('.reply-toggle').forEach(function(btn){
          btn.addEventListener('click', function(){
            var rb = document.getElementById('rb-' + this.dataset.id);
            if(rb) rb.classList.toggle('open');
          });
        });
        list.querySelectorAll('[data-rid]').forEach(function(btn){
          btn.addEventListener('click', function(){
            var rid = this.dataset.rid;
            var ta  = document.getElementById('rt-' + rid);
            if(!ta || !ta.value.trim()) return;
            var d = load(), c = d.find(function(x){ return x.id===rid; });
            if(!c) return;
            c.replies = c.replies || [];
            c.replies.push({name:'Draig', text:ta.value.trim(), isOwner:true, ts:Date.now()});
            save(d); render();
          });
        });
      }

      updateBadge();
    }

    function esc(s){
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    toggle.addEventListener('click', function(){ panel.classList.toggle('open'); });
    document.getElementById('cm-close').addEventListener('click', function(){ panel.classList.remove('open'); });

    panel.querySelectorAll('.cm-tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        activeTab = this.dataset.tab;
        panel.querySelectorAll('.cm-tab').forEach(function(t){ t.classList.remove('active'); });
        this.classList.add('active');
        render();
      });
    });

    sendBtn.addEventListener('click', function(){
      var name = nameIn.value.trim() || 'Anonymous';
      var text = textIn.value.trim();
      if(!text) return;
      var d = load();
      d.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: name, text: text, ts: Date.now(),
        likes: 0, liked: false, pinned: false,
        isOwner: isOwner, replies: []
      });
      save(d);
      textIn.value = '';
      render();
    });

    textIn.addEventListener('keydown', function(e){
      if(e.key === 'Enter' && e.ctrlKey){ sendBtn.click(); }
    });

    if(isOwner){
      nameIn.value = 'Draig';
      nameIn.readOnly = true;
      nameIn.style.opacity = '.5';
    }

    var ownerSeq = [];
    document.addEventListener('keydown', function(e){
      ownerSeq.push(e.key);
      if(ownerSeq.length > 6) ownerSeq.shift();
      if(ownerSeq.join('') === 'draig'){
        isOwner = true;
        localStorage.setItem(OWNER_KEY, '1');
        nameIn.value = 'Draig'; nameIn.readOnly = true; nameIn.style.opacity = '.5';
        render();
        alert('Owner mode activated!');
      }
    });

    render();
  })();

  var tracks = [
    {title:'Có Hẹn Với Thanh Xuân', artist:'MONSTAR', src:'Có Hẹn Với Thanh Xuân.mp3'},
    {title:'Điều Gì Khiến Anh Đau Lòng Nhất',  artist:'HAZEL',  src:'Điều Gì Khiến Anh Đau Lòng Nhất.mp3'},
    {title:'Hẹn Lần Sau', artist:'MAYDAYs',    src:'Hẹn Lần Sau.mp3'},
    {title:'In Love', artist:'Low G',    src:'In Love.mp3'},
    {title:'Kho Báu', artist:'Trọng Hiếu x Rhymastic',    src:'Kho Báu.mp3'},
    {title:'Không Buôn', artist:'Hngle',    src:'Không Buôn.mp3'},
    {title:'Không Thời Gian', artist:'Dương DOMIC',    src:'Không Thời Gian.mp3'},
    {title:'Nàng Thơ', artist:'Hoàng Dũng',    src:'Nàng Thơ.mp3'},
    {title:'Nơi Này Có Anh', artist:'Sơn Tùng M-TP',    src:'Nơi Này Có Anh.mp3'},
    {title:'Phép Màu', artist:'MAYDAYs',    src:'Phép Màu.mp3'},
    {title:'Thằng Điên', artist:'JUSTATEE x PHƯƠNG LY',    src:'Thằng Điên.mp3'},
    {title:'Yêu 5', artist:'Rhymastic',    src:'Yêu 5.mp3'}
  ];

  var idx = 0, seeking = false, playing = false;
  var audio   = document.getElementById('audio');
  var pp      = document.getElementById('mp-pp');
  var pico    = document.getElementById('mp-pico');
  var prevBtn = document.getElementById('mp-prev');
  var nextBtn = document.getElementById('mp-next');
  var volEl   = document.getElementById('mp-vol');
  var muteEl  = document.getElementById('mp-mute');
  var titleEl = document.getElementById('mp-title');
  var artEl   = document.getElementById('mp-artist');
  var progEl  = document.getElementById('mp-prog');
  var fillEl  = document.getElementById('mp-fill');
  var curEl   = document.getElementById('mp-cur');
  var durEl   = document.getElementById('mp-dur');
  var mp      = document.getElementById('mp');
  var tog     = document.getElementById('mp-tog');
  var mpBody  = document.getElementById('mp-body');
  var gearBtn = document.getElementById('mp-gear');
  var tracklist = document.getElementById('mp-tracklist');
  var trackItems = [];

  function buildTracklist(){
    tracklist.innerHTML = ''; trackItems = [];
    tracks.forEach(function(t, i){
      var item = document.createElement('div');
      item.className = 'mp-track-item' + (i===idx?' playing':'');
      var num  = document.createElement('div'); num.className  = 'mp-track-num';  num.textContent = i===idx?'♪':(i+1);
      var info = document.createElement('div'); info.className = 'mp-track-info';
      var name = document.createElement('div'); name.className = 'mp-track-name'; name.textContent = t.title;
      var art  = document.createElement('div'); art.className  = 'mp-track-artist'; art.textContent = t.artist;
      var ico  = document.createElement('div'); ico.className  = 'mp-track-play'; ico.innerHTML = '<i class="fas fa-play" style="font-size:8px"></i>';
      info.appendChild(name); info.appendChild(art);
      item.appendChild(num); item.appendChild(info); item.appendChild(ico);
      tracklist.appendChild(item); trackItems.push(item);
      item.addEventListener('click', function(){ idx=i; load2(idx,true); updateTracklistUI(); });
    });
  }

  function updateTracklistUI(){
    trackItems.forEach(function(item,i){
      item.classList.toggle('playing',i===idx);
      var n=item.querySelector('.mp-track-num'); if(n) n.textContent=i===idx?'♪':(i+1);
    });
  }

  gearBtn.addEventListener('click', function(){
    var open=tracklist.classList.toggle('open'); gearBtn.classList.toggle('open',open);
  });
  document.addEventListener('click', function(e){
    if(!mp.contains(e.target)){ tracklist.classList.remove('open'); gearBtn.classList.remove('open'); }
  });

  function fmt(s){ s=s||0; return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'); }
  function set(el,v){ if(el) el.textContent=v; }

  function load2(i, auto){
    var t=tracks[i]; if(!t) return;
    audio.src=t.src; set(titleEl,t.title); set(artEl,'Artist: '+t.artist);
    fillEl.style.width='0%'; set(curEl,'0:00'); set(durEl,'0:00');
    audio.load(); if(auto) audio.play().catch(function(){}); updateTracklistUI();
  }

  function icon(p){ if(pico) pico.className=p?'fas fa-pause':'fas fa-play'; }
  function toggle(){ if(!audio.src) load2(idx); audio.paused?audio.play().catch(function(){}):audio.pause(); }

  audio.addEventListener('play',  function(){ playing=true;  icon(true);  });
  audio.addEventListener('pause', function(){ playing=false; icon(false); });
  audio.addEventListener('ended', function(){ idx=(idx+1)%tracks.length; load2(idx,true); });
  audio.addEventListener('loadedmetadata', function(){ set(durEl,isFinite(audio.duration)?fmt(audio.duration):'0:00'); });
  audio.addEventListener('timeupdate', function(){
    if(!seeking&&audio.duration){ var p=(audio.currentTime/audio.duration)*100; fillEl.style.width=p+'%'; set(curEl,fmt(audio.currentTime)); }
  });

  function seek(e){
    if(!audio.duration) return;
    var r=progEl.getBoundingClientRect();
    var x=(e.clientX!==undefined?e.clientX:(e.touches&&e.touches[0]?e.touches[0].clientX:0))-r.left;
    var p=Math.max(0,Math.min(1,x/r.width));
    audio.currentTime=p*audio.duration; fillEl.style.width=(p*100)+'%'; set(curEl,fmt(audio.currentTime));
  }

  var pd=false;
  progEl.addEventListener('click',seek);
  progEl.addEventListener('pointerdown',function(e){ pd=true;seeking=true; try{progEl.setPointerCapture(e.pointerId);}catch(_){} seek(e); });
  document.addEventListener('pointermove',function(e){ if(pd) seek(e); });
  document.addEventListener('pointerup',  function(){  if(pd){ pd=false; seeking=false; } });

  pp.addEventListener('click',toggle);
  prevBtn.addEventListener('click',function(){ idx=(idx-1+tracks.length)%tracks.length; load2(idx,playing||!audio.paused); });
  nextBtn.addEventListener('click',function(){ idx=(idx+1)%tracks.length; load2(idx,playing||!audio.paused); });

  function syncVol(){
    var v=volEl.value/100; audio.volume=v;
    var i=muteEl.querySelector('i'); if(i) i.className=v===0?'fas fa-volume-mute':(v<0.5?'fas fa-volume-down':'fas fa-volume-up');
  }
  volEl.addEventListener('input',syncVol);
  muteEl.addEventListener('click',function(){
    audio.muted=!audio.muted;
    var i=muteEl.querySelector('i'); if(i) i.className=audio.muted?'fas fa-volume-mute':(audio.volume<0.5?'fas fa-volume-down':'fas fa-volume-up');
  });

  tog.addEventListener('click',function(){
    var c=mpBody.style.display==='none'; mpBody.style.display=c?'':'none';
    var i=tog.querySelector('i'); if(i) i.className=c?'fas fa-chevron-up':'fas fa-chevron-down';
  });

  var lastY=0,st=null;
  window.addEventListener('scroll',function(){
    var y=window.pageYOffset;
    if(y>200&&y-lastY>40) mp.classList.add('hidden-scroll'); else mp.classList.remove('hidden-scroll');
    lastY=y; clearTimeout(st); st=setTimeout(function(){ mp.classList.remove('hidden-scroll'); },700);
  },{passive:true});

  window.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
    if(e.code==='Space'){ e.preventDefault(); toggle(); }
    if(e.code==='ArrowRight'){ idx=(idx+1)%tracks.length; load2(idx,playing||!audio.paused); }
    if(e.code==='ArrowLeft'){  idx=(idx-1+tracks.length)%tracks.length; load2(idx,playing||!audio.paused); }
    if(e.key&&e.key.toLowerCase()==='m') muteEl.click();
  });

  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){
      var t=document.querySelector(this.getAttribute('href'));
      if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });

  buildTracklist();
  load2(idx,false);
})();