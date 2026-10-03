// ============================================================
// АВТОРИЗАЦИЯ
// ============================================================

function selectRole(role) {
    currentRole = role;
    document.querySelectorAll('.role-btn').forEach(b => b.classList.toggle('active', b.dataset.role === role));

    const deptBlock = document.getElementById('loginDeptBlock');
    if (deptBlock) {
        if (role === 'dept') {
            deptBlock.style.display = 'block';
            populateLoginDepts();
        } else {
            deptBlock.style.display = 'none';
        }
    }
}

function populateLoginDepts() {
    const sel = document.getElementById('loginDept');
    if (!sel) return;
    sel.innerHTML = state.settings.depts.map(d => '<option value="' + d + '">' + d + '</option>').join('');
}

function togglePasswordVisibility() {
    const p = document.getElementById('loginPassword');
    p.type = p.type === 'password' ? 'text' : 'password';
}

function doLogin() {
    if (!currentRole) {
        toast('Выберите роль', 'error');
        return;
    }

    const pwd = document.getElementById('loginPassword').value;
    const expected = state.settings.passwords[currentRole] || '';

    if (pwd !== expected) {
        toast('Неверный пароль', 'error');
        return;
    }

    let deptName = '';
    if (currentRole === 'dept') {
        const sel = document.getElementById('loginDept');
        deptName = sel ? sel.value : '';
        if (!deptName) {
            toast('Выберите отделение', 'error');
            return;
        }
        currentDept = deptName;
    } else {
        currentDept = null;
    }

    state.currentUser = {
        role: currentRole,
        name: currentRole === 'lab' ? 'Лаборант'
            : currentRole === 'doctor' ? 'Врач'
            : currentRole === 'admin' ? 'Администратор'
            : deptName
    };

    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    document.getElementById('userBadge').innerHTML =
        (currentRole === 'lab' ? '👩‍🔬' : currentRole === 'doctor' ? '👨‍⚕️' : currentRole === 'admin' ? '🔑' : '🏥') +
        ' ' + state.currentUser.name;

    applyRolePermissions();
    initApp();

    if (currentRole === 'lab' || currentRole === 'admin') {
        startRequestsCheck();
    }
}

function applyRolePermissions() {
    const isDept = currentRole === 'dept';
    const isDoctor = currentRole === 'doctor';
    const isAdmin = currentRole === 'admin';
    const isLab = currentRole === 'lab';

    // Кнопка «Новое исследование» — только лаборант и админ
    document.getElementById('newStudyBtn').style.display = isDoctor || isDept ? 'none' : 'inline-flex';

    // Блок паролей — только админ
    document.getElementById('adminPasswordsBlock').style.display = isAdmin ? 'block' : 'none';

    // Панель шаблонов описаний — врач и админ
    const doctorSection = document.getElementById('doctorTemplatesSection');
    if (doctorSection) {
        doctorSection.style.display = (currentRole === 'doctor' || currentRole === 'admin') ? 'block' : 'none';
    }

    // ⚙️ Настройки: блоки «Сотрудники», «МКБ», «Опасная зона» — ТОЛЬКО админ
    const settingsStaff = document.getElementById('settingsStaffBlock');
    if (settingsStaff) settingsStaff.style.display = isAdmin ? 'block' : 'none';

    const settingsICD = document.getElementById('settingsICDBlock');
    if (settingsICD) settingsICD.style.display = isAdmin ? 'block' : 'none';

    const settingsDanger = document.getElementById('settingsDangerBlock');
    if (settingsDanger) settingsDanger.style.display = isAdmin ? 'block' : 'none';

    // Кнопка «Создать заявку» — только отделению
    const newRequestBtn = document.getElementById('newRequestBtn');
    if (newRequestBtn) newRequestBtn.style.display = isDept ? 'inline-flex' : 'none';

    // Вкладки
    document.querySelectorAll('.tab').forEach(tab => {
        const t = tab.dataset.tab;
        if (isDept) {
            tab.style.display = (t === 'requests') ? 'flex' : 'none';
        } else {
            tab.style.display = '';
        }
    });

    const reqTab = document.querySelector('.tab[data-tab="requests"]');
    if (reqTab) {
        if (isDoctor) reqTab.style.display = 'none';
        else if (isDept) reqTab.style.display = 'flex';
        else reqTab.style.display = '';
    }

    if (isDept) {
        setTimeout(() => {
            const reqTabEl = document.querySelector('.tab[data-tab="requests"]');
            if (reqTabEl) reqTabEl.click();
        }, 50);
    }

    // Инициализируем кнопку скролла
    if (typeof initScrollButton === 'function') {
        initScrollButton();
    }

    // Фильтр по отделению — только для лаборанта и админа
    const deptFilterEl = document.getElementById('requestFilterDept');
    if (deptFilterEl) {
        if (isAdmin || isLab) {
            deptFilterEl.style.display = '';
            if (typeof populateRequestDeptFilter === 'function') {
                populateRequestDeptFilter();
            }
        } else {
            deptFilterEl.style.display = 'none';
        }
    }
}

function logout() {
    state.currentUser = null;
    currentRole = null;
    currentDept = null;
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));

    const deptBlock = document.getElementById('loginDeptBlock');
    if (deptBlock) deptBlock.style.display = 'none';

    stopRequestsCheck();

    const scrollBtn = document.getElementById('scrollButton');
    if (scrollBtn) scrollBtn.classList.remove('show');
}

function toggleTheme() {
    const c = document.documentElement.getAttribute('data-theme');
    const n = c === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n);
    localStorage.setItem('theme', n);
    document.getElementById('themeIcon').textContent = n === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
    const s = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', s);
    document.getElementById('themeIcon').textContent = s === 'dark' ? '☀️' : '🌙';
}

function startRequestsCheck() {
    stopRequestsCheck();
    updateRequestsBadge();
    requestsCheckTimer = setInterval(() => {
        if (currentRole === 'lab' || currentRole === 'admin') {
            updateRequestsBadge();
        }
    }, 30000);
}

function stopRequestsCheck() {
    if (requestsCheckTimer) {
        clearInterval(requestsCheckTimer);
        requestsCheckTimer = null;
    }
}