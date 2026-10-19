// Centralized notification system
function showToast(message, type = 'success') {
    // Tạo container nếu chưa có
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Tạo toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Tự động xóa sau 3.5s
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Global logout helper
async function handleLogout() {
    await fetch('api/auth.php?action=logout');
    showToast('Đã đăng xuất thành công', 'success');
    setTimeout(() => window.location.href = 'login.html', 800);
}
