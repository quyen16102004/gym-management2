// This is the JavaScript file for the front-end3 application.
// It handles user interactions, manages page visibility, and implements functionality for login, registration, and member management.

let users = [];
let isLoggedIn = false;
let currentUser = null;

function showPage(pageId) {
    if (!isLoggedIn && pageId !== 'login' && pageId !== 'home') {
        alert('Vui lòng đăng nhập để tiếp tục');
        return;
    }
    // Hide all pages and remove active from nav items
    const pages = document.querySelectorAll('.page');
    const navItems = document.querySelectorAll('nav a');

    pages.forEach(page => page.classList.add('hidden'));
    navItems.forEach(item => item.classList.remove('active'));

    // Show selected page and mark nav as active
    document.getElementById(pageId).classList.remove('hidden');
    navItems.forEach(item => {
        if (item.onclick.toString().includes(pageId)) {
            item.classList.add('active');
        }
    });

    // Scroll to top 
    window.scrollTo(0, 0);
}

function login(event) {
    event.preventDefault();
    const username = document.querySelector('#login-tab input[type="text"]').value.trim();
    const password = document.querySelector('#login-tab input[type="password"]').value;

    if (username && password) {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            isLoggedIn = true;
            currentUser = user;
            document.getElementById('nav-public').classList.add('hidden');
            document.getElementById('nav-private').classList.remove('hidden');
            alert('Đăng nhập thành công! Quyền: ' + user.role);
            showPage('home');
        } else {
            alert('Sai tài khoản hoặc mật khẩu!');
        }
    } else {
        alert('Vui lòng nhập đầy đủ thông tin!');
    }
}

function register(event) {
    event.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm').value;
    const role = document.getElementById('reg-role').value;

    if (!username || !role) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    if (users.some(u => u.username === username)) {
        alert('Tên đăng nhập đã tồn tại!');
        return;
    }

    if (password !== confirmPassword) {
        alert('Mật khẩu không khớp!');
        return;
    }

    users.push({ username, password, role });
    alert('Đăng ký thành công! Vui lòng đăng nhập.');
    switchTab('login-tab');
}

function switchTab(tabId) {
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.add('hidden');
    });
    document.getElementById(tabId).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Member management
let members = [
    { id: 1, name: "Nguyễn Văn A", dob: "01/01/1990", phone: "0987654321", email: "nguyenvana@gmail.com", package: "Premium 6 tháng", trainer: "Trần Văn B" },
    { id: 1, name: "Nguyễn Văn A", dob: "01/01/1990", phone: "0987654321", email: "nguyenvana@gmail.com", package: "Premium 6 tháng", trainer: "Trần Văn B" },
    { id: 2, name: "Trần Thị B", dob: "12/03/1995", phone: "0912345678", email: "tranthib@gmail.com", package: "Standard 3 tháng", trainer: "Trần Văn B" },
    { id: 3, name: "Lê Văn C", dob: "22/08/1988", phone: "0901122334", email: "levanc@gmail.com", package: "Basic 1 tháng", trainer: "Nguyễn Văn D" },
    { id: 4, name: "Phạm Thị D", dob: "05/11/1992", phone: "0933445566", email: "phamthid@gmail.com", package: "Premium 6 tháng", trainer: "Nguyễn Văn D" }
];
let editingMemberId = null;

// Display member list
function renderMembers() {
    const tbody = document.getElementById('member-list');
    if (!tbody) return;
    tbody.innerHTML = members.map(m => `
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

// Show add/edit member form
function showAddMemberForm() {
    editingMemberId = null;
    document.getElementById('mem-name').value = '';
    document.getElementById('mem-dob').value = '';
    document.getElementById('mem-phone').value = '';
    document.getElementById('mem-email').value = '';
    document.getElementById('mem-package').value = '';
    document.getElementById('mem-trainer').value = '';
    document.getElementById('member-form').classList.remove('hidden');
}

function hideMemberForm() {
    document.getElementById('member-form').classList.add('hidden');
}

// Save new or updated member
function saveMember() {
    const name = document.getElementById('mem-name').value;
    const dob = document.getElementById('mem-dob').value;
    const phone = document.getElementById('mem-phone').value;
    const email = document.getElementById('mem-email').value;
    const packageName = document.getElementById('mem-package').value;
    const trainer = document.getElementById('mem-trainer').value;

    if (!name || !dob) {
        alert('Vui lòng nhập đủ thông tin!');
        return;
    }

    if (editingMemberId) {
        // Edit member
        const m = members.find(x => x.id === editingMemberId);
        m.name = name;
        m.dob = dob;
        m.phone = phone;
        m.email = email;
        m.package = packageName;
        m.trainer = trainer;
    } else {
        // Add new member
        members.push({
            id: Date.now(),
            name, dob, phone, email, package: packageName, trainer
        });
    }
    hideMemberForm();
    renderMembers();
}

// Edit member
function editMember(id) {
    const m = members.find(x => x.id === id);
    editingMemberId = id;
    document.getElementById('mem-name').value = m.name;
    document.getElementById('mem-dob').value = m.dob;
    document.getElementById('mem-phone').value = m.phone;
    document.getElementById('mem-email').value = m.email;
    document.getElementById('mem-package').value = m.package;
    document.getElementById('mem-trainer').value = m.trainer;
    document.getElementById('member-form').classList.remove('hidden');
}

// Delete member
function deleteMember(id) {
    if (confirm('Bạn chắc chắn muốn xóa hội viên này?')) {
        members = members.filter(x => x.id !== id);
        renderMembers();
    }
}

// Auto render when switching to member tab
document.querySelector('a[onclick*="showPage(\'member\')"]').addEventListener('click', function () {
    setTimeout(renderMembers, 100); // Wait for the page to show then render
})
// Chuyển trang
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

// Đăng xuất
function logout() {
    document.getElementById('nav-private').classList.add('hidden');
    document.getElementById('nav-public').classList.remove('hidden');
    showPage('home');
}

// Đăng nhập
function login(event) {
    event.preventDefault();
    document.getElementById('nav-public').classList.add('hidden');
    document.getElementById('nav-private').classList.remove('hidden');
    showPage('home');
    return false;
}

// Đăng ký
function register(event) {
    event.preventDefault();
    alert('Đăng ký thành công!');
    switchTab('login-tab');
    return false;
}

// Chuyển tab đăng nhập/đăng ký
function switchTab(tabId) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (tabId === 'login-tab') document.querySelector('.tab-btn').classList.add('active');
    else document.querySelectorAll('.tab-btn')[1].classList.add('active');
}

// Thêm/sửa hội viên
function showAddMemberForm() {
    document.getElementById('member-form').classList.remove('hidden');
}
function hideMemberForm() {
    document.getElementById('member-form').classList.add('hidden');
}
function saveMember() {
    hideMemberForm();
    alert('Đã lưu hội viên!');
}

// Phản hồi
function sendFeedback(event) {
    event.preventDefault();
    document.getElementById('feedback-result').innerText = 'Đã gửi phản hồi!';
    return false;
}

// Đánh giá
function sendReview(event) {
    event.preventDefault();
    document.getElementById('review-result').innerText = 'Đã gửi đánh giá!';
    return false;
}

// Quản lý tài khoản
function showAddAccountForm() {
    document.getElementById('account-form').classList.remove('hidden');
}
function hideAccountForm() {
    document.getElementById('account-form').classList.add('hidden');
}
function saveAccount() {
    hideAccountForm();
    alert('Đã lưu tài khoản!');
}

// Lịch cá nhân huấn luyện viên (chuyển chế độ xem)
function changeCalendarView() {
    // Xử lý chuyển chế độ xem lịch (ngày/tuần/tháng)
}
function changeCalendarDate() {
    // Xử lý chọn ngày xem lịch
}

// Mặc định hiển thị trang chủ
showPage('home');
// Demo dữ liệu gói tập
let packages = [
        { id: 1, name: "Premium 6 tháng", price: "5.000.000đ", sessions: 36, benefit: "Huấn luyện viên cá nhân, Đánh giá thể lực, Hỗ trợ dinh dưỡng" },
        { id: 2, name: "Standard 3 tháng", price: "2.500.000đ", sessions: 18, benefit: "Đánh giá thể lực, Hỗ trợ dinh dưỡng" },
        { id: 3, name: "Basic 1 tháng", price: "900.000đ", sessions: 6, benefit: "Hỗ trợ dinh dưỡng" }
    ];

    // Hiển thị danh sách gói tập demo
    function renderPackages() {
        const container = document.querySelector('.package-container');
        if (!container) return;
        container.innerHTML = packages.map(pkg => `
            <div class="package-card">
                <div class="package-header">
                    <h3>${pkg.name}</h3>
                    <span class="package-price">${pkg.price}</span>
                </div>
                <div class="package-details">
                    <p><i class="fas fa-check"></i> ${pkg.sessions} buổi tập</p>
                    <p><i class="fas fa-check"></i> ${pkg.benefit}</p>
                </div>
                <div class="package-footer">
                    <span class="package-expiry">Hết hạn: --/--/----</span>
                    <button class="btn btn-primary">Gia hạn</button>
                </div>
            </div>
        `).join('');
    }

    // Tự động render khi chuyển tab gói tập
    document.querySelector('a[onclick*="showPage(\'package\')"]').addEventListener('click', function () {
        setTimeout(renderPackages, 100);
    });
    // ...existing code...

let trainers = [
    { id: 1, name: "Trần Văn B", specialization: "Chuyên gia thể hình", students: 12, experience: "5 năm", phone: "0901234567", email: "tranvanb@gmail.com" },
    { id: 2, name: "Nguyễn Văn D", specialization: "PT cá nhân", students: 8, experience: "3 năm", phone: "0912345678", email: "nguyenvand@gmail.com" }
];

// Hiển thị danh sách huấn luyện viên demo
function renderTrainers() {
    const container = document.querySelector('.trainer-list');
    if (!container) return;
    container.innerHTML = trainers.map(tr => `
        <div class="trainer-card">
            <div class="trainer-details">
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
            </div>
        </div>
    `).join('');
}

// Tự động render khi chuyển tab huấn luyện viên
document.querySelector('a[onclick*="showPage(\'trainer\')"]').addEventListener('click', function () {
    setTimeout(renderTrainers, 100);
});
// ...existing code...

let schedules = [
    { id: 1, member: "Nguyễn Văn A", trainer: "Trần Văn B", date: "2025-08-07", time: "07:00", status: "Hoàn thành" },
    { id: 2, member: "Trần Thị B", trainer: "Trần Văn B", date: "2025-08-08", time: "17:00", status: "Chưa tập" },
    { id: 3, member: "Lê Văn C", trainer: "Nguyễn Văn D", date: "2025-08-09", time: "09:00", status: "Hoàn thành" }
];

// Hiển thị danh sách lịch tập demo
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
        </tr>
    `).join('');
}

// Tự động render khi chuyển tab quản lý lịch tập
document.querySelector('a[onclick*="showPage(\'manage-schedule\')"]').addEventListener('click', function () {
    setTimeout(renderSchedules, 100);
});
