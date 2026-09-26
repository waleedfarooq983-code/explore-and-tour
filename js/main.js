/* ============================================================
   SHARED JS — Nav, modal, auth, OTP, WhatsApp, newsletter
   ============================================================ */

/* ---------- MOBILE MENU ---------- */
function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    if (!toggle || !nav) return;

    if (!nav.querySelector('.nav-close')) {
        const close = document.createElement('button');
        close.className = 'nav-close';
        close.innerHTML = '<i class="fas fa-times"></i>';
        close.onclick = () => nav.classList.remove('open');
        nav.appendChild(close);
    }

    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => nav.classList.remove('open'))
    );
}

/* ---------- ACTIVE NAV LINK ---------- */
function highlightActiveNav() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === page) a.classList.add('active');
    });
    const user = AUTH.getUser();
    const dashLink = document.querySelector('.nav-dashboard-link');
    if (dashLink && user) dashLink.style.display = 'inline-flex';
}

/* ---------- AUTH (localStorage) ---------- */
const AUTH = {
    getUser() {
        try { return JSON.parse(localStorage.getItem('currentUser')); }
        catch { return null; }
    },
    setUser(user) { localStorage.setItem('currentUser', JSON.stringify(user)); },
    isAdmin() {
        const u = this.getUser();
        return u && u.role === 'admin';
    },
    logout() {
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
    },

    signup(name, email, pass) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) throw new Error('Email already registered');
        const user = {
            name, email, pass,
            role: 'user',
            joined: new Date().toISOString()
        };
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        this.setUser({ name, email, role: 'user' });
        return user;
    },

    login(email, pass) {
        // Admin check first
        const adminEmail = 'admin@discoverpakistan.pk';
        const adminPass = 'admin123';
        if (email === adminEmail && pass === adminPass) {
            const adminUser = { name: 'Admin', email, role: 'admin' };
            this.setUser(adminUser);
            return adminUser;
        }
        // Regular user
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.pass === pass);
        if (!user) throw new Error('Invalid email or password');
        this.setUser({ name: user.name, email: user.email, role: user.role || 'user' });
        return user;
    }
};

/* ---------- OTP SYSTEM (demo mode) ---------- */
const OTP = {
    _store: {},
    _otpTarget: null,
    _otpEmail: null,
    _timerInterval: null,

    send(email, onVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        this._store[email] = {
            code,
            expires: Date.now() + 5 * 60 * 1000,
            attempts: 0
        };
        this._otpTarget = onVerified;
        this._otpEmail = email;

        console.log('[OTP] Generated for', email, ':', code);
        this._showOTPModal(email, code);
        return code;
    },

    _showOTPModal(email, demoCode) {
        const old = document.getElementById('otpModal');
        if (old) old.remove();

        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-backdrop active" id="otpModal">
                <div class="modal" style="max-width:440px;">
                    <button class="modal-close" onclick="OTP.close()"><i class="fas fa-times"></i></button>

                    <div style="text-align:center;margin-bottom:20px;">
                        <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,var(--green-50),#d4eddd);color:var(--green-700);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:1.8rem;">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h3 style="color:var(--green-900);margin-bottom:6px;">Verify Your Email</h3>
                        <p class="sub" style="margin-bottom:0;">We've sent a 6-digit code to<br><strong style="color:var(--green-700);">${email}</strong></p>
                    </div>

                    <div class="field-group">
                        <label style="text-align:center;display:block;">Enter OTP</label>
                        <input type="text" id="otpInput" maxlength="6" inputmode="numeric"
                               placeholder="• • • • • •"
                               style="text-align:center;font-size:1.6rem;letter-spacing:12px;font-weight:700;padding:14px;">
                    </div>

                    <div id="otpError" style="color:#c0392b;font-size:.88rem;text-align:center;min-height:20px;margin-bottom:10px;"></div>

                    <button class="btn btn-primary btn-block btn-lg" onclick="OTP.verify()">
                        <i class="fas fa-check-circle"></i> Verify
                    </button>

                    <div style="text-align:center;margin-top:16px;font-size:.88rem;color:var(--ink-500);">
                        Didn't receive it?
                        <a onclick="OTP.resend()" style="color:var(--green-700);font-weight:600;cursor:pointer;">Resend Code</a>
                        <span id="otpTimer" style="display:block;margin-top:6px;"></span>
                    </div>

                    <div style="margin-top:20px;padding:12px 16px;background:#fff8e7;border-radius:12px;border:1px dashed var(--gold-500);font-size:.82rem;color:var(--ink-700);text-align:center;">
                        <i class="fas fa-flask" style="color:var(--gold-700);"></i>
                        <strong>Demo mode:</strong> Your code is <code style="background:rgba(0,0,0,.06);padding:2px 8px;border-radius:4px;font-weight:700;">${demoCode}</code>
                        <br><small style="color:var(--ink-500);">(Real SMS/Email requires backend)</small>
                    </div>
                </div>
            </div>
        `);

        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('otpInput').focus(), 100);

        document.getElementById('otpInput').addEventListener('input', e => {
            e.target.value = e.target.value.replace(/\D/g, '');
            if (e.target.value.length === 6) setTimeout(() => OTP.verify(), 200);
        });

        document.getElementById('otpInput').addEventListener('keypress', e => {
            if (e.key === 'Enter') OTP.verify();
        });

        this._startTimer(email);
    },

    _startTimer(email) {
        const el = document.getElementById('otpTimer');
        if (!el) return;
        if (this._timerInterval) clearInterval(this._timerInterval);

        this._timerInterval = setInterval(() => {
            const entry = this._store[email];
            if (!entry) { clearInterval(this._timerInterval); return; }
            const left = Math.max(0, Math.floor((entry.expires - Date.now()) / 1000));
            if (left <= 0) {
                el.textContent = 'Code expired — click Resend';
                el.style.color = '#c0392b';
                clearInterval(this._timerInterval);
            } else {
                const m = Math.floor(left / 60);
                const s = (left % 60).toString().padStart(2, '0');
                el.textContent = `Code expires in ${m}:${s}`;
                el.style.color = 'var(--ink-500)';
            }
        }, 1000);
    },

    verify() {
        const input = document.getElementById('otpInput');
        const errEl = document.getElementById('otpError');
        const entered = input.value.trim();
        const email = this._otpEmail;
        const entry = this._store[email];

        errEl.textContent = '';
        if (!entry) { errEl.textContent = 'No active code. Please resend.'; return; }
        if (Date.now() > entry.expires) { errEl.textContent = 'Code expired. Click Resend.'; return; }
        if (entry.attempts >= 5) { errEl.textContent = 'Too many attempts. Please resend.'; return; }
        if (entered.length !== 6) { errEl.textContent = 'Please enter all 6 digits.'; return; }

        entry.attempts++;

        if (entered === entry.code) {
            delete this._store[email];
            this.close();
            if (typeof showToast === 'function') showToast('Verified! ✅', 'success');
            if (this._otpTarget) this._otpTarget();
        } else {
            errEl.textContent = `Incorrect code. ${5 - entry.attempts} attempts left.`;
            input.value = '';
            input.focus();
        }
    },

    resend() {
        const email = this._otpEmail;
        if (!email) return;
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        this._store[email] = {
            code: newCode,
            expires: Date.now() + 5 * 60 * 1000,
            attempts: 0
        };
        const demoBox = document.querySelector('#otpModal code');
        if (demoBox) demoBox.textContent = newCode;
        document.getElementById('otpError').textContent = '';
        document.getElementById('otpInput').value = '';
        document.getElementById('otpInput').focus();
        this._startTimer(email);
        if (typeof showToast === 'function') showToast('New code sent 📧', 'info');
        console.log('[OTP] Resent:', newCode);
    },

    close() {
        const m = document.getElementById('otpModal');
        if (m) m.remove();
        document.body.style.overflow = '';
        if (this._timerInterval) clearInterval(this._timerInterval);
    }
};

/* ---------- AUTH MODAL ---------- */
let authMode = 'login';

function ensureAuthModal() {
    if (document.getElementById('authModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-backdrop" id="authModal">
            <div class="modal">
                <button class="modal-close" onclick="closeAuthModal()"><i class="fas fa-times"></i></button>
                <h3 id="authTitle">Welcome Back</h3>
                <p class="sub" id="authSub">Login to continue your journey</p>
                <form id="authForm" onsubmit="return handleAuth(event)">
                    <div class="field-group hidden" id="nameField">
                        <label>Full Name</label>
                        <input type="text" id="authName" placeholder="Your full name">
                    </div>
                    <div class="field-group">
                        <label>Email Address</label>
                        <input type="email" id="authEmail" placeholder="you@example.com" required>
                    </div>
                    <div class="field-group">
                        <label>Password</label>
                        <input type="password" id="authPass" placeholder="••••••••" required minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" id="authSubmit">Login</button>
                </form>
                <p class="modal-switch">
                    <span id="switchText">Don't have an account?</span>
                    <a onclick="toggleAuthMode()" id="switchLink">Sign Up</a>
                </p>
            </div>
        </div>
    `);
}

function openAuthModal(mode = 'login') {
    ensureAuthModal();
    authMode = mode;
    updateAuthModal();
    document.getElementById('authModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeAuthModal() {
    const m = document.getElementById('authModal');
    if (m) m.classList.remove('active');
    document.body.style.overflow = '';
}
function toggleAuthMode() {
    authMode = authMode === 'login' ? 'signup' : 'login';
    updateAuthModal();
}
function updateAuthModal() {
    const isLogin = authMode === 'login';
    document.getElementById('authTitle').textContent = isLogin ? 'Welcome Back' : 'Create Account';
    document.getElementById('authSub').textContent = isLogin ? 'Login to continue your journey' : 'Sign up to start exploring Pakistan';
    document.getElementById('authSubmit').textContent = isLogin ? 'Login' : 'Sign Up';
    document.getElementById('nameField').classList.toggle('hidden', isLogin);
    document.getElementById('switchText').textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    document.getElementById('switchLink').textContent = isLogin ? 'Sign Up' : 'Login';
}

function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authPass').value;
    const name = document.getElementById('authName') ? document.getElementById('authName').value.trim() : '';

    try {
        if (authMode === 'signup') {
            if (!name) throw new Error('Please enter your name');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            if (users.find(u => u.email === email)) throw new Error('Email already registered');

            OTP.send(email, function() {
                try {
                    AUTH.signup(name, email, pass);
                    showToast(`Welcome, ${name.split(' ')[0]}! 🎉`, 'success');
                    closeAuthModal();
                    setTimeout(() => location.href = 'dashboard.html', 600);
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        } else {
            const u = AUTH.login(email, pass);
            showToast(`Welcome back, ${u.name.split(' ')[0]}!`, 'success');
            closeAuthModal();
            setTimeout(() => {
                location.href = u.role === 'admin' ? 'admin.html' : 'dashboard.html';
            }, 600);
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
    return false;
}

/* ---------- RENDER HEADER AUTH ---------- */
function renderAuthUI() {
    const box = document.querySelector('.header-actions');
    if (!box) return;
    const user = AUTH.getUser();

    if (user) {
        const initial = user.name.charAt(0).toUpperCase();
        const isAdmin = user.role === 'admin';
        box.innerHTML = `
            <div class="user-menu">
                <button class="user-menu-btn" onclick="toggleUserMenu(event)">
                    <span class="user-avatar" style="${isAdmin ? 'background:linear-gradient(135deg,#c9a24c,#a07a2c);' : ''}">${initial}</span>
                    <span class="user-name">${user.name.split(' ')[0]}${isAdmin ? ' <span style="background:var(--gold-500);color:var(--green-900);padding:2px 8px;border-radius:20px;font-size:.62rem;font-weight:700;letter-spacing:.5px;margin-left:6px;">ADMIN</span>' : ''}</span>
                    <i class="fas fa-chevron-down" style="font-size:.7rem;"></i>
                </button>
                <div class="user-dropdown" id="userDropdown">
                    ${isAdmin ? `
                        <a href="admin.html"><i class="fas fa-shield-alt"></i> Admin Panel</a>
                        <a href="admin.html#bookings"><i class="fas fa-suitcase-rolling"></i> All Bookings</a>
                        <a href="admin.html#users"><i class="fas fa-users"></i> Manage Users</a>
                        <a href="admin.html#tours"><i class="fas fa-route"></i> Manage Tours</a>
                    ` : `
                        <a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> My Dashboard</a>
                        <a href="dashboard.html#bookings"><i class="fas fa-suitcase-rolling"></i> My Bookings</a>
                        <a href="tours.html"><i class="fas fa-compass"></i> Browse Tours</a>
                    `}
                    <div class="dropdown-divider"></div>
                    <a onclick="logoutUser()" style="color:#c0392b;"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
            <button class="menu-toggle"><i class="fas fa-bars"></i></button>
        `;
    } else {
        box.innerHTML = `
            <button class="btn btn-outline btn-sm" onclick="openAuthModal('login')">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
            <button class="btn btn-primary btn-sm" onclick="openAuthModal('signup')">
                <i class="fas fa-user-plus"></i> Sign Up
            </button>
            <button class="menu-toggle"><i class="fas fa-bars"></i></button>
        `;
    }
    initMobileMenu();
    document.addEventListener('click', e => {
        const dd = document.getElementById('userDropdown');
        if (dd && !e.target.closest('.user-menu')) dd.classList.remove('open');
    });
}

function toggleUserMenu(e) {
    e.stopPropagation();
    const dd = document.getElementById('userDropdown');
    if (dd) dd.classList.toggle('open');
}

function logoutUser() {
    if (!confirm('Are you sure you want to logout?')) return;
    AUTH.logout();
    if (typeof showToast === 'function') showToast('Logged out successfully 👋', 'info');
    setTimeout(() => { window.location.href = 'index.html'; }, 500);
}

/* ---------- TOAST ---------- */
function showToast(msg, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%) translateY(20px);
            padding: 14px 26px; border-radius: 40px; color: white; font-weight: 600;
            font-size: .92rem; z-index: 2000; opacity: 0; transition: .3s;
            box-shadow: 0 10px 30px rgba(0,0,0,.25); max-width: 90vw; text-align: center;
        `;
        document.body.appendChild(toast);
    }
    const colors = {
        success: '#12894a',
        error: '#c0392b',
        info: '#0a6b3a'
    };
    toast.style.background = colors[type] || colors.info;
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
}

/* ---------- NEWSLETTER ---------- */
function handleNewsletter(e) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (!input.value) return;
    showToast('Subscribed! Check your inbox 📧', 'success');
    input.value = '';
    return false;
}

/* ---------- WHATSAPP ---------- */
function injectWhatsApp() {
    if (document.querySelector('.whatsapp-float')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <a href="https://wa.me/923005289176?text=Hello%20Discover%20Pakistan!%20I%20want%20to%20know%20more."
           class="whatsapp-float" target="_blank" rel="noopener" aria-label="WhatsApp">
            <i class="fab fa-whatsapp"></i>
        </a>
        <span class="whatsapp-tooltip">Chat with us!</span>
    `);
}

/* ---------- SCROLL TO TOP ---------- */
function injectScrollTop() {
    if (document.getElementById('scrollTopBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'scrollTopBtn';
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    btn.style.cssText = `
        position: fixed; bottom: 100px; right: 24px; width: 46px; height: 46px;
        border-radius: 50%; background: var(--green-700); color: white;
        font-size: 1rem; z-index: 400; opacity: 0; pointer-events: none;
        transition: .3s; box-shadow: 0 6px 20px rgba(10,107,58,.35); cursor: pointer;
    `;
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(btn);
    window.addEventListener('scroll', () => {
        const show = window.scrollY > 500;
        btn.style.opacity = show ? '1' : '0';
        btn.style.pointerEvents = show ? 'auto' : 'none';
    });
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    highlightActiveNav();
    renderAuthUI();
    injectWhatsApp();
    injectScrollTop();

    document.addEventListener('click', e => {
        if (e.target.classList && e.target.classList.contains('modal-backdrop')) closeAuthModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeAuthModal();
    });
});
