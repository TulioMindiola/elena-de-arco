/* ==========================================================================
   Elena de Arco Restaurante · Interacciones
   JavaScript sin dependencias. Todo el contenido es visible sin este archivo.
   ========================================================================== */

/* ---------- Configuración ---------- */
// [confirmar] Horario vigente con el cliente. 0 = domingo … 6 = sábado. Horas en formato 24 h.
const HORARIO = {
  0: { abre: '12:00', cierra: '16:00' },
  1: { abre: '12:00', cierra: '22:00' },
  2: { abre: '12:00', cierra: '22:00' },
  3: { abre: '12:00', cierra: '22:00' },
  4: { abre: '12:00', cierra: '22:00' },
  5: { abre: '12:00', cierra: '23:00' },
  6: { abre: '12:00', cierra: '23:00' },
};
const ZONA = 'America/Bogota';
const WHATSAPP = 'https://wa.me/573159555647?text=';
const PERSONAS = { min: 1, max: 12, inicial: 2 };

window.__edaListo = true;

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mq = (q) => window.matchMedia(q);
  const reducido = mq('(prefers-reduced-motion: reduce)');
  const escritorio = mq('(min-width: 1100px)');
  const movil = mq('(max-width: 767px)');
  const punteroFino = mq('(hover: hover) and (pointer: fine)');
  const waURL = (texto) => WHATSAPP + encodeURIComponent(texto);

  /* ---------- Fecha y hora de Bogotá ---------- */
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const aMinutos = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

  function ahoraBogota() {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
    const fecha = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
    return { fecha, minutos: (+p.hour % 24) * 60 + +p.minute };
  }
  const sumarDias = (fecha, n) => new Date(fecha.getTime() + n * 864e5);
  const isoFecha = (fecha) => fecha.toISOString().slice(0, 10);
  const desdeIso = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };

  // Formato colombiano: «12 m.», «10 p. m.», «8:30 p. m.»
  function formatoHora(min, corta = false) {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    const mm = String(m).padStart(2, '0');
    if (h === 12 && m === 0) return corta ? '12 m.' : '12:00 m.';
    const sufijo = h < 12 ? 'a. m.' : 'p. m.';
    const h12 = h % 12 || 12;
    return corta && m === 0 ? `${h12} ${sufijo}` : `${h12}:${mm} ${sufijo}`;
  }

  /* ---------- Estado «Abierto ahora», horario de hoy ---------- */
  function pintarHorario() {
    const { fecha, minutos } = ahoraBogota();
    const dia = fecha.getUTCDay();
    const hoy = HORARIO[dia];
    const abre = aMinutos(hoy.abre);
    const cierra = aMinutos(hoy.cierra);
    const estado = $('[data-estado]');
    const texto = $('[data-estado-texto]');
    if (estado && texto) {
      let frase;
      let cerrado = false;
      if (minutos >= abre && minutos < cierra) {
        frase = `Abierto ahora · cierra a las ${formatoHora(cierra, true)}`;
      } else if (minutos < abre) {
        frase = `Abrimos hoy a las ${formatoHora(abre, true)}`;
      } else {
        const manana = HORARIO[(dia + 1) % 7];
        frase = `Abrimos mañana a las ${formatoHora(aMinutos(manana.abre), true)}`;
        cerrado = true;
      }
      texto.textContent = frase;
      estado.classList.toggle('esta-cerrado', cerrado || minutos < abre);
    }
    const hoyMenu = $('[data-horario-hoy]');
    if (hoyMenu) hoyMenu.textContent = `Hoy, ${DIAS[dia]}: ${formatoHora(abre, true)} – ${formatoHora(cierra, true)}`;
    $$('[data-horario] tr[data-dias]').forEach((tr) => {
      tr.classList.toggle('es-hoy', tr.dataset.dias.split(',').map(Number).includes(dia));
    });
  }
  pintarHorario();
  setInterval(pintarHorario, 60000);

  /* ---------- Entradas al aparecer ---------- */
  const revelables = $$('.revelar, .revelar-foto, .estrella-gira');
  if ('IntersectionObserver' in window && !reducido.matches) {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('es-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revelables.forEach((el) => io.observe(el));
  } else {
    revelables.forEach((el) => el.classList.add('es-visible'));
  }

  /* ---------- Cabecera: compacta al bajar y sección actual ---------- */
  const cabecera = $('[data-cabecera]');
  const enlacesNav = $$('[data-nav]');
  function cabeceraAlBajar() { cabecera.classList.toggle('es-compacta', window.scrollY > 80); }
  if ('IntersectionObserver' in window) {
    const ioNav = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        enlacesNav.forEach((a) => {
          const actual = a.dataset.nav === e.target.id;
          a.classList.toggle('es-actual', actual);
          if (actual) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', 'casa', 'ruta', 'insignias', 'cocteleria', 'atardecer', 'espacios', 'celebra', 'resenas', 'galeria', 'visitanos']
      .forEach((id) => { const s = document.getElementById(id); if (s) ioNav.observe(s); });
  }

  /* ---------- Menú a pantalla completa ---------- */
  const menu = $('[data-menu]');
  const abrirMenu = $('[data-menu-abrir]');
  const barra = $('[data-barra-movil]');
  let ultimoFoco = null;
  $$('.menu__lista li', menu).forEach((li, i) => li.style.setProperty('--i', i));

  function enfocables() {
    return $$('a[href], button:not([disabled])', menu).filter((el) => el.offsetParent !== null);
  }
  function abrir() {
    ultimoFoco = document.activeElement;
    menu.hidden = false;
    document.body.style.overflow = 'hidden';
    abrirMenu.setAttribute('aria-expanded', 'true');
    $('main').inert = true;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('es-abierto')));
    $('[data-menu-cerrar]').focus();
    actualizarBarra();
  }
  function cerrar(devolverFoco = true) {
    menu.classList.remove('es-abierto');
    menu.hidden = true;
    document.body.style.overflow = '';
    abrirMenu.setAttribute('aria-expanded', 'false');
    $('main').inert = false;
    if (devolverFoco && ultimoFoco) ultimoFoco.focus();
    actualizarBarra();
  }
  abrirMenu.addEventListener('click', abrir);
  $('[data-menu-cerrar]').addEventListener('click', () => cerrar());
  $$('a', menu).forEach((a) => a.addEventListener('click', () => cerrar(false)));
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { cerrar(); return; }
    if (e.key !== 'Tab') return;
    const f = enfocables();
    const primero = f[0];
    const ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });
  escritorio.addEventListener('change', (e) => { if (e.matches && !menu.hidden) cerrar(false); });

  /* ---------- Barra inferior móvil ---------- */
  let reservaVisible = false;
  function actualizarBarra() {
    if (!barra) return;
    barra.classList.toggle('esta-oculta', reservaVisible || !menu.hidden);
  }
  const formReserva = $('[data-reserva]');
  if (formReserva && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { reservaVisible = e.isIntersecting; actualizarBarra(); }, { threshold: 0.08 }).observe(formReserva);
  }

  /* ---------- Arrastre con ratón para carruseles horizontales ---------- */
  function arrastrable(el, { alEmpezar, alTerminar } = {}) {
    let x0 = 0;
    let s0 = 0;
    let movido = false;
    let activo = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      activo = true; movido = false; x0 = e.clientX; s0 = el.scrollLeft;
      if (alEmpezar) alEmpezar();
    });
    window.addEventListener('pointermove', (e) => {
      if (!activo) return;
      const dx = e.clientX - x0;
      if (!movido && Math.abs(dx) > 4) { movido = true; el.classList.add('esta-arrastrando'); }
      if (movido) el.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!activo) return;
      activo = false;
      el.classList.remove('esta-arrastrando');
      if (alTerminar) alTerminar();
    });
    el.addEventListener('click', (e) => { if (movido) { e.preventDefault(); e.stopPropagation(); movido = false; } }, true);
    el.addEventListener('dragstart', (e) => e.preventDefault());
  }

  /* ---------- Bucle de desplazamiento (una sola escucha con rAF) ---------- */
  const tareas = new Set();
  let pendiente = false;
  function alDesplazar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; tareas.forEach((t) => t()); });
  }
  window.addEventListener('scroll', alDesplazar, { passive: true });
  window.addEventListener('resize', alDesplazar);
  tareas.add(cabeceraAlBajar);

  /* ---------- Héroe: el arco se abre al bajar ---------- */
  const heroe = $('[data-heroe]');
  const escena = $('.heroe__escena');
  const video = $('[data-heroe-video]');
  function escenaHeroe() {
    if (reducido.matches) { escena.style.setProperty('--p', 0); return; }
    const r = heroe.getBoundingClientRect();
    const recorrido = r.height - escena.offsetHeight;
    const p = recorrido > 0 ? clamp(-r.top / recorrido, 0, 1) : 0;
    const suave = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    escena.style.setProperty('--p', suave.toFixed(4));
    heroe.classList.toggle('texto-fuera', p > 0.35);
    const contenido = $('[data-heroe-texto]');
    contenido.style.visibility = p > 0.4 ? 'hidden' : '';
    $('[data-heroe-pista]').style.visibility = p > 0.4 ? 'hidden' : '';
  }
  if (heroe && escena) {
    tareas.add(escenaHeroe);
    escenaHeroe();
  }
  if (video && 'IntersectionObserver' in window) {
    const intentar = () => { if (!reducido.matches) video.play().catch(() => {}); };
    new IntersectionObserver(([e]) => { if (e.isIntersecting) intentar(); else video.pause(); }, { threshold: 0.1 }).observe(escena);
    video.addEventListener('error', () => video.removeAttribute('src'), true);
  }

  /* ---------- La ruta ---------- */
  const ruta = $('[data-ruta]');
  if (ruta) {
    const ventana = $('[data-ruta-ventana]', ruta);
    const riel = $('[data-ruta-riel]', ruta);
    const trazo = $('[data-ruta-trazo]', ruta);
    const base = $('.ruta__trazo-base', trazo);
    const dibujo = $('.ruta__trazo-dibujo', trazo);
    const viajera = $('[data-ruta-viajera]', ruta);
    const actual = $('[data-ruta-actual]', ruta);
    const deslizar = $('[data-ruta-deslizar]', ruta);
    const escalas = $$('.escala:not(.escala--cierre)', ruta);
    let largo = 0;
    let distancia = 0;
    let puntosX = [];
    let fijada = false;

    function trazar() {
      const rr = riel.getBoundingClientRect();
      const ancho = riel.scrollWidth;
      const alto = riel.offsetHeight;
      const puntos = escalas.map((esc) => {
        const hito = $('.escala__hito svg', esc).getBoundingClientRect();
        return [hito.left + hito.width / 2 - rr.left, hito.top + hito.height / 2 - rr.top];
      });
      if (!puntos.length) return;
      puntosX = puntos.map((p) => p[0]);
      const cierre = $('.escala--cierre', ruta).getBoundingClientRect();
      const finX = cierre.left - rr.left - 12;
      let d = `M0 ${puntos[0][1].toFixed(1)} L${puntos[0][0].toFixed(1)} ${puntos[0][1].toFixed(1)}`;
      for (let i = 1; i < puntos.length; i++) {
        const [x0, y0] = puntos[i - 1];
        const [x1, y1] = puntos[i];
        const m = (x1 - x0) / 2;
        d += ` C${(x0 + m).toFixed(1)} ${y0.toFixed(1)} ${(x1 - m).toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      }
      const ult = puntos[puntos.length - 1];
      d += ` L${Math.max(finX, ult[0]).toFixed(1)} ${ult[1].toFixed(1)}`;
      trazo.setAttribute('width', ancho);
      trazo.setAttribute('height', alto);
      trazo.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
      base.setAttribute('d', d);
      dibujo.setAttribute('d', d);
      largo = dibujo.getTotalLength();
      dibujo.style.strokeDasharray = `${largo}`;
    }

    function medir() {
      fijada = escritorio.matches && !reducido.matches;
      ruta.classList.toggle('esta-fijada', fijada);
      riel.style.removeProperty('--riel-x');
      if (fijada) {
        distancia = Math.max(0, riel.scrollWidth - ventana.clientWidth);
        ruta.style.height = `${window.innerHeight + distancia}px`;
      } else {
        ruta.style.height = '';
        distancia = Math.max(0, ventana.scrollWidth - ventana.clientWidth);
      }
      trazar();
      avanzar();
    }

    function colocar(p) {
      if (!largo) return;
      const punto = dibujo.getPointAtLength(largo * p);
      viajera.style.setProperty('--vx', `${punto.x}px`);
      viajera.style.setProperty('--vy', `${punto.y}px`);
      dibujo.style.strokeDashoffset = `${largo * (1 - p)}`;
      let indice = 0;
      puntosX.forEach((x, i) => { if (punto.x >= x - 40) indice = i; });
      const txt = String(indice + 1).padStart(2, '0');
      if (actual.textContent !== txt) actual.textContent = txt;
    }

    function avanzar() {
      let p;
      if (fijada) {
        const r = ruta.getBoundingClientRect();
        p = distancia > 0 ? clamp(-r.top / distancia, 0, 1) : 0;
        riel.style.setProperty('--riel-x', `${(-p * distancia).toFixed(1)}px`);
      } else {
        p = distancia > 0 ? clamp(ventana.scrollLeft / distancia, 0, 1) : 0;
      }
      colocar(p);
    }

    tareas.add(() => { if (fijada) avanzar(); });
    ventana.addEventListener('scroll', () => {
      if (fijada) return;
      requestAnimationFrame(avanzar);
      if (deslizar && ventana.scrollLeft > 30) {
        deslizar.classList.add('esta-oculta');
        try { localStorage.setItem('eda-desliza', '1'); } catch (e) { /* sin almacenamiento */ }
      }
    }, { passive: true });
    try { if (localStorage.getItem('eda-desliza') && deslizar) deslizar.hidden = true; } catch (e) { /* sin almacenamiento */ }
    arrastrable(ventana);

    let espera;
    const remedir = () => { clearTimeout(espera); espera = setTimeout(medir, 150); };
    window.addEventListener('resize', remedir);
    escritorio.addEventListener('change', medir);
    reducido.addEventListener('change', medir);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    window.addEventListener('load', medir);
    medir();
  }

  /* ---------- Parrilla: la foto sigue al cursor ---------- */
  const parrilla = $('[data-parrilla]');
  const fotoCursor = $('[data-foto-cursor]');
  if (parrilla && fotoCursor) {
    const img = $('img', fotoCursor);
    let objetivo = { x: 0, y: 0 };
    let pos = { x: 0, y: 0 };
    let activo = false;
    let corriendo = false;
    function seguir() {
      const dx = objetivo.x - pos.x;
      pos.x += dx * 0.18;
      pos.y += (objetivo.y - pos.y) * 0.18;
      fotoCursor.style.setProperty('--fx', `${pos.x}px`);
      fotoCursor.style.setProperty('--fy', `${pos.y}px`);
      fotoCursor.style.setProperty('--fr', `${clamp(dx * 0.08, -7, 7) + 3}deg`);
      if (activo || Math.abs(dx) > 0.5) requestAnimationFrame(seguir); else corriendo = false;
    }
    parrilla.addEventListener('pointermove', (e) => {
      if (!punteroFino.matches || e.pointerType !== 'mouse') return;
      const fila = e.target.closest('[data-foto]');
      objetivo = { x: e.clientX + 28, y: e.clientY - 150 };
      if (!activo) { pos = { ...objetivo }; }
      if (fila) {
        if (img.getAttribute('src') !== fila.dataset.foto) img.src = fila.dataset.foto;
        img.alt = '';
        activo = true;
        fotoCursor.classList.add('es-visible');
        if (!corriendo) { corriendo = true; requestAnimationFrame(seguir); }
      }
    });
    parrilla.addEventListener('pointerleave', () => { activo = false; fotoCursor.classList.remove('es-visible'); });
    window.addEventListener('scroll', () => { if (activo) { activo = false; fotoCursor.classList.remove('es-visible'); } }, { passive: true });
  }

  /* ---------- Carrusel de cócteles ---------- */
  const carrusel = $('[data-carrusel]');
  if (carrusel) {
    const lista = $('[data-carrusel-lista]', carrusel);
    const prev = $('[data-carrusel-prev]', carrusel);
    const next = $('[data-carrusel-next]', carrusel);
    const paso = () => { const c = $('.coctel', lista); return c ? (c.offsetWidth + 20) * 2 : 300; };
    const comportamiento = () => (reducido.matches ? 'auto' : 'smooth');
    prev.addEventListener('click', () => lista.scrollBy({ left: -paso(), behavior: comportamiento() }));
    next.addEventListener('click', () => lista.scrollBy({ left: paso(), behavior: comportamiento() }));
    const estado = () => {
      prev.disabled = lista.scrollLeft < 8;
      next.disabled = lista.scrollLeft > lista.scrollWidth - lista.clientWidth - 8;
    };
    lista.addEventListener('scroll', () => requestAnimationFrame(estado), { passive: true });
    window.addEventListener('resize', estado);
    estado();
    arrastrable(lista);
    $$('.coctel', lista).forEach((c) => {
      c.addEventListener('click', () => {
        if (punteroFino.matches) return;
        const abierto = c.classList.contains('esta-abierto');
        $$('.coctel.esta-abierto', lista).forEach((o) => o.classList.remove('esta-abierto'));
        if (!abierto) c.classList.add('esta-abierto');
      });
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.classList.toggle('esta-abierto'); } });
    });
  }

  /* ---------- Atardecer: el sol desciende ---------- */
  const atardecer = $('[data-atardecer]');
  const sol = $('[data-sol]');
  if (atardecer && sol) {
    tareas.add(() => {
      if (reducido.matches) { sol.style.setProperty('--sol-y', '0%'); return; }
      const r = atardecer.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      const bajada = clamp((p - 0.38) / 0.5, 0, 1) * 82;
      sol.style.setProperty('--sol-y', `${bajada.toFixed(2)}%`);
    });
  }

  /* ---------- Celebra: la ficha cambia el mensaje ---------- */
  const celebra = $('[data-celebra]');
  const botonCelebra = $('[data-celebra-btn]');
  if (celebra && botonCelebra) {
    celebra.addEventListener('change', (e) => {
      const ocasion = e.target.value;
      botonCelebra.href = waURL(`Hola, Elena de Arco. Quiero celebrar ${ocasion} con ustedes. ¿Me cuentan cómo reservar?`);
    });
  }

  /* ---------- Reseñas ---------- */
  const resenas = $('[data-resenas]');
  if (resenas) {
    const citas = $$('[data-resena]', resenas);
    const actualR = $('[data-resenas-actual]', resenas);
    $('[data-resenas-total]', resenas).textContent = citas.length;
    let i = 0;
    let temporizador = null;
    let pausado = false;
    const mostrar = (n) => {
      i = (n + citas.length) % citas.length;
      citas.forEach((c, k) => {
        c.classList.toggle('es-activa', k === i);
        c.setAttribute('aria-hidden', k === i ? 'false' : 'true');
      });
      actualR.textContent = i + 1;
    };
    const programar = () => {
      clearInterval(temporizador);
      if (reducido.matches || citas.length < 2) return;
      temporizador = setInterval(() => { if (!pausado && !document.hidden) mostrar(i + 1); }, 7000);
    };
    $('[data-resenas-prev]', resenas).addEventListener('click', () => { mostrar(i - 1); programar(); });
    $('[data-resenas-next]', resenas).addEventListener('click', () => { mostrar(i + 1); programar(); });
    resenas.addEventListener('mouseenter', () => { pausado = true; });
    resenas.addEventListener('mouseleave', () => { pausado = false; });
    resenas.addEventListener('focusin', () => { pausado = true; });
    resenas.addEventListener('focusout', () => { pausado = false; });
    let x0 = null;
    const listaR = $('[data-resenas-lista]', resenas);
    listaR.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
    listaR.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) { mostrar(dx < 0 ? i + 1 : i - 1); programar(); }
    });
    mostrar(0);
    programar();
  }

  /* ---------- Galería: dos cintas en sentidos opuestos ---------- */
  $$('[data-galeria]').forEach((fila) => {
    const cinta = $('.galeria__cinta', fila);
    const originales = Array.from(cinta.children);
    originales.forEach((li) => {
      const copia = li.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      $$('img', copia).forEach((im) => { im.alt = ''; });
      cinta.appendChild(copia);
    });
    const sentido = Number(fila.dataset.galeria) || 1;
    let pos = 0;
    let visible = false;
    let pausa = false;
    let reanudar = null;
    const mitad = () => cinta.scrollWidth / 2;
    const ajustar = () => { const m = mitad(); if (pos >= m) pos -= m; if (pos < 0) pos += m; };
    function paso() {
      if (visible && !pausa && !reducido.matches) {
        pos += 0.35 * sentido;
        ajustar();
        fila.scrollLeft = pos;
      }
      requestAnimationFrame(paso);
    }
    const pausar = () => { pausa = true; clearTimeout(reanudar); };
    const seguir = (ms = 0) => { clearTimeout(reanudar); reanudar = setTimeout(() => { pos = fila.scrollLeft; pausa = false; }, ms); };
    fila.addEventListener('mouseenter', pausar);
    fila.addEventListener('mouseleave', () => seguir(0));
    fila.addEventListener('focusin', pausar);
    fila.addEventListener('focusout', () => seguir(0));
    fila.addEventListener('touchstart', pausar, { passive: true });
    fila.addEventListener('touchend', () => seguir(2500), { passive: true });
    fila.addEventListener('scroll', () => {
      if (pausa) {
        const m = mitad();
        if (fila.scrollLeft >= m) fila.scrollLeft -= m;
        else if (fila.scrollLeft <= 0) fila.scrollLeft += m;
      }
    }, { passive: true });
    arrastrable(fila, { alEmpezar: pausar, alTerminar: () => seguir(1200) });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(fila);
    } else visible = true;
    requestAnimationFrame(() => {
      if (sentido < 0) { pos = mitad() - 1; fila.scrollLeft = pos; }
      paso();
    });
  });

  /* ---------- Reserva ---------- */
  if (formReserva) {
    const estado = { personas: PERSONAS.inicial, dia: 'hoy', fecha: null, hora: null };
    const valorPersonas = $('[data-personas-valor]', formReserva);
    const botonesPersonas = $$('[data-personas]', formReserva);
    const contDia = $('[data-dia]', formReserva);
    const campoFecha = $('[data-fecha-campo]', formReserva);
    const inputFecha = $('[data-fecha]', formReserva);
    const contHoras = $('[data-horas]', formReserva);
    const ocasion = $('[data-ocasion]', formReserva);
    const nombre = $('[data-nombre]', formReserva);
    const resumen = $('[data-resumen]', formReserva);
    const textoOculto = $('[data-reserva-texto]', formReserva);
    const errorHora = $('[data-error-hora]', formReserva);
    const errorNombre = $('[data-error-nombre]', formReserva);

    const hoyBogota = () => ahoraBogota().fecha;
    inputFecha.min = isoFecha(hoyBogota());
    inputFecha.max = isoFecha(sumarDias(hoyBogota(), 90));

    function fechaElegida() {
      const hoy = hoyBogota();
      if (estado.dia === 'hoy') return hoy;
      if (estado.dia === 'manana') return sumarDias(hoy, 1);
      return estado.fecha ? desdeIso(estado.fecha) : null;
    }

    function horasDisponibles(fecha) {
      if (!fecha) return [];
      const h = HORARIO[fecha.getUTCDay()];
      const desde = aMinutos(h.abre);
      const ultima = aMinutos(h.cierra) - 60;
      const { fecha: hoy, minutos } = ahoraBogota();
      const esHoy = isoFecha(fecha) === isoFecha(hoy);
      const lista = [];
      for (let m = desde; m <= ultima; m += 30) if (!esHoy || m > minutos + 15) lista.push(m);
      return lista;
    }

    function pintarHoras() {
      const fecha = fechaElegida();
      contHoras.textContent = '';
      if (!fecha) {
        contHoras.innerHTML = '<p class="reserva__ayuda">Elige la fecha para ver las horas disponibles.</p>';
        estado.hora = null;
        return;
      }
      const horas = horasDisponibles(fecha);
      if (!horas.length) {
        contHoras.innerHTML = '<p class="reserva__ayuda">Hoy ya no quedan horas para reservar. Elige otro día.</p>';
        estado.hora = null;
        return;
      }
      if (!horas.includes(estado.hora)) estado.hora = null;
      const frag = document.createDocumentFragment();
      horas.forEach((m) => {
        const label = document.createElement('label');
        label.className = 'ficha';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'hora-reserva';
        input.value = String(m);
        input.checked = m === estado.hora;
        const span = document.createElement('span');
        span.textContent = formatoHora(m);
        label.append(input, span);
        frag.appendChild(label);
      });
      contHoras.appendChild(frag);
    }

    function etiquetaDia(fecha, larga) {
      if (!fecha) return '';
      const dia = DIAS[fecha.getUTCDay()];
      if (!larga && estado.dia !== 'otro') return estado.dia === 'hoy' ? `hoy, ${dia}` : `mañana, ${dia}`;
      return `${dia} ${fecha.getUTCDate()} de ${MESES[fecha.getUTCMonth()]}`;
    }

    function mensaje() {
      const fecha = fechaElegida();
      const n = estado.personas;
      let t = `Hola, Elena de Arco. Quiero reservar una mesa para ${n} ${n === 1 ? 'persona' : 'personas'}`;
      if (fecha) t += ` el ${etiquetaDia(fecha, true)}`;
      if (estado.hora !== null) t += ` a las ${formatoHora(estado.hora)}`;
      if (!t.endsWith('.')) t += '.';
      const nom = nombre.value.trim();
      if (nom) t += ` A nombre de ${nom}.`;
      if (ocasion.value) t += ` Ocasión: ${ocasion.value.toLowerCase()}.`;
      return t;
    }

    function actualizar() {
      valorPersonas.textContent = estado.personas;
      botonesPersonas[0].disabled = estado.personas <= PERSONAS.min;
      botonesPersonas[1].disabled = estado.personas >= PERSONAS.max;
      const fecha = fechaElegida();
      const partes = [`Mesa para ${estado.personas}`];
      if (fecha) partes.push(estado.dia === 'otro' ? etiquetaDia(fecha, true) : DIAS[fecha.getUTCDay()]);
      if (estado.hora !== null) partes.push(formatoHora(estado.hora));
      resumen.textContent = partes.join(' · ');
      textoOculto.value = mensaje();
    }

    botonesPersonas.forEach((b) => b.addEventListener('click', () => {
      estado.personas = clamp(estado.personas + Number(b.dataset.personas), PERSONAS.min, PERSONAS.max);
      actualizar();
    }));
    contDia.addEventListener('change', (e) => {
      estado.dia = e.target.value;
      campoFecha.hidden = estado.dia !== 'otro';
      if (estado.dia === 'otro') {
        if (!estado.fecha) estado.fecha = isoFecha(sumarDias(hoyBogota(), 2));
        inputFecha.value = estado.fecha;
        inputFecha.focus();
        try { if (inputFecha.showPicker) inputFecha.showPicker(); } catch (err) { /* el navegador no lo permite */ }
      }
      pintarHoras();
      actualizar();
    });
    inputFecha.addEventListener('change', () => {
      estado.fecha = inputFecha.value || null;
      pintarHoras();
      actualizar();
    });
    contHoras.addEventListener('change', (e) => {
      estado.hora = Number(e.target.value);
      errorHora.hidden = true;
      actualizar();
    });
    ocasion.addEventListener('change', actualizar);
    nombre.addEventListener('input', () => {
      if (nombre.value.trim()) { errorNombre.hidden = true; nombre.removeAttribute('aria-invalid'); }
      actualizar();
    });

    formReserva.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      if (estado.hora === null) { errorHora.hidden = false; ok = false; }
      if (!nombre.value.trim()) { errorNombre.hidden = false; nombre.setAttribute('aria-invalid', 'true'); ok = false; }
      if (!ok) {
        const primero = estado.hora === null ? contHoras.querySelector('input') || contHoras : nombre;
        primero.focus();
        return;
      }
      actualizar();
      window.open(waURL(mensaje()), '_blank', 'noopener');
    });

    // Si hoy ya no quedan horas, se propone mañana.
    if (!horasDisponibles(hoyBogota()).length) {
      estado.dia = 'manana';
      $('input[value="manana"]', contDia).checked = true;
    }
    pintarHoras();
    actualizar();
  }

  /* ---------- Primer pintado ---------- */
  cabeceraAlBajar();
  actualizarBarra();
  reducido.addEventListener('change', alDesplazar);
})();
