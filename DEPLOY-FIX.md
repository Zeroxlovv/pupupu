# 🚀 ДЕПЛОЙ НА VPS - РАБОЧАЯ ИНСТРУКЦИЯ

## ✅ Что исправлено
- Добавлены отсутствующие файлы (GroupSelector.tsx, Settings.tsx)
- Убрана серверная часть - всё работает в браузере
- Офлайн-режим с кэшированием
- Автообновление каждые 15 минут
- Пошаговая фильтрация рейтинга

---

## 📦 СПОСОБ 1: Docker (рекомендуется) ⭐

### На вашем VPS:

```bash
# 1. Установите Docker (если ещё не установлен)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Перелогиньтесь!

# 2. Клонируйте/скопируйте проект
git clone <your-repo> timetable
cd timetable

# 3. Запустите одной командой
docker-compose up -d

# 4. Проверьте статус
docker-compose ps
```

**Готово!** Откройте `http://your-vps-ip` в браузере.

---

## 📦 СПОСОБ 2: Nginx (без Docker)

### 1. Установите Nginx
```bash
sudo apt update
sudo apt install nginx
```

### 2. Соберите приложение (локально или на VPS)
```bash
# Убедитесь что Node.js 18+ установлен
node --version  # Должна быть 18+

# Установите зависимости
npm install

# Соберите
npm run build
```

### 3. Загрузите на VPS
```bash
# Локально (замените user и ip):
scp -r dist/* user@your-vps-ip:/tmp/timetable/

# На VPS:
sudo mkdir -p /var/www/timetable
sudo cp -r /tmp/timetable/* /var/www/timetable/
sudo chown -R www-www-data /var/www/timetable
```

### 4. Настройте Nginx
```bash
sudo nano /etc/nginx/sites-available/timetable
```

Вставьте содержимое из файла `nginx.conf` (он в корне проекта)

```bash
# Активируйте сайт
sudo ln -s /etc/nginx/sites-available/timetable /etc/nginx/sites-enabled/

# Проверьте конфиг
sudo nginx -t

# Перезагрузите Nginx
sudo systemctl reload nginx
```

### 5. Настройте файрвол
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**Готово!** Откройте `http://your-vps-ip`

---

## 🔧 ТРУБЛУШУТИНГ

### Ошибка "build failed" при npm run build

**Решение 1:** Проверьте версию Node.js
```bash
node --version  # Должна быть 18+
npm --version
```

Если версия старая, обновите:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Решение 2:** Очистите кэш и переустановите
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Решение 3:** Проверьте что все файлы на месте
```bash
ls -la src/components/
# Должны быть: GroupSelector.tsx, Settings.tsx, ScheduleView.tsx, RatingView.tsx
```

### Приложение не грузится (белый экран)

**Причина 1:** CORS-прокси недоступны
- Откройте консоль браузера (F12)
- Проверьте ошибки
- Включите демо-режим в настройках

**Причина 2:** Неправильный путь к файлам
```bash
# Проверьте что файлы на месте
ls -la /var/www/timetable/
# Должны быть: index.html, assets/
```

**Причина 3:** Nginx не настроен
```bash
# Проверьте конфиг
sudo nginx -t

# Проверьте логи
sudo tail -f /var/log/nginx/error.log
```

### Рейтинг не загружается

- CORS-прокси могут быть недоступны
- Включите демо-режим в настройках
- Проверьте подключение к интернету

### Расписание не обновляется

- Нажмите кнопку обновления (↻)
- Проверьте подключение к интернету
- Очистите кэш: в консоли браузера (F12) выполните `localStorage.clear()`

---

## 🔄 ОБНОВЛЕНИЕ ПРИЛОЖЕНИЯ

### Docker:
```bash
cd timetable
docker-compose down
docker-compose up -d --build
```

### Nginx:
```bash
# Локально:
npm run build
scp -r dist/* user@your-vps-ip:/var/www/timetable/

# На VPS (опционально):
sudo systemctl reload nginx
```

---

## 📱 ANDROID ПРИЛОЖЕНИЕ

### Сборка APK:

1. Откройте `android-project/` в Android Studio
2. Скопируйте файлы из `dist/` в `app/src/main/assets/web/`
3. Build → Generate Signed Bundle / APK
4. APK будет в `app/release/`

---

## ✅ ПРОВЕРКА РАБОТЫ

1. Откройте `http://your-vps-ip`
2. Выберите группу
3. Проверьте вкладку "Расписание"
4. Проверьте вкладку "Рейтинг":
   - Выберите группу и семестр
   - Выберите предмет
   - Посмотрите список студентов
5. Отключите интернет - должно работать офлайн!

---

## 📊 МОНИТОРИНГ

### Docker:
```bash
docker-compose ps              # Статус контейнеров
docker-compose logs -f         # Логи в реальном времени
docker-compose restart         # Перезапуск
```

### Nginx:
```bash
sudo systemctl status nginx    # Статус
sudo tail -f /var/log/nginx/error.log  # Логи ошибок
sudo tail -f /var/log/nginx/access.log # Логи доступа
```

---

## 🔐 БЕЗОПАСНОСТЬ

### Включите HTTPS (обязательно!)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Добавьте rate limiting (опционально)
В nginx.conf добавьте:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
    location / {
        limit_req zone=api burst=20;
        # ... остальная конфигурация
    }
}
```

---

## 📁 СТРУКТУРА ПРОЕКТА

```
.
├── src/                          # Исходный код
│   ├── api/                      # API клиенты
│   ├── components/               # React компоненты
│   ├── store/                    # Zustand store
│   └── App.tsx                   # Главный компонент
├── dist/                         # Собранные файлы (для деплоя)
├── android-project/              # Android Studio проект
├── Dockerfile                    # Docker конфиг
├── docker-compose.yml            # Docker Compose
├── nginx.conf                    # Nginx конфиг
├── package.json                  # Зависимости
└── README.md                     # Описание
```

---

## 🎯 ИТОГО

**Для быстрого деплоя:**
```bash
# На VPS:
git clone <your-repo> timetable
cd timetable
docker-compose up -d
```

**Всё!** Откройте `http://your-vps-ip` - приложение работает! 🎉

---

## 📞 ПОДДЕРЖКА

Если что-то не работает:
1. Проверьте логи (docker-compose logs или /var/log/nginx/)
2. Проверьте консоль браузера (F12)
3. Убедитесь что все файлы на месте
4. Попробуйте очистить кэш браузера

**Основные файлы:**
- `DEPLOY-RU.md` - эта инструкция
- `README.md` - описание проекта
- `nginx.conf` - конфиг Nginx
- `docker-compose.yml` - Docker конфиг

---

Удачи с деплоем! 🚀
