/* ══ NAVBAR ═══════════════════════════════════════════════════════════════════ */

function renderNav() {
  const p = State.page, u = State.user, count = State.cartCount();
  return `
    <nav class="nav">
      <div class="nav-logo" onclick="navigate('home')">
        ${svgIcon('leaf',20,'var(--brown2)')} Flour &amp; Bloom
      </div>
      <div class="nav-links">
        <button class="nav-link${p==='home'?' active':''}" onclick="navigate('home')">${svgIcon('home',16)} Home</button>
        <button class="nav-link${p==='menu'?' active':''}" onclick="navigate('menu')">${svgIcon('menu',16)} Menu</button>
        <button class="nav-link${p==='orders'?' active':''}" onclick="navigate('orders')">${svgIcon('orders',16)} Orders</button>
        ${u ? `
          <button class="nav-link${p==='admin'?' active':''}" onclick="navigate('admin')">${svgIcon('admin',16)} Admin</button>
          <button class="nav-link" onclick="logout()">${svgIcon('logout',16)} Logout</button>
        ` : `
          <button class="nav-link${p==='auth'?' active':''}" onclick="navigate('auth')">${svgIcon('user',16)} Login</button>
        `}
      </div>
      <button class="nav-cart" onclick="navigate('cart')">
        ${svgIcon('cart',16)} Cart
        <span class="cart-badge" style="display:${count>0?'flex':'none'}">${count}</span>
      </button>
    </nav>`;
}

function renderBottomNav() {
  const p = State.page, count = State.cartCount();
  return `
    <div class="bottom-nav">
      <button class="bottom-nav-item${p==='home'?' active':''}" onclick="navigate('home')">${svgIcon('home',22)}<span>Home</span></button>
      <button class="bottom-nav-item${p==='menu'?' active':''}" onclick="navigate('menu')">${svgIcon('menu',22)}<span>Menu</span></button>
      <button class="bottom-nav-item${p==='cart'?' active':''}" onclick="navigate('cart')" style="position:relative">
        ${svgIcon('cart',22)}
        <span class="cart-badge" style="display:${count>0?'flex':'none'};position:absolute;top:0;right:4px">${count}</span>
        <span>Cart</span>
      </button>
      <button class="bottom-nav-item${p==='orders'?' active':''}" onclick="navigate('orders')">${svgIcon('orders',22)}<span>Orders</span></button>
      <button class="bottom-nav-item${p==='auth'?' active':''}" onclick="navigate('auth')">${svgIcon('user',22)}<span>Account</span></button>
    </div>`;
}

/* ══ ROUTER ═══════════════════════════════════════════════════════════════════ */

function renderPageContent() {
  switch (State.page) {
    case 'home':         return renderHome();
    case 'menu':         return renderMenu();
    case 'item':         return renderItem();
    case 'cart':         return renderCart();
    case 'schedule':     return renderSchedule();
    case 'checkout':     return renderCheckout();
    case 'confirmation': return renderConfirmation();
    case 'orders':       return renderOrders();
    case 'auth':         return renderAuth();
    case 'admin':        return renderAdmin();
    default:             return renderHome();
  }
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML =
    renderNav() +
    `<main id="main-content">${renderPageContent()}</main>` +
    renderBottomNav() +
    `<div class="toast-container" id="toast-container"></div>`;

  attachCardEvents(document.getElementById('main-content'));

  if (State.page === 'home') {
    requestAnimationFrame(initCupcake);
  }
}

/* ══ EVENT DELEGATION ════════════════════════════════════════════════════════ */

function attachCardEvents(root) {
  if (!root) return;
  root.querySelectorAll('.food-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.food-card-add')) return;
      const item = MENU_ITEMS.find(i => i.id === parseInt(card.dataset.id));
      if (item) { State.selectedItem = item; State.itemQty = 1; navigate('item'); }
    });
  });
  root.querySelectorAll('.food-card-add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const item = MENU_ITEMS.find(i => i.id === parseInt(btn.dataset.addId));
      if (item) {
        addToCart(item);
        const card = btn.closest('.food-card');
        if (card) {
          card.classList.remove('popping');
          void card.offsetWidth; // reflow
          card.classList.add('popping');
        }
      }
    });
  });
}

/* ══ AUTH ════════════════════════════════════════════════════════════════════ */

function logout() {
  State.user = null;
  showToast('Logged out successfully');
  navigate('home');
}

/* ══ THREE.JS 3D CUPCAKE ═════════════════════════════════════════════════════ */

function initCupcake() {
  if (typeof THREE === 'undefined') return;

  const wrap = document.getElementById('cupcake-canvas-wrap');
  if (!wrap || wrap.dataset.init) return;
  wrap.dataset.init = '1';

  const W = 220, H = 220;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 1.8, 5);
  camera.lookAt(0, 0.5, 0);

  // ── Lighting ──
  scene.add(new THREE.AmbientLight(0xfff5e6, 0.85));
  const dir = new THREE.DirectionalLight(0xfff0d0, 1.4);
  dir.position.set(3, 5, 3);
  dir.castShadow = true;
  scene.add(dir);
  const pt = new THREE.PointLight(0xc4956a, 0.5, 12);
  pt.position.set(-2, 3, 2);
  scene.add(pt);

  const group = new THREE.Group();
  scene.add(group);

  // ── Cupcake wrapper (cup) ──
  const wrapGeo = new THREE.CylinderGeometry(0.70, 0.50, 1.0, 32, 1, false);
  const wrapMat = new THREE.MeshStandardMaterial({ color: 0x8B6343, roughness: 0.8, metalness: 0.05 });
  const cup = new THREE.Mesh(wrapGeo, wrapMat);
  cup.position.y = -0.2;
  cup.castShadow = true;
  cup.receiveShadow = true;
  group.add(cup);

  // Decorative ridges on cup
  for (let i = 0; i < 10; i++) {
    const rGeo = new THREE.TorusGeometry(0.618 - i * 0.013, 0.013, 8, 32);
    const rMat = new THREE.MeshStandardMaterial({ color: 0x6B4C30, roughness: 0.85 });
    const ridge = new THREE.Mesh(rGeo, rMat);
    ridge.rotation.x = Math.PI / 2;
    ridge.position.y = -0.65 + i * 0.13;
    group.add(ridge);
  }

  // ── Sponge base ──
  const baseGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.36, 32);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xD4956A, roughness: 0.75 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.48;
  group.add(base);

  // ── Frosting dome ──
  const frostGeo = new THREE.SphereGeometry(0.73, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.65);
  const frostMat = new THREE.MeshStandardMaterial({ color: 0xF8C8D4, roughness: 0.25, metalness: 0.04 });
  const frost = new THREE.Mesh(frostGeo, frostMat);
  frost.position.y = 0.66;
  frost.scale.y = 1.12;
  group.add(frost);

  // ── Swirl rings ──
  const swirlColors = [0xF8C8D4, 0xF4A8B8, 0xF0D0DC];
  for (let i = 0; i < 3; i++) {
    const r   = 0.48 - i * 0.135;
    const sGeo = new THREE.TorusGeometry(r, 0.088 - i * 0.014, 12, 40);
    const sMat = new THREE.MeshStandardMaterial({ color: swirlColors[i], roughness: 0.28 });
    const sw  = new THREE.Mesh(sGeo, sMat);
    sw.rotation.x = Math.PI / 2;
    sw.position.y = 1.06 + i * 0.145;
    group.add(sw);
  }

  // ── Cherry ──
  const cherryGeo = new THREE.SphereGeometry(0.135, 16, 16);
  const cherryMat = new THREE.MeshStandardMaterial({ color: 0xC0392B, roughness: 0.18, metalness: 0.12 });
  const cherry = new THREE.Mesh(cherryGeo, cherryMat);
  cherry.position.y = 1.58;
  group.add(cherry);

  // Cherry stem (CylinderGeometry — NOT CapsuleGeometry)
  const stemGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.24, 8);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3D6B35, roughness: 0.7 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.set(0.05, 1.73, 0);
  stem.rotation.z = 0.22;
  group.add(stem);

  // ── Sprinkles ──
  const spkColors = [0xF5A623, 0x7ED321, 0x4A90E2, 0xD0021B, 0x9B59B6, 0xF39C12];
  for (let i = 0; i < 20; i++) {
    const angle  = (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const radius = 0.18 + Math.random() * 0.40;
    const spkGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.13, 6);
    const spkMat = new THREE.MeshStandardMaterial({ color: spkColors[i % spkColors.length], roughness: 0.4 });
    const spk    = new THREE.Mesh(spkGeo, spkMat);
    spk.position.set(
      Math.cos(angle) * radius,
      1.02 + Math.random() * 0.20,
      Math.sin(angle) * radius
    );
    spk.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    group.add(spk);
  }

  group.position.y = -0.4;

  // ── Animate: float + rotate ──
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.016;
    group.rotation.y  = t * 0.44;
    group.position.y  = -0.4 + Math.sin(t * 1.08) * 0.065;
    renderer.render(scene, camera);
  }
  animate();
}

/* ══ INIT ════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  render();
});
