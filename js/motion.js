/**
 * Chuyển động trang chủ.
 * Bước 1: Lenis + hero. Bước 2: ảnh lớn lộ dần + tiêu đề section.
 */

let lenis = null;
let khungMedia = null;
let khungNoiDung = null;
let daDon = false;
let daGanNeo = false;
let theHeNoiDung = 0;
const anhDaGan = new WeakMap();
const tieuDeDaGan = new WeakMap();
const cacTach = [];
let batchSanPham = [];
const theDaHien = new WeakSet();
const chuNutGoc = new WeakMap();
const henNut = new WeakMap();
let daGanChiTiet = false;

function giamChuyenDong() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function hienChuHero() {
  document.documentElement.classList.remove('js-motion');
}

function chieuCaoNav() {
  const nav = document.querySelector('.main-nav');
  return nav ? nav.getBoundingClientRect().height : 0;
}

function cungTrang(url) {
  const ten = (path) => {
    const file = path.split('/').pop() || 'index';
    return file.replace(/\.html$/i, '') || 'index';
  };
  return ten(location.pathname) === ten(url.pathname);
}

function batLenis() {
  if (lenis || !window.Lenis || !window.gsap || !window.ScrollTrigger) return;

  lenis = new window.Lenis({
    autoRaf: false,
    duration: 1.15,
    smoothWheel: true,
    prevent: (node) =>
      Boolean(
        node?.classList?.contains('ask-log') ||
          (node?.classList?.contains('carousel-track') &&
            window.matchMedia('(max-width: 767px)').matches) ||
          (node?.classList?.contains('main-nav') && node.classList.contains('open')),
      ),
  });

  lenis.on('scroll', window.ScrollTrigger.update);
  lenis.on('scroll', (instance) => {
    const header = document.getElementById('site-header');
    if (!header) return;
    header.classList.toggle('header-rut', instance.scroll > 40);
  });

  window.gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  window.gsap.ticker.lagSmoothing(0);

  if (!daGanNeo) {
    daGanNeo = true;
    document.addEventListener('click', cuonToiNeo);
  }
}

function cuonToiNeo(suKien) {
  if (!lenis) return;
  if (suKien.defaultPrevented || suKien.button !== 0) return;
  if (suKien.metaKey || suKien.ctrlKey || suKien.shiftKey || suKien.altKey) return;

  const the = suKien.target.closest?.('a[href]');
  if (!the || (the.target && the.target !== '_self')) return;

  const href = the.getAttribute('href');
  if (!href || !href.includes('#')) return;

  let url;
  try {
    url = new URL(href, location.href);
  } catch {
    return;
  }
  if (!cungTrang(url) || !url.hash || url.hash === '#') return;

  const dich = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!dich) return;

  suKien.preventDefault();
  lenis.scrollTo(dich, { offset: -chieuCaoNav() });
  history.pushState(null, '', url.hash);
}

function moHeroMayTinh() {
  const { gsap, SplitText } = window;
  const section = document.getElementById('bo-suu-tap');
  const anh = document.getElementById('anh-hero');
  const tieuDe = section?.querySelector('.hero-title');
  const nut = section?.querySelector('.btn-hero');
  if (!section || !anh || !tieuDe || !nut || !SplitText) return;

  gsap.set([tieuDe, nut], { autoAlpha: 1 });
  gsap.set(anh, { scale: 1.15, transformOrigin: 'center center' });
  gsap.to(anh, { scale: 1, duration: 2.2, ease: 'power3.out' });

  const tach = SplitText.create(tieuDe, {
    type: 'chars',
    mask: 'chars',
    charsClass: 'hero-char',
    aria: 'auto',
    autoSplit: true,
    onSplit(self) {
      return gsap.fromTo(
        self.chars,
        { yPercent: 110 },
        { yPercent: 0, duration: 1.15, ease: 'power3.out', stagger: 0.04 },
      );
    },
  });

  gsap.fromTo(
    nut,
    { autoAlpha: 0, y: 20 },
    { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.55 },
  );

  gsap.to(anh, {
    yPercent: 15,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
  gsap.to(section.querySelector('.home-hero-copy'), {
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });

  return () => tach.revert();
}

function moHeroDienThoai() {
  const { gsap } = window;
  const section = document.getElementById('bo-suu-tap');
  const tieuDe = section?.querySelector('.hero-title');
  const nut = section?.querySelector('.btn-hero');
  if (!tieuDe || !nut) return;

  gsap.set([tieuDe, nut], { autoAlpha: 1 });
  gsap.fromTo(
    [tieuDe, nut],
    { autoAlpha: 0, y: 12 },
    { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 },
  );
}

function ganMotAnh(hop, mayTinh) {
  const anh = hop.querySelector('img');
  if (!anh || anhDaGan.get(hop) === theHeNoiDung) return;
  anhDaGan.set(hop, theHeNoiDung);
  const { gsap } = window;

  if (!mayTinh) {
    gsap.fromTo(
      anh,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: hop, start: 'top 85%' },
      },
    );
    return;
  }

  gsap.set(anh, { transformOrigin: 'center center' });
  gsap.fromTo(
    anh,
    { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.1 },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      scale: 1,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: hop, start: 'top 80%' },
    },
  );
  gsap.fromTo(
    hop,
    { yPercent: -8 },
    {
      yPercent: 8,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: {
        trigger: hop,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    },
  );
}

function ganTieuDe(el, mayTinh) {
  if (tieuDeDaGan.get(el) === theHeNoiDung || el.closest('[hidden]')) return;
  tieuDeDaGan.set(el, theHeNoiDung);
  const { gsap, SplitText } = window;

  if (!mayTinh || !SplitText) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      },
    );
    return;
  }

  const tach = SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'fq-dong',
    aria: 'auto',
    onSplit(self) {
      return gsap.fromTo(
        self.lines,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 80%' },
        },
      );
    },
  });
  cacTach.push(tach);
}

function donNoiDung() {
  huyBatchSanPham();
  cacTach.splice(0).forEach((tach) => {
    try {
      tach.revert();
    } catch {
      /* SplitText đã gỡ */
    }
  });
  khungNoiDung?.revert();
  khungNoiDung = null;
  theHeNoiDung += 1;
}

function ganCauViet(mayTinh) {
  const section = document.getElementById('cau-viet-cham');
  const dong = section?.querySelector('.home-quote-line');
  const phu = section?.querySelector('.home-quote-sub');
  if (!section || !dong || tieuDeDaGan.get(section) === theHeNoiDung) return;
  tieuDeDaGan.set(section, theHeNoiDung);
  const { gsap, SplitText } = window;
  const net = section.querySelector('.quote-stroke');

  if (net && mayTinh && window.DrawSVGPlugin) {
    gsap.set(dong, { autoAlpha: 0 });
    gsap.fromTo(
      net,
      { drawSVG: '0%' },
      {
        drawSVG: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          end: 'center 45%',
          scrub: true,
        },
      },
    );
  } else if (mayTinh && SplitText) {
    const tach = SplitText.create(dong, {
      type: 'chars',
      mask: 'chars',
      autoSplit: true,
      onSplit(self) {
        return gsap.fromTo(
          self.chars,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1.2,
            ease: 'power3.out',
            stagger: 0.06,
            scrollTrigger: { trigger: section, start: 'top 80%' },
          },
        );
      },
    });
    cacTach.push(tach);
  } else {
    gsap.fromTo(
      dong,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 85%' },
      },
    );
  }

  if (!phu) return;
  gsap.fromTo(
    phu,
    { autoAlpha: 0, y: 12 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: mayTinh ? 'top 60%' : 'top 85%' },
    },
  );
}

function ganCheTac(mayTinh) {
  const section = document.getElementById('che-tac');
  if (!section || tieuDeDaGan.get(section) === theHeNoiDung) return;
  tieuDeDaGan.set(section, theHeNoiDung);

  const steps = [...section.querySelectorAll('.che-tac-step')];
  const photos = [...section.querySelectorAll('.che-tac-photo')];
  const { gsap } = window;
  if (!steps.length || !photos.length) return;

  if (!mayTinh) {
    gsap.fromTo(
      [...steps, ...photos],
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 85%' },
      },
    );
    return;
  }

  const nav = Math.round(chieuCaoNav());
  section.style.setProperty('--nav-h', `${nav}px`);
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: `top top+=${nav}`,
      end: () => '+=' + Math.round(window.innerHeight * 3),
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });

  for (let i = 1; i < steps.length; i += 1) {
    tl.to(photos[i - 1], { opacity: 0, duration: 0.5, ease: 'none' }, i)
      .to(photos[i], { opacity: 1, duration: 0.5, ease: 'none' }, i)
      .to(steps[i - 1], { opacity: 0.3, duration: 0.5, ease: 'none' }, i)
      .to(steps[i], { opacity: 1, duration: 0.5, ease: 'none' }, i);
  }
}

function ganCuonNgang(mayTinh) {
  const section = document.getElementById('san-pham-tieu-bieu');
  const track = document.getElementById('bang-tieu-bieu');
  if (!section || !track) return;
  section.classList.remove('cuon-ngang');
  if (!mayTinh) return;

  const khoang = () => {
    const cuaSo = track.parentElement;
    const rongCuaSo = cuaSo?.clientWidth || track.clientWidth;
    return Math.max(0, track.scrollWidth - rongCuaSo);
  };

  section.classList.add('cuon-ngang');
  if (khoang() < 8) {
    section.classList.remove('cuon-ngang');
    return;
  }

  const { gsap } = window;
  gsap.to(track, {
    x: () => -khoang(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: () => `top top+=${Math.round(chieuCaoNav())}`,
      end: () => `+=${khoang()}`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}

function laManHinhNang() {
  return (
    window.matchMedia('(min-width: 768px)').matches &&
    window.matchMedia('(pointer: fine)').matches &&
    !giamChuyenDong()
  );
}

function vungGiuConTro(el) {
  return Boolean(el?.closest?.('input, textarea, select, [contenteditable], .chat-dock, .chat-panel'));
}

function batConTro() {
  if (!laManHinhNang() || document.querySelector('.con-tro')) return;
  const { gsap } = window;
  const cham = document.createElement('div');
  cham.className = 'con-tro';
  cham.setAttribute('aria-hidden', 'true');
  cham.innerHTML = '<span class="con-tro-cham"></span><span class="con-tro-chu">XEM</span>';
  document.body.appendChild(cham);
  document.documentElement.classList.add('con-tro-bat');

  const xDen = gsap.quickTo(cham, 'x', { duration: 0.4, ease: 'power3.out' });
  const yDen = gsap.quickTo(cham, 'y', { duration: 0.4, ease: 'power3.out' });

  window.addEventListener('pointermove', (e) => {
    xDen(e.clientX);
    yDen(e.clientY);
    const giu = vungGiuConTro(e.target);
    document.documentElement.classList.toggle('con-tro-tat', giu);
    const anh = !giu && e.target.closest?.('.product-card .product-thumb');
    cham.classList.toggle('con-tro-xem', Boolean(anh));
  });
}

function batNamCham() {
  if (!laManHinhNang()) return;
  const { gsap } = window;
  document.addEventListener('pointermove', (e) => {
    const nut = e.target.closest?.('.btn, .btn-hero');
    if (!nut || nut.disabled || vungGiuConTro(nut)) return;
    const hop = nut.getBoundingClientRect();
    const lechX = e.clientX - (hop.left + hop.width / 2);
    const lechY = e.clientY - (hop.top + hop.height / 2);
    gsap.to(nut, {
      x: gsap.utils.clamp(-6, 6, lechX * 0.2),
      y: gsap.utils.clamp(-6, 6, lechY * 0.2),
      duration: 0.35,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  });
  document.addEventListener('pointerout', (e) => {
    const nut = e.target.closest?.('.btn, .btn-hero');
    if (!nut || nut.contains(e.relatedTarget)) return;
    gsap.to(nut, { x: 0, y: 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
  });
}

function huyBatchSanPham() {
  batchSanPham.forEach((moc) => moc.kill());
  batchSanPham = [];
}

export function capNhatTheSanPham() {
  huyBatchSanPham();
  if (!window.gsap || !window.ScrollTrigger || !laManHinhNang()) return;
  const { gsap, ScrollTrigger } = window;
  const moi = gsap.utils.toArray('.product-card').filter((the) => !theDaHien.has(the));
  if (!moi.length) return;
  gsap.set(moi, { opacity: 0, y: 30 });
  batchSanPham = ScrollTrigger.batch(moi, {
    start: 'top 88%',
    once: true,
    onEnter: (nhom) => {
      nhom.forEach((the) => theDaHien.add(the));
      gsap.to(nhom, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.08,
        overwrite: 'auto',
      });
    },
  });
}

export function hienNutDaThem(nut) {
  if (!nut) return;
  const cu = henNut.get(nut);
  if (cu) clearTimeout(cu);
  if (!chuNutGoc.has(nut)) chuNutGoc.set(nut, nut.textContent.trim());
  nut.innerHTML = '<i data-lucide="check" aria-hidden="true"></i>';
  window.lucide?.createIcons();
  henNut.set(
    nut,
    setTimeout(() => {
      nut.textContent = chuNutGoc.get(nut) || 'Thêm vào giỏ';
      henNut.delete(nut);
    }, 1200),
  );
}

function ganNoiDung() {
  const mayTinh = window.matchMedia('(min-width: 768px)').matches;
  const { gsap } = window;
  if (!khungNoiDung) khungNoiDung = gsap.context(() => {});

  khungNoiDung.add(() => {
    document.querySelectorAll('.media-parallax').forEach((hop) => ganMotAnh(hop, mayTinh));
    document.querySelectorAll('.fq-section-title').forEach((el) => ganTieuDe(el, mayTinh));
    ganCauViet(mayTinh);
    ganCheTac(mayTinh);
    ganCuonNgang(mayTinh);
    if (mayTinh && window.matchMedia('(pointer: fine)').matches) capNhatTheSanPham();
  });
}

/** Lenis + hero, chạy khi DOM sẵn sàng. Không chờ API. */
export function khoiDongChuyenDong() {
  if (giamChuyenDong() || !window.gsap || !window.ScrollTrigger || !window.SplitText) {
    hienChuHero();
    return;
  }

  try {
    window.gsap.registerPlugin(window.ScrollTrigger, window.SplitText, window.DrawSVGPlugin);
    batLenis();

    khungMedia?.revert();
    donNoiDung();
    khungMedia = window.gsap.matchMedia();
    khungMedia.add('(min-width: 768px)', () => {
      const don = moHeroMayTinh();
      ganNoiDung();
      return () => {
        don?.();
        donNoiDung();
      };
    });
    khungMedia.add('(max-width: 767px)', () => {
      moHeroDienThoai();
      ganNoiDung();
      return () => donNoiDung();
    });

    document.fonts?.ready.then(() => lamMoiChuyenDong());
    if (!daGanChiTiet) {
      daGanChiTiet = true;
      batConTro();
      batNamCham();
    }

    if (!daDon) {
      daDon = true;
      window.addEventListener('pagehide', () => {
        khungMedia?.revert();
        khungNoiDung?.revert();
        lenis?.destroy();
        lenis = null;
      });
    }
  } catch {
    hienChuHero();
  }
}

/** Sau khi lưới vẽ xong, hoặc khi font Cormorant tải xong. */
export function lamMoiChuyenDong() {
  if (giamChuyenDong() || !window.gsap) {
    hienChuHero();
    return;
  }
  donNoiDung();
  ganNoiDung();
  window.ScrollTrigger?.refresh();
  lenis?.resize();
}
