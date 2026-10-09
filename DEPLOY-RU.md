# 🚀 Деплой на VPS - Финальная инструкция

## Что изменилось

✅ **Убрана серверная часть** - всё работает в браузере  
✅ **Офлайн-режим** - расписание сохраняется в localStorage  
✅ **Автообновление** каждые 15 минут  
✅ **Пошаговая фильтрация рейтинга** - факультет → группа → предмет → студенты  
✅ **Индикатор онлайн/офлайн** статуса  
✅ **Кэширование** данных (расписание - постоянно, рейтинг - 30 минут)  

---

## Способ 1: Docker (самый простой) ⭐

```bash
# На VPS:
git clone <your-repo> timetable
cd timetable
docker-compose up -d
```

Готово! Откройте `http://your-vps-ip`

---

## Способ 2: Nginx (без Docker)

### 1. Установите Nginx
```bash
sudo apt update
sudo apt install nginx
```

### 2. Соберите приложение (локально или на VPS)
```bash
npm install
npm run build
```

### 3. Загрузите на VPS
```bash
# Локально:
scp -r dist/* user@your-vps-ip:/tmp/timetable/

# На VPS:
sudo mkdir -p /var/www/timetable
sudo mv /tmp/timetable/* /var/www/timetable/
sudo chown -R www-www-data /var/www/timetable
```

### 4. Настройте Nginx
```bash
sudo nano /etc/nginx/sites-available/timetable
```

Вставьте содержимое из `nginx.conf`

```bash
sudo ln -s /etc/nginx/sites-available/timetable /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Настройте файрвол
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Готово! Откройте `http://your-vps-ip`

---

## Способ 3: С доменом и SSL

```bash
# 1. Укажите домен в DNS (A-запись на IP VPS)

# 2. Установите Certbot
sudo apt install certbot python3-certbot-nginx

# 3. Получите SSL сертификат
sudo certbot --nginx -d your-domain.com
```

---

## Обновление приложения

### Docker:
```bash
docker-compose down
docker-compose up -d --build
```

### Nginx:
```bash
# Загрузите новые файлы
scp -r dist/* user@your-vps-ip:/var/www/timetable/

# Перезагрузите Nginx (опционально)
sudo systemctl reload nginx
```

---

## Как это работает

### Расписание
1. Пользователь выбирает группу
2. Приложение делает запрос к timetable.vsuet.ru через CORS-прокси
3. HTML парсится в браузере
4. Расписание сохраняется в localStorage
5. Автообновление каждые 15 минут
6. При отсутствии интернета используется кэш

### Рейтинг
1. Пользователь выбирает факультет → группу → семестр
2. Загружается список предметов
3. Пользователь выбирает предмет
4. Загружается список студентов с зачётками и рейтингом
5. Данные кэшируются на 30 минут

### CORS-прокси
Используются публичные прокси:
- https://api.allorigins.win/
- https://corsproxy.io/

Если они недоступны - включите демо-режим в настройках.

---

## Проверка работы

1. Откройте `http://your-vps-ip`
2. Выберите группу
3. Проверьте вкладку "Расписание"
4. Проверьте вкладку "Рейтинг":
   - Выберите группу и семестр
   - Выберите предмет
   - Посмотрите список студентов
5. Отключите интернет - должно работать офлайн!

---

## Troubleshooting

### Сайт не открывается
```bash
# Проверьте Nginx
sudo systemctl status nginx

# Проверьте логи
sudo tail -f /var/log/nginx/error.log

# Проверьте порты
sudo ufw status
```

### Рейтинг не загружается
- CORS-прокси могут быть недоступны
- Включите демо-режим в настройках
- Проверьте подключение к интернету

### Расписание не обновляется
- Проверьте подключение к интернету
- Нажмите кнопку обновления
- Проверьте консоль браузера (F12)

### Белый экран
- Очистите кэш браузера
- Проверьте консоль на ошибки
- Пересоберите приложение: `npm run build`

---

## Полезные команды

```bash
# Docker
docker-compose ps              # Статус
docker-compose logs -f         # Логи
docker-compose restart         # Перезапуск

# Nginx
sudo systemctl status nginx    # Статус
sudo systemctl reload nginx    # Перезагрузка конфига
sudo tail -f /var/log/nginx/error.log  # Логи

# Очистить кэш приложения (в консоли браузера)
localStorage.clear()
```

---

## Структура на VPS

```
/var/www/timetable/          # Статические файлы
├── index.html
└── assets/
    ├── index-xxxxx.css
    └── index-xxxxx.js

/etc/nginx/sites-available/
└── timetable                # Конфиг Nginx
```

---

## Безопасность

### Включите HTTPS (обязательно!)
```bash
sudo certbot --nginx -d your-domain.com
```

### Добавьте rate limiting (опционально)
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

Готово! Ваше приложение развернуто и работает! 🎉

**Особенности:**
- ✅ Работает без серверной части
- ✅ Офлайн-режим с кэшированием
- ✅ Автообновление каждые 15 минут
- ✅ Пошаговая фильтрация рейтинга
- ✅ Индикатор онлайн/офлайн статуса
- ✅ Простой деплой (просто статические файлы)
