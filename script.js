  // Hero "cyber travel" warp effect — particles streaming outward like flying through a data tunnel.
  (function(){
    const canvas = document.getElementById('warpCanvas');
    if(!canvas) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    let w, h, cx, cy, particles = [];
    const COUNT = 90;

    function resize(){
      const rect = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = rect.width;
      h = canvas.height = rect.height;
      cx = w * 0.72;   // bias toward the hero visual side
      cy = h * 0.42;
    }

    function spawn(){
      return {
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 60,
        speed: 0.5 + Math.random() * 1.3,
        size: 0.6 + Math.random() * 1.3,
        squash: 0.55 + Math.random() * 0.2
      };
    }

    for (let i = 0; i < COUNT; i++){
      const p = spawn();
      p.radius = Math.random() * Math.max(400, 600); // pre-seed so it doesn't start empty
      particles.push(p);
    }
    resize();
    window.addEventListener('resize', resize);

    function frame(){
      ctx.clearRect(0, 0, w, h);
      const maxR = Math.max(w, h) * 0.8;
      particles.forEach(p => {
        p.radius += p.speed;
        if (p.radius > maxR){
          Object.assign(p, spawn());
          p.radius = 0;
        }
        const progress = p.radius / maxR;
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius * p.squash;
        const opacity = Math.sin(progress * Math.PI) * 0.85;
        const r = p.size + progress * 1.8;
        ctx.beginPath();
        ctx.fillStyle = `rgba(66,198,255,${opacity.toFixed(2)})`;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // faint streak trailing back toward center for a sense of motion
        const tx = cx + Math.cos(p.angle) * p.radius * 0.9;
        const ty = cy + Math.sin(p.angle) * p.radius * p.squash * 0.9;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(14,94,255,${(opacity * 0.5).toFixed(2)})`;
        ctx.lineWidth = r * 0.6;
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();
      });
      if (!reduceMotion) requestAnimationFrame(frame);
    }

    if (reduceMotion){
      // draw a single calm frame and stop, per the person's motion preference
      frame();
    } else {
      requestAnimationFrame(frame);
    }
  })();

  // Count up the stat numbers once their card scrolls into view.
  (function(){
    const counters = document.querySelectorAll('.counter');
    if(!counters.length) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function animateCount(el){
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      if(reduceMotion){ el.textContent = target; return; }
      const duration = 1100;
      const start = performance.now();
      function step(now){
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target);
        if(p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            animateCount(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(c => io.observe(c));
    } else {
      counters.forEach(animateCount);
    }
  })();

  // Reveal the "cube wall" pieces gently as they enter view — one orchestrated moment, not continuous motion.
  const pieces = document.querySelectorAll('.piece');
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach((entry, i)=>{
        if(entry.isIntersecting){
          setTimeout(()=> entry.target.classList.add('in-view'), i * 60);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    pieces.forEach(p => io.observe(p));
  } else {
    pieces.forEach(p => p.classList.add('in-view'));
  }

  // Staggered reveal for card grids (vision/mission, services, why-choose, process) as each grid scrolls into view.
  const revealGroups = {};
  document.querySelectorAll('.reveal').forEach(el=>{
    const parent = el.parentElement;
    if(!revealGroups[parent] ) revealGroups[parent] = [];
    revealGroups[parent].push(el);
  });
  if ('IntersectionObserver' in window){
    const groupIo = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const siblings = Array.from(entry.target.parentElement.children).filter(c=>c.classList.contains('reveal'));
          siblings.forEach((el, i)=> setTimeout(()=> el.classList.add('in-view'), i * 90));
          siblings.forEach(el => groupIo.unobserve(el));
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => groupIo.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
  }
