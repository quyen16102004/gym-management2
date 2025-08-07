// This is the JavaScript file for the front-end3 application.
// It handles user interactions, manages page visibility, and implements functionality for login, registration, and member management.

let users = JSON.parse(localStorage.getItem('users')) || [];
let members = JSON.parse(localStorage.getItem('members')) || [];
let trainers = JSON.parse(localStorage.getItem('trainers')) || [];
let schedules = JSON.parse(localStorage.getItem('schedules')) || [];
let packages = JSON.parse(localStorage.getItem('packages')) || [
    { id: 1, name: "Premium 6 tháng", price: "5.000.000đ", sessions: 36, benefit: "Huấn luyện viên cá nhân, Đánh giá thể lực chuyên sâu, Hỗ trợ dinh dưỡng 24/7" },
    { id: 2, name: "Standard 3 tháng", price: "2.500.000đ", sessions: 18, benefit: "Đánh giá thể lực, Hỗ trợ dinh dưỡng" },
    { id: 3, name: "Basic 1 tháng", price: "900.000đ", sessions: 6, benefit: "Hỗ trợ dinh dưỡng cơ bản" }
];

let isLoggedIn = false;
let currentUser = null;
let editingMemberId = null;
let editingTrainerId = null;
let editingScheduleId = null;
let editingAccountId = null;

// --- Utility Functions ---
function saveToLocalStorage() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('members', JSON.stringify(members));
    localStorage.setItem('trainers', JSON.stringify(trainers));
    localStorage.setItem('schedules', JSON.stringify(schedules));
    localStorage.setItem('packages', JSON.stringify(packages));
}

function showToast(message, type = 'success') {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing on hover
        style: {
            background: type === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff416c, #ff4b2b)",
        },
        onClick: function(){} // Callback after click
    }).showToast();
}

// --- Modal Functions ---
const globalModal = document.getElementById('global-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

function showModal(title, contentHtml) {
    modalTitle.innerText = title;
    modalBody.innerHTML = contentHtml;
    globalModal.classList.add('show');
}

function hideModal() {
    globalModal.classList.remove('show');
    modalBody.innerHTML = ''; // Clear content
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == globalModal) {
        hideModal();
    }
}

// --- Navigation & Authentication ---
function showPage(pageId) {
    // Check login status for private pages
    const privateNavItems = document.querySelectorAll('#nav-private .nav-item');
    let requiresLogin = false;
    privateNavItems.forEach(item => {
        if (item.onclick.toString().includes(pageId)) {
            requiresLogin = true;
        }
    });

    if (!isLoggedIn && requiresLogin && pageId !== 'login' && pageId !== 'register' && pageId !== 'home') {
        showToast('Vui lòng đăng nhập để tiếp tục!', 'error');
        showPage('login'); // Redirect to login page
        return;
    }

    // Check role permissions
    const currentPageNavItem = document.querySelector(`#nav-private a[onclick*="showPage('${pageId}')"]`);
    if (currentPageNavItem) {
        const requiredRoles = currentPageNavItem.dataset.role ? currentPageNavItem.dataset.role.split(',') : [];
        if (requiredRoles.length > 0 && (!currentUser || !requiredRoles.includes(currentUser.role))) {
            showToast('Bạn không có quyền truy cập trang này!', 'error');
            showPage('home'); // Redirect to home or a forbidden page
            return;
        }
    }

    // Hide all pages and remove active from nav items
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.querySelectorAll('nav .nav-item').forEach(item => item.classList.remove('active'));

    // Show selected page and mark nav as active
    document.getElementById(pageId).classList.remove('hidden');
    document.querySelectorAll('nav .nav-item').forEach(item => {
        if (item.onclick.toString().includes(pageId)) {
            item.classList.add('active');
        }
    });

    // Specific rendering for certain pages
    if (pageId === 'member') {
        renderMembers();
        renderCurrentMemberProfile();
    } else if (pageId === 'trainer') {
        renderTrainers();
        renderTrainerWeeklySchedule();
        renderMyStudents();
    } else if (pageId === 'package') {
        renderAvailablePackages();
        renderUserPackageDisplay();
    } else if (pageId === 'account') {
        renderAccounts();
    } else if (pageId === 'manage-schedule') {
        renderSchedules();
    }

    window.scrollTo(0, 0); // Scroll to top
}

function login(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (username && password) {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            isLoggedIn = true;
            currentUser = user;
            document.getElementById('nav-public').classList.add('hidden');
            document.getElementById('nav-private').classList.remove('hidden');
            document.getElementById('current-username').innerText = currentUser.username;
            showToast('Đăng nhập thành công! Quyền: ' + user.role);
            updateNavVisibility(); // Update nav items based on role
            showPage('home');
        } else {
            showToast('Sai tài khoản hoặc mật khẩu!', 'error');
        }
    } else {
        showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
    }
    return false;
}

function register(event) {
    event.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const fullname = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm').value;
    const role = document.getElementById('reg-role').value;

    if (!username || !fullname || !email || !phone || !password || !confirmPassword || !role) {
        showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
        return false;
    }

    if (users.some(u => u.username === username)) {
        showToast('Tên đăng nhập đã tồn tại!', 'error');
        return false;
    }

    if (password !== confirmPassword) {
        showToast('Mật khẩu không khớp!', 'error');
        return false;
    }

    const newUser = { id: Date.now(), username, fullname, email, phone, password, role };
    users.push(newUser);
    saveToLocalStorage();
    showToast('Đăng ký thành công! Vui lòng đăng nhập.');
    switchAuthTab('login-tab');

    // If new user is a member or trainer, add them to respective lists
    if (role === 'member') {
        members.push({
            id: newUser.id,
            name: fullname,
            dob: '', // Can be updated later
            phone: phone,
            email: email,
            package: 'Chưa có gói',
            trainer: 'Chưa có PT'
        });
    } else if (role === 'trainer') {
        trainers.push({
            id: newUser.id,
            name: fullname,
            specialization: 'Chưa cập nhật',
            students: 0,
            experience: 'Mới',
            phone: phone,
            email: email
        });
    }
    saveToLocalStorage();
    return false;
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    document.getElementById('nav-private').classList.add('hidden');
    document.getElementById('nav-public').classList.remove('hidden');
    document.getElementById('user-menu').classList.add('hidden'); // Hide dropdown
    showToast('Đã đăng xuất.');
    showPage('home');
}

function switchAuthTab(tabId) {
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.add('hidden');
    });
    document.getElementById(tabId).classList.remove('hidden');

    document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.auth-tabs button[onclick*="${tabId}"]`).classList.add('active');
}

function toggleUserMenu() {
    document.getElementById('user-menu').classList.toggle('show');
}

// Close user menu if clicked outside
window.addEventListener('click', function(event) {
    if (!event.target.closest('.user-profile-dropdown')) {
        document.getElementById('user-menu').classList.remove('show');
    }
});

function updateNavVisibility() {
    const navItems = document.querySelectorAll('#nav-private .nav-item');
    navItems.forEach(item => {
        const requiredRoles = item.dataset.role ? item.dataset.role.split(',') : [];
        if (requiredRoles.length > 0) {
            if (currentUser && requiredRoles.includes(currentUser.role)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        }
    });
}

// --- Member Management ---
function renderMembers() {
    const tbody = document.getElementById('member-list');
    if (!tbody) return;
    const filteredMembers = members.filter(m => {
        const searchTerm = document.getElementById('member-search').value.toLowerCase();
        return m.name.toLowerCase().includes(searchTerm) ||
               m.email.toLowerCase().includes(searchTerm) ||
               m.phone.includes(searchTerm);
    });

    tbody.innerHTML = filteredMembers.map(m => `
        <tr>
            <td>${m.name}</td>
            <td>${m.dob}</td>
            <td>${m.phone}</td>
            <td>${m.email}</td>
            <td>${m.package}</td>
            <td>${m.trainer}</td>
            <td>
                <button onclick="editMember(${m.id})">Sửa</button>
                <button onclick="deleteMember(${m.id})">Xóa</button>
            </td>
        </tr>
    `).join('');
}

function renderCurrentMemberProfile() {
    const profileCard = document.getElementById('current-member-profile');
    if (!profileCard) return;

    if (currentUser && currentUser.role === 'member') {
        const memberInfo = members.find(m => m.id === currentUser.id);
        if (memberInfo) {
            profileCard.innerHTML = `
                <div class="profile-image-container">
                    <img src="https://via.placeholder.com/150/E53935/FFFFFF?text=${memberInfo.name.charAt(0)}" alt="Member Avatar">
                </div>
                <div class="profile-info">
                    <h3>${memberInfo.name} <span class="badge ${memberInfo.package.includes('Premium') ? 'badge-premium' : memberInfo.package.includes('Standard') ? 'badge-standard' : 'badge-basic'}">${memberInfo.package.split(' ')[0]}</span></h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label"><i class="fas fa-birthday-cake"></i> Ngày sinh:</span>
                            <span>${memberInfo.dob || 'Chưa cập nhật'}</span>
                        </div>
                        <div class="info-item">
                            <span class="label"><i class="fas fa-id-card"></i> Mã HV:</span>
                            <span>HV${memberInfo.id}</span>
                        </div>
                        <div class="info-item">
                            <span class="label"><i class="fas fa-dumbbell"></i> Gói tập:</span>
                            <span>${memberInfo.package}</span>
                        </div>
                        <div class="info-item">
                            <span class="label"><i class="fas fa-user-tie"></i> PT:</span>
                            <span>${memberInfo.trainer}</span>
                        </div>
                        <div class="info-item">
                            <span class="label"><i class="fas fa-phone"></i> Điện thoại:</span>
                            <span>${memberInfo.phone}</span>
                        </div>
                        <div class="info-item">
                            <span class="label"><i class="fas fa-envelope"></i> Email:</span>
                            <span>${memberInfo.email}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            profileCard.innerHTML = `
                <div class="profile-placeholder">
                    <i class="fas fa-user-circle"></i>
                    <h3>Chưa có thông tin hội viên</h3>
                    <p>Vui lòng cập nhật hồ sơ của bạn hoặc liên hệ quản trị viên.</p>
                </div>
            `;
        }
    } else {
        profileCard.innerHTML = ''; // Hide if not a member
    }
}


function showAddMemberModal() {
    editingMemberId = null;
    const formHtml = `
        <form id="member-form-modal" onsubmit="saveMember(event)">
            <div class="form-group">
                <label for="mem-name">Họ tên:</label>
                <input type="text" id="mem-name" class="form-control" placeholder="Họ tên" required>
            </div>
            <div class="form-group">
                <label for="mem-dob">Ngày sinh:</label>
                <input type="date" id="mem-dob" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="mem-phone">Điện thoại:</label>
                <input type="tel" id="mem-phone" class="form-control" placeholder="Điện thoại">
            </div>
            <div class="form-group">
                <label for="mem-email">Email:</label>
                <input type="email" id="mem-email" class="form-control" placeholder="Email">
            </div>
            <div class="form-group">
                <label for="mem-package">Gói tập:</label>
                <input type="text" id="mem-package" class="form-control" placeholder="Gói tập">
            </div>
            <div class="form-group">
                <label for="mem-trainer">PT:</label>
                <input type="text" id="mem-trainer" class="form-control" placeholder="PT">
            </div>
            <button type="submit" class="btn btn-primary">Lưu</button>
            <button type="button" class="btn btn-secondary" onclick="hideModal()">Hủy</button>
        </form>
    `;
    showModal('Thêm/Sửa Hội viên', formHtml);
}

function saveMember(event) {
    event.preventDefault();
    const name = document.getElementById('mem-name').value;
    const dob = document.getElementById('mem-dob').value;
    const phone = document.getElementById('mem-phone').value;
    const email = document.getElementById('mem-email').value;
    const packageName = document.getElementById('mem-package').value;
    const trainer = document.getElementById('mem-trainer').value;

    if (!name || !dob) {
        showToast('Vui lòng nhập đủ thông tin Họ tên và Ngày sinh!', 'error');
        return;
    }

    if (editingMemberId) {
        const m = members.find(x => x.id === editingMemberId);
        if (m) {
            m.name = name;
            m.dob = dob;
            m.phone = phone;
            m.email = email;
            m.package = packageName;
            m.trainer = trainer;
            showToast('Cập nhật hội viên thành công!');
        }
    } else {
        members.push({
            id: Date.now(),
            name, dob, phone, email, package: packageName, trainer
        });
        showToast('Thêm hội viên thành công!');
    }
    saveToLocalStorage();
    hideModal();
    renderMembers();
}

function editMember(id) {
    const m = members.find(x => x.id === id);
    if (m) {
        editingMemberId = id;
        showAddMemberModal(); // Reuse the add form for editing
        // Populate form fields after modal is shown
        setTimeout(() => {
            document.getElementById('mem-name').value = m.name;
            document.getElementById('mem-dob').value = m.dob;
            document.getElementById('mem-phone').value = m.phone;
            document.getElementById('mem-email').value = m.email;
            document.getElementById('mem-package').value = m.package;
            document.getElementById('mem-trainer').value = m.trainer;
        }, 50); // Small delay to ensure modal is rendered
    }
}

function deleteMember(id) {
    if (confirm('Bạn chắc chắn muốn xóa hội viên này?')) {
        members = members.filter(x => x.id !== id);
        saveToLocalStorage();
        renderMembers();
        showToast('Đã xóa hội viên!');
    }
}

function filterMembers() {
    renderMembers();
}

// --- Trainer Management ---
function renderTrainers() {
    const container = document.getElementById('trainer-list');
    if (!container) return;
    container.innerHTML = trainers.map(tr => `
        <div class="trainer-card">
            <img src="https://via.placeholder.com/120/E53935/FFFFFF?text=${tr.name.charAt(0)}" alt="${tr.name}">
            <h3>${tr.name}</h3>
            <p class="specialization"><i class="fas fa-star"></i> ${tr.specialization}</p>
            <div class="trainer-stats">
                <div class="stat-item"><i class="fas fa-user-friends"></i> <span>${tr.students} Học viên</span></div>
                <div class="stat-item"><i class="fas fa-calendar-check"></i> <span>${tr.experience} kinh nghiệm</span></div>
            </div>
            <div class="trainer-contact">
                <p><i class="fas fa-phone"></i> ${tr.phone}</p>
                <p><i class="fas fa-envelope"></i> ${tr.email}</p>
            </div>
            <div class="trainer-actions mt-3">
                <button class="btn btn-primary" onclick="editTrainer(${tr.id})">Sửa</button>
                <button class="btn btn-secondary" onclick="deleteTrainer(${tr.id})">Xóa</button>
            </div>
        </div>
    `).join('');
}

function showAddTrainerModal() {
    editingTrainerId = null;
    const formHtml = `
        <form id="trainer-form-modal" onsubmit="saveTrainer(event)">
            <div class="form-group">
                <label for="trainer-name">Họ tên:</label>
                <input type="text" id="trainer-name" class="form-control" placeholder="Họ tên" required>
            </div>
            <div class="form-group">
                <label for="trainer-specialization">Chuyên môn:</label>
                <input type="text" id="trainer-specialization" class="form-control" placeholder="Ví dụ: Chuyên gia thể hình">
            </div>
            <div class="form-group">
                <label for="trainer-experience">Kinh nghiệm:</label>
                <input type="text" id="trainer-experience" class="form-control" placeholder="Ví dụ: 5 năm kinh nghiệm">
            </div>
            <div class="form-group">
                <label for="trainer-phone">Điện thoại:</label>
                <input type="tel" id="trainer-phone" class="form-control" placeholder="Điện thoại">
            </div>
            <div class="form-group">
                <label for="trainer-email">Email:</label>
                <input type="email" id="trainer-email" class="form-control" placeholder="Email">
            </div>
            <button type="submit" class="btn btn-primary">Lưu</button>
            <button type="button" class="btn btn-secondary" onclick="hideModal()">Hủy</button>
        </form>
    `;
    showModal('Thêm/Sửa Huấn luyện viên', formHtml);
}

function saveTrainer(event) {
    event.preventDefault();
    const name = document.getElementById('trainer-name').value;
    const specialization = document.getElementById('trainer-specialization').value;
    const experience = document.getElementById('trainer-experience').value;
    const phone = document.getElementById('trainer-phone').value;
    const email = document.getElementById('trainer-email').value;

    if (!name || !specialization) {
        showToast('Vui lòng nhập đủ thông tin Họ tên và Chuyên môn!', 'error');
        return;
    }

    if (editingTrainerId) {
        const tr = trainers.find(x => x.id === editingTrainerId);
        if (tr) {
            tr.name = name;
            tr.specialization = specialization;
            tr.experience = experience;
            tr.phone = phone;
            tr.email = email;
            showToast('Cập nhật huấn luyện viên thành công!');
        }
    } else {
        trainers.push({
            id: Date.now(),
            name, specialization, students: 0, experience, phone, email
        });
        showToast('Thêm huấn luyện viên thành công!');
    }
    saveToLocalStorage();
    hideModal();
    renderTrainers();
}

function editTrainer(id) {
    const tr = trainers.find(x => x.id === id);
    if (tr) {
        editingTrainerId = id;
        showAddTrainerModal();
        setTimeout(() => {
            document.getElementById('trainer-name').value = tr.name;
            document.getElementById('trainer-specialization').value = tr.specialization;
            document.getElementById('trainer-experience').value = tr.experience;
            document.getElementById('trainer-phone').value = tr.phone;
            document.getElementById('trainer-email').value = tr.email;
        }, 50);
    }
}

function deleteTrainer(id) {
    if (confirm('Bạn chắc chắn muốn xóa huấn luyện viên này?')) {
        trainers = trainers.filter(x => x.id !== id);
        saveToLocalStorage();
        renderTrainers();
        showToast('Đã xóa huấn luyện viên!');
    }
}

function renderTrainerWeeklySchedule() {
    const scheduleGrid = document.getElementById('trainer-weekly-schedule');
    if (!scheduleGrid) return;

    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    let scheduleHtml = '';

    daysOfWeek.forEach(day => {
        scheduleHtml += `
            <div class="day-schedule">
                <div class="day-header">${day}</div>
                <div class="time-slot available">7h-9h</div>
                <div class="time-slot booked">17h-19h</div>
            </div>
        `;
    });
    scheduleGrid.innerHTML = scheduleHtml;
}

function renderMyStudents() {
    const tbody = document.getElementById('student-list');
    if (!tbody) return;

    if (currentUser && currentUser.role === 'trainer') {
        const trainerStudents = members.filter(m => m.trainer === currentUser.fullname); // Assuming trainer name is stored in member.trainer
        tbody.innerHTML = trainerStudents.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.phone}</td>
                <td>${s.email}</td>
                <td>${s.package}</td>
                <td><button class="btn btn-primary" onclick="viewStudentDetails(${s.id})">Chi tiết</button></td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Bạn không phải là huấn luyện viên hoặc không có học viên.</td></tr>';
    }
}

function viewStudentDetails(id) {
    const student = members.find(m => m.id === id);
    if (student) {
        showToast(`Chi tiết học viên: ${student.name} - Gói: ${student.package}`, 'info');
        // In a real app, you might show a modal with more details
    }
}

// --- Payment Tracking ---
function renderPaymentHistory() {
    const tbody = document.getElementById('payment-history-list');
    if (!tbody) return;
    // This is static for now, in a real app, it would be dynamic
    tbody.innerHTML = `
        <tr>
            <td>05/07/2023</td>
            <td>Gói Premium 6 tháng</td>
            <td>5.000.000đ</td>
            <td class="status-paid"><i class="fas fa-check-circle"></i> Đã thanh toán</td>
        </tr>
        <tr>
            <td>15/06/2023</td>
            <td>Phí gia hạn</td>
            <td>800.000đ</td>
            <td class="status-paid"><i class="fas fa-check-circle"></i> Đã thanh toán</td>
        </tr>
    `;
    // Calculate total spent (static for now)
    document.getElementById('total-spent').innerText = '5.800.000đ';
}

// --- Package Management ---
function renderAvailablePackages() {
    const container = document.getElementById('available-packages');
    if (!container) return;
    container.innerHTML = packages.map(pkg => `
        <div class="package-card">
            <div class="package-header">
                <h3>${pkg.name}</h3>
                <span class="package-price">${pkg.price}</span>
            </div>
            <div class="package-details">
                <p><i class="fas fa-check-circle"></i> ${pkg.sessions} buổi tập</p>
                <p><i class="fas fa-check-circle"></i> ${pkg.benefit}</p>
            </div>
            <div class="package-footer">
                <span class="package-expiry">Thời hạn: ${pkg.name.includes('6 tháng') ? '6 tháng' : pkg.name.includes('3 tháng') ? '3 tháng' : '1 tháng'}</span>
                <button class="btn btn-primary">Đăng ký ngay</button>
            </div>
        </div>
    `).join('');
}

function renderUserPackageDisplay() {
    const userPackageDisplay = document.getElementById('user-package-display');
    if (!userPackageDisplay) return;

    if (currentUser && currentUser.role === 'member') {
        const memberInfo = members.find(m => m.id === currentUser.id);
        if (memberInfo && memberInfo.package !== 'Chưa có gói') {
            // This is a simplified display. In a real app, you'd track actual sessions used and expiry date.
            const currentPackage = packages.find(p => memberInfo.package.includes(p.name.split(' ')[0]));
            const sessionsUsed = 9; // Demo value
            const totalSessions = currentPackage ? currentPackage.sessions : 36;
            const progressPercentage = (sessionsUsed / totalSessions) * 100;

            userPackageDisplay.innerHTML = `
                <div class="package-card current-package">
                    <div class="package-header">
                        <h3>${memberInfo.package}</h3>
                        <span class="package-price">${currentPackage ? currentPackage.price : 'N/A'}</span>
                    </div>
                    <div class="package-details">
                        <p><i class="fas fa-check-circle"></i> ${currentPackage ? currentPackage.sessions : 'N/A'} buổi tập</p>
                        <p><i class="fas fa-check-circle"></i> ${currentPackage ? currentPackage.benefit : 'N/A'}</p>
                    </div>
                    <div class="package-footer">
                        <span class="package-expiry">Hết hạn: 05/01/2024</span>
                        <button class="btn btn-primary">Gia hạn ngay</button>
                    </div>
                </div>
                <div class="progress-container">
                    <h4>Tiến độ sử dụng gói tập</h4>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${progressPercentage}%"></div>
                    </div>
                    <span class="progress-text">${sessionsUsed}/${totalSessions} buổi đã sử dụng (${progressPercentage.toFixed(0)}%)</span>
                </div>
            `;
        } else {
            userPackageDisplay.innerHTML = `
                <div class="package-card">
                    <div class="profile-placeholder">
                        <i class="fas fa-box-open"></i>
                        <h3>Bạn chưa có gói tập nào</h3>
                        <p>Hãy khám phá các gói tập của chúng tôi để bắt đầu hành trình rèn luyện sức khỏe!</p>
                        <button class="btn btn-primary mt-3" onclick="showPage('package')">Xem gói tập</button>
                    </div>
                </div>
            `;
        }
    } else {
        userPackageDisplay.innerHTML = ''; // Hide if not a member
    }
}


// --- Feedback & Review ---
function sendFeedback(event) {
    event.preventDefault();
    const subject = document.getElementById('feedback-subject').value;
    const content = document.getElementById('feedback-content').value;
    const resultDiv = document.getElementById('feedback-result');

    if (!subject || !content) {
        resultDiv.className = 'form-message error';
        resultDiv.innerText = 'Vui lòng điền đầy đủ chủ đề và nội dung phản hồi.';
        return false;
    }

    // Simulate sending feedback
    setTimeout(() => {
        resultDiv.className = 'form-message success';
        resultDiv.innerText = 'Cảm ơn bạn đã gửi phản hồi! Chúng tôi sẽ xem xét sớm nhất.';
        document.getElementById('feedback-subject').value = '';
        document.getElementById('feedback-content').value = '';
        showToast('Phản hồi của bạn đã được gửi thành công!');
    }, 500);
    return false;
}

let currentRating = 0;
document.addEventListener('DOMContentLoaded', () => {
    const starRatingDiv = document.getElementById('review-rating');
    if (starRatingDiv) {
        starRatingDiv.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('fa-star')) {
                const value = parseInt(e.target.dataset.value);
                highlightStars(value);
            }
        });
        starRatingDiv.addEventListener('mouseout', () => {
            highlightStars(currentRating);
        });
        starRatingDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('fa-star')) {
                currentRating = parseInt(e.target.dataset.value);
                highlightStars(currentRating);
            }
        });
    }
});

function highlightStars(rating) {
    const stars = document.querySelectorAll('#review-rating .fa-star');
    stars.forEach(star => {
        if (parseInt(star.dataset.value) <= rating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

function sendReview(event) {
    event.preventDefault();
    const reviewType = document.getElementById('review-type').value;
    const reviewTargetName = document.getElementById('review-target-name').value;
    const reviewContent = document.getElementById('review-content').value;
    const resultDiv = document.getElementById('review-result');

    if (!reviewType || !reviewContent || currentRating === 0) {
        resultDiv.className = 'form-message error';
        resultDiv.innerText = 'Vui lòng chọn đối tượng, đánh giá sao và nhập nội dung đánh giá.';
        return false;
    }

    // Simulate sending review
    setTimeout(() => {
        resultDiv.className = 'form-message success';
        resultDiv.innerText = `Đã gửi đánh giá ${currentRating} sao cho ${reviewTargetName || reviewType}! Cảm ơn bạn.`;
        document.getElementById('review-type').value = '';
        document.getElementById('review-target-name').value = '';
        document.getElementById('review-content').value = '';
        currentRating = 0;
        highlightStars(0);
        showToast('Đánh giá của bạn đã được gửi thành công!');
    }, 500);
    return false;
}

// --- Account Management (Admin Only) ---
function renderAccounts() {
    const tbody = document.getElementById('account-list');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.username}</td>
            <td>${u.fullname || 'N/A'}</td>
            <td>${u.email || 'N/A'}</td>
            <td>${u.role}</td>
            <td>
                <button onclick="editAccount(${u.id})">Sửa</button>
                <button onclick="deleteAccount(${u.id})">Xóa</button>
            </td>
        </tr>
    `).join('');
}

function showAddAccountModal() {
    editingAccountId = null;
    const formHtml = `
        <form id="account-form-modal" onsubmit="saveAccount(event)">
            <div class="form-group">
                <label for="acc-username">Tên đăng nhập:</label>
                <input type="text" id="acc-username" class="form-control" placeholder="Tên đăng nhập" required>
            </div>
            <div class="form-group">
                <label for="acc-fullname">Họ tên:</label>
                <input type="text" id="acc-fullname" class="form-control" placeholder="Họ tên">
            </div>
            <div class="form-group">
                <label for="acc-email">Email:</label>
                <input type="email" id="acc-email" class="form-control" placeholder="Email">
            </div>
            <div class="form-group">
                <label for="acc-password">Mật khẩu (để trống nếu không đổi):</label>
                <input type="password" id="acc-password" class="form-control" placeholder="Mật khẩu">
            </div>
            <div class="form-group">
                <label for="acc-role">Quyền:</label>
                <select id="acc-role" class="form-control" required>
                    <option value="admin">Admin</option>
                    <option value="trainer">Huấn luyện viên</option>
                    <option value="member">Hội viên</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary">Lưu</button>
            <button type="button" class="btn btn-secondary" onclick="hideModal()">Hủy</button>
        </form>
    `;
    showModal('Thêm/Sửa Tài khoản', formHtml);
}

function saveAccount(event) {
    event.preventDefault();
    const username = document.getElementById('acc-username').value;
    const fullname = document.getElementById('acc-fullname').value;
    const email = document.getElementById('acc-email').value;
    const password = document.getElementById('acc-password').value; // Optional
    const role = document.getElementById('acc-role').value;

    if (!username || !role) {
        showToast('Vui lòng nhập đầy đủ Tên đăng nhập và Quyền!', 'error');
        return;
    }

    if (editingAccountId) {
        const u = users.find(x => x.id === editingAccountId);
        if (u) {
            u.username = username;
            u.fullname = fullname;
            u.email = email;
            if (password) u.password = password; // Only update if password is provided
            u.role = role;
            showToast('Cập nhật tài khoản thành công!');
        }
    } else {
        if (!password) {
            showToast('Vui lòng nhập mật khẩu cho tài khoản mới!', 'error');
            return;
        }
        if (users.some(u => u.username === username)) {
            showToast('Tên đăng nhập đã tồn tại!', 'error');
            return;
        }
        users.push({
            id: Date.now(),
            username, fullname, email, password, role
        });
        showToast('Thêm tài khoản thành công!');
    }
    saveToLocalStorage();
    hideModal();
    renderAccounts();
}

function editAccount(id) {
    const u = users.find(x => x.id === id);
    if (u) {
        editingAccountId = id;
        showAddAccountModal();
        setTimeout(() => {
            document.getElementById('acc-username').value = u.username;
            document.getElementById('acc-fullname').value = u.fullname || '';
            document.getElementById('acc-email').value = u.email || '';
            document.getElementById('acc-role').value = u.role;
            // Password field intentionally left blank for security
        }, 50);
    }
}

function deleteAccount(id) {
    if (confirm('Bạn chắc chắn muốn xóa tài khoản này?')) {
        users = users.filter(x => x.id !== id);
        saveToLocalStorage();
        renderAccounts();
        showToast('Đã xóa tài khoản!');
    }
}

// --- Schedule Management ---
function renderSchedules() {
    const tbody = document.getElementById('schedule-list');
    if (!tbody) return;
    tbody.innerHTML = schedules.map(sch => `
        <tr>
            <td>${sch.member}</td>
            <td>${sch.trainer}</td>
            <td>${sch.date}</td>
            <td>${sch.time}</td>
            <td>${sch.status}</td>
            <td>
                <button onclick="editSchedule(${sch.id})">Sửa</button>
                <button onclick="deleteSchedule(${sch.id})">Xóa</button>
            </td>
        </tr>
    `).join('');
}

function showAddScheduleModal() {
    editingScheduleId = null;
    const formHtml = `
        <form id="schedule-form-modal" onsubmit="saveSchedule(event)">
            <div class="form-group">
                <label for="sch-member">Hội viên:</label>
                <input type="text" id="sch-member" class="form-control" placeholder="Hội viên" required>
            </div>
            <div class="form-group">
                <label for="sch-trainer">Huấn luyện viên:</label>
                <input type="text" id="sch-trainer" class="form-control" placeholder="Huấn luyện viên" required>
            </div>
            <div class="form-group">
                <label for="sch-date">Ngày:</label>
                <input type="date" id="sch-date" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="sch-time">Giờ:</label>
                <input type="time" id="sch-time" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="sch-status">Trạng thái:</label>
                <select id="sch-status" class="form-control">
                    <option value="Chưa tập">Chưa tập</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Đã hủy">Đã hủy</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary">Lưu</button>
            <button type="button" class="btn btn-secondary" onclick="hideModal()">Hủy</button>
        </form>
    `;
    showModal('Thêm/Sửa Lịch tập', formHtml);
}

function saveSchedule(event) {
    event.preventDefault();
    const member = document.getElementById('sch-member').value;
    const trainer = document.getElementById('sch-trainer').value;
    const date = document.getElementById('sch-date').value;
    const time = document.getElementById('sch-time').value;
    const status = document.getElementById('sch-status').value;

    if (!member || !trainer || !date || !time) {
        showToast('Vui lòng nhập đầy đủ thông tin lịch tập!', 'error');
        return;
    }

    if (editingScheduleId) {
        const sch = schedules.find(s => s.id === editingScheduleId);
        if (sch) {
            sch.member = member;
            sch.trainer = trainer;
            sch.date = date;
            sch.time = time;
            sch.status = status;
            showToast('Cập nhật lịch tập thành công!');
        }
    } else {
        schedules.push({
            id: Date.now(),
            member, trainer, date, time, status
        });
        showToast('Thêm lịch tập thành công!');
    }
    saveToLocalStorage();
    hideModal();
    renderSchedules();
}

function editSchedule(id) {
    const sch = schedules.find(s => s.id === id);
    if (sch) {
        editingScheduleId = id;
        showAddScheduleModal();
        setTimeout(() => {
            document.getElementById('sch-member').value = sch.member;
            document.getElementById('sch-trainer').value = sch.trainer;
            document.getElementById('sch-date').value = sch.date;
            document.getElementById('sch-time').value = sch.time;
            document.getElementById('sch-status').value = sch.status;
        }, 50);
    }
}

function deleteSchedule(id) {
    if (confirm('Bạn chắc chắn muốn xóa lịch tập này?')) {
        schedules = schedules.filter(x => x.id !== id);
        saveToLocalStorage();
        renderSchedules();
        showToast('Đã xóa lịch tập!');
    }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial data setup if localStorage is empty (for demo purposes)
    if (users.length === 0) {
        users.push({ id: 1, username: 'admin', fullname: 'Quản trị viên', email: 'admin@gym.com', password: 'admin', role: 'admin' });
        users.push({ id: 2, username: 'member1', fullname: 'Nguyễn Văn A', email: 'vana@gym.com', password: '123', role: 'member' });
        users.push({ id: 3, username: 'trainer1', fullname: 'Trần Văn B', email: 'vanb@gym.com', password: '123', role: 'trainer' });
        saveToLocalStorage();
    }
    if (members.length === 0) {
        members.push({ id: 2, name: "Nguyễn Văn A", dob: "1990-01-01", phone: "0987654321", email: "vana@gym.com", package: "Premium 6 tháng", trainer: "Trần Văn B" });
        members.push({ id: 4, name: "Trần Thị B", dob: "1995-12-03", phone: "0912345678", email: "tranthib@gmail.com", package: "Standard 3 tháng", trainer: "Trần Văn B" });
        saveToLocalStorage();
    }
    if (trainers.length === 0) {
        trainers.push({ id: 3, name: "Trần Văn B", specialization: "Chuyên gia thể hình", students: 2, experience: "5 năm", phone: "0901234567", email: "vanb@gym.com" });
        trainers.push({ id: 5, name: "Nguyễn Văn D", specialization: "PT cá nhân", students: 1, experience: "3 năm", phone: "0912345678", email: "nguyenvand@gmail.com" });
        trainers.push({ id: 3, name: "Trần Văn H", specialization: "Giáo viên yoga", students: 19, experience: "5 năm", phone: "0965755434", email: "vanh@gym.com" });
        trainers.push({ id: 5, name: "Nguyễn Văn N", specialization: "Giáo viên yoga", students: 12, experience: "3 năm", phone: "0912345678", email: "nguyenvann@gmail.com" });
        saveToLocalStorage();
    }
    if (schedules.length === 0) {
        schedules.push({ id: 1, member: "Nguyễn Văn A", trainer: "Trần Văn B", date: "2025-08-07", time: "07:00", status: "Hoàn thành" });
        schedules.push({ id: 2, member: "Trần Thị B", trainer: "Trần Văn B", date: "2025-08-08", time: "17:00", status: "Chưa tập" });
        schedules.push({ id: 3, member: "Lê Văn C", trainer: "Nguyễn Văn D", date: "2025-08-09", time: "09:00", status: "Hoàn thành" });
        saveToLocalStorage();
    }

    showPage('home'); // Default to home page
    // Check if user was logged in from previous session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        isLoggedIn = true;
        document.getElementById('nav-public').classList.add('hidden');
        document.getElementById('nav-private').classList.remove('hidden');
        document.getElementById('current-username').innerText = currentUser.username;
        updateNavVisibility();
    }
});

