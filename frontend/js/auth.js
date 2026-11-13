/* ============================================================
   EVENTIFY — Auth (login, register, logout, guards)
   ============================================================ */

const Auth = (function () {

    async function getSession() {
        const res = await API.sessionCheck();
        if (res.success && res.data && res.data.loggedIn) return res.data;
        return null;
    }

    // -------- Login page --------
    function initLoginPage() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        // If already logged in, redirect
        getSession().then(user => {
            if (user) Nav.redirectIfLoggedIn(user);
        });

        const toggle = document.querySelector('.toggle-pass');
        const passInput = form.querySelector('input[name="password"]');
        if (toggle && passInput) {
            toggle.addEventListener('click', () => {
                passInput.type = passInput.type === 'password' ? 'text' : 'password';
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email    = form.querySelector('input[name="email"]').value.trim();
            const password = form.querySelector('input[name="password"]').value;

            const errBox = form.querySelector('.error-text');
            if (errBox) errBox.classList.remove('visible');

            if (!email || !password) {
                Notify.error('Please enter email and password');
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            const original = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = 'Signing in...';

            const res = await API.login({ email, password });

            btn.disabled = false;
            btn.innerHTML = original;

            if (!res.success) {
                Notify.error(res.message || 'Login failed');
                if (errBox) {
                    errBox.textContent = res.message || 'Login failed';
                    errBox.classList.add('visible');
                }
                return;
            }

            Notify.success('Welcome back, ' + res.data.user_name + '!');

            setTimeout(() => {
                if (res.data.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'user-dashboard.html';
                }
            }, 500);
        });
    }

    // -------- Register page --------
    function initRegisterPage() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        getSession().then(user => {
            if (user) Nav.redirectIfLoggedIn(user);
        });

        const passInput  = form.querySelector('input[name="password"]');
        const passInput2 = form.querySelector('input[name="confirm_password"]');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user_name = form.querySelector('input[name="user_name"]').value.trim();
            const email     = form.querySelector('input[name="email"]').value.trim();
            const password  = passInput.value;
            const confirm   = passInput2.value;

            const errBox = form.querySelector('.error-text');
            if (errBox) errBox.classList.remove('visible');

            if (!user_name || !email || !password) {
                Notify.error('Please fill in all fields');
                return;
            }
            if (password.length < 6) {
                Notify.error('Password must be at least 6 characters');
                return;
            }
            if (password !== confirm) {
                Notify.error('Passwords do not match');
                if (errBox) {
                    errBox.textContent = 'Passwords do not match';
                    errBox.classList.add('visible');
                }
                return;
            }

            const btn = form.querySelector('button[type="submit"]');
            const original = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = 'Creating account...';

            const res = await API.register({ user_name, email, password });

            btn.disabled = false;
            btn.innerHTML = original;

            if (!res.success) {
                Notify.error(res.message || 'Registration failed');
                if (errBox) {
                    errBox.textContent = res.message || 'Registration failed';
                    errBox.classList.add('visible');
                }
                return;
            }

            Notify.success('Account created! Redirecting to login...');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 900);
        });
    }

    return {
        getSession,
        initLoginPage,
        initRegisterPage
    };
})();