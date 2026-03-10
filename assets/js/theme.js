// ==== THEME MANAGEMENT ====
let currentTheme = localStorage.getItem('theme') || 'auto';

// Khởi tạo theme
function initTheme() {
  const themeBtns = document.querySelectorAll('.theme-btn');
  
  // Xóa active class từ tất cả buttons
  themeBtns.forEach(btn => btn.classList.remove('active'));
  
  // Thêm active class cho button hiện tại
  const activeBtn = document.querySelector(`[data-theme="${currentTheme}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  
  // Áp dụng theme
  applyTheme(currentTheme);
}

// Áp dụng theme
function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'auto') {
    // Tự động theo system preference
    root.removeAttribute('data-theme');
  } else {
    // Áp dụng theme cụ thể
    root.setAttribute('data-theme', theme);
  }
  
  // Lưu vào localStorage
  localStorage.setItem('theme', theme);
  currentTheme = theme;
}

// Chuyển đổi theme
function switchTheme(theme) {
  applyTheme(theme);
  initTheme();
}

// Event listeners cho theme buttons
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  
  // Thêm event listeners cho theme buttons
  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const theme = this.getAttribute('data-theme');
      switchTheme(theme);
    });
  });
  
  // Theo dõi thay đổi system preference
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', function(e) {
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
}); 