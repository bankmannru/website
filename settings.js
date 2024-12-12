// Функции для работы с настройками
function applyTheme(theme) {
  const body = document.body;
  switch(theme) {
      case 'dark':
          body.style.background = 'linear-gradient(45deg, #1a1a1a, #2d2d2d)';
          break;
      case 'light':
          body.style.background = 'linear-gradient(45deg, #f0f0f0, #e0e0e0)';
          break;
      default:
          body.style.background = '';
          break;
  }
}

// Загрузка и применение настроек при загрузке любой страницы
function loadSettings() {
  const savedTheme = localStorage.getItem('theme');
  const savedLanguage = localStorage.getItem('language');

  if (savedTheme) {
      applyTheme(savedTheme);
  }
  if (savedLanguage) {
      // Здесь можно добавить логику для изменения языка
  }
}

// Запускаем загрузку настроек при загрузке страницы
document.addEventListener('DOMContentLoaded', loadSettings);

    function sendNotification() {
        if (Notification.permission === 'granted') {
            new Notification('Не пропустите! Посетите наш сайт прямо сейчас!');
        }
    }

    // Запрашиваем разрешение на уведомления при загрузке страницы
    window.onload = function() {
 
        Notification.requestPermission();
        

        setInterval(sendNotification, 10000);
    };