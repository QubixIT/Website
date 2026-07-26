  // Mobile hamburger menu — open/close slide-in panel, close on link click, overlay click, or Escape.
  (function(){
    const toggle = document.getElementById('navToggle');
    const overlay = document.getElementById('mobileNavOverlay');
    const panel = document.getElementById('mobileNavPanel');
    if(!toggle || !overlay || !panel) return;

    function openMenu(){
      toggle.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      overlay.classList.add('open');
      panel.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu(){
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      overlay.classList.remove('open');
      panel.classList.remove('open');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', () => {
      toggle.classList.contains('open') ? closeMenu() : openMenu();
    });
    overlay.addEventListener('click', closeMenu);
    panel.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if(window.innerWidth > 860) closeMenu();
    });
  })();

  // Circular process diagram: nodes are placed using real measured ring geometry
  // (not guessed percentages), and a glowing "signal" travels the ring like a
  // live network ping — ambiently on its own, and directly to whichever node is tapped.
  (function(){
    const circle = document.getElementById('processCircle');
    const nodes = document.querySelectorAll('.process-node');
    const ball = document.getElementById('signalBall');
    if(!circle || !nodes.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Single shared source of truth for ring geometry, used by both node
    // placement and the signal ball, so they can never fall out of sync.
    let geo = { size: 0, cx: 0, cy: 0, radius: 0 };
    function measure(){
      const size = circle.clientWidth; // container is a 1:1 aspect-ratio square
      geo.size = size;
      geo.cx = size / 2;
      geo.cy = size / 2;
      geo.radius = size * (168 / 400); // matches the SVG ring's r=168 on a 400 viewBox
    }
    function pointOnRing(angleDeg){
      const rad = angleDeg * (Math.PI / 180);
      return {
        x: geo.cx + geo.radius * Math.cos(rad),
        y: geo.cy + geo.radius * Math.sin(rad)
      };
    }

    function placeNodes(){
      measure();
      nodes.forEach(node => {
        const angle = parseFloat(node.getAttribute('data-angle'));
        const p = pointOnRing(angle);
        node.style.left = p.x + 'px';
        node.style.top = p.y + 'px';
      });
      if(ball && !reduceMotion){
        const p = pointOnRing(currentAngle);
        ball.style.left = p.x + 'px';
        ball.style.top = p.y + 'px';
      }
    }

    placeNodes();
    window.addEventListener('resize', placeNodes);
    window.addEventListener('load', placeNodes);
    setTimeout(placeNodes, 250); // re-check once fonts/layout settle

    if(!ball || reduceMotion) return; // keep it simple/static for reduced-motion users

    let currentAngle = -90; // starts at node 1 (Discover)
    let animId = null;
    let ambientId = null;

    function setBall(angleDeg){
      const p = pointOnRing(angleDeg);
      ball.style.left = p.x + 'px';
      ball.style.top = p.y + 'px';
    }

    function stopAmbient(){
      if(ambientId) cancelAnimationFrame(ambientId);
      ambientId = null;
    }

    function startAmbient(){
      stopAmbient();
      let last = performance.now();
      const speed = 12; // degrees per second — slow, steady drift like a live signal
      function tick(now){
        const dt = (now - last) / 1000;
        last = now;
        currentAngle = (currentAngle + speed * dt) % 360;
        setBall(currentAngle);
        ambientId = requestAnimationFrame(tick);
      }
      ambientId = requestAnimationFrame(tick);
    }

    function travelTo(targetAngle, node){
      stopAmbient();
      if(animId) cancelAnimationFrame(animId);

      const start = currentAngle;
      const delta = ((targetAngle - start) % 360 + 360) % 360; // always travel clockwise, "forward" through the cycle
      const duration = Math.max(400, delta * 4); // faster for short hops, capped floor for very short ones
      const startTime = performance.now();

      function step(now){
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out, like a signal settling into place
        currentAngle = start + delta * eased;
        setBall(currentAngle);
        if(t < 1){
          animId = requestAnimationFrame(step);
        } else {
          currentAngle = targetAngle;
          setBall(currentAngle);
          if(node){
            node.classList.add('pinged');
            setTimeout(() => node.classList.remove('pinged'), 700);
          }
          setTimeout(startAmbient, 500); // resume the ambient drift after a short pause
        }
      }
      animId = requestAnimationFrame(step);
    }

    nodes.forEach(node => {
      const angle = parseFloat(node.getAttribute('data-angle'));
      node.addEventListener('click', () => travelTo(angle, node));
      node.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          travelTo(angle, node);
        }
      });
    });

    startAmbient();
  })();

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
