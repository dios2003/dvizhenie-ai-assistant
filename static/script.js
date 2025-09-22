document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM полностью загружен, инициализация чата...');
    
    let isProcessing = false;
    let chatSessionStarted = false;

    function getElementSafe(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Элемент с ID '${id}' не найден!`);
        }
        return element;
    }

    const elements = [
        'ai-chat-container', 'ai-chat-toggle', 'ai-chat-minimize',
        'ai-chat-close', 'ai-chat-messages', 'ai-chat-input',
        'ai-chat-send', 'ai-chat-form'
    ].map(id => getElementSafe(id));

    const [
        chatContainer, chatToggle, chatMinimize,
        chatClose, chatMessages, chatInput,
        chatSend, chatForm
    ] = elements;

    if (!chatContainer || !chatMessages) {
        console.error('Критические элементы чата не найдены!');
        return;
    }
    
    function isStorageSupported(type) {
        try {
            const test = 'test';
            const storage = window[type];
            storage.setItem(test, test);
            storage.removeItem(test);
            return true;
        } catch (e) {
            console.warn(`${type} не поддерживается:`, e);
            return false;
        }
    }
    
    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function startChatSession() {
        if (chatSessionStarted) return;
        
        chatSessionStarted = true;
        
        // Массив приветственных сообщений для разнообразия
        const welcomeMessages = [
            "Привет! Рад вас видеть! Меня зовут Ренат. Чем могу помочь?",
            "Добро пожаловать! Меня зовут Ренат.Готов ответить на ваши вопросы.",
            "Здравствуйте!Меня зовут Ренат.Я ваш AI-помощник. Чем могу быть полезен?",
            "Приветствую!Меня зовут Ренат. Как я могу помочь вам сегодня?",
            "Здравствуйте! Меня зовут Ренат. Рад начать с вами диалог. Что вас интересует?"
        ];
        
        // Выбираем случайное приветственное сообщение
        const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        
        // Добавляем небольшую задержку для имитации "загрузки"
        setTimeout(() => {
            addMessage(randomWelcome, 'ai');
            
            // Дополнительное сообщение с предложениями
            setTimeout(() => {
                addMessage("Вы можете спросить меня о продуктах, о производителях", 'ai');
            }, 800);
        }, 500);
    }
    
    function autoOpenChat() {
        if (isStorageSupported('sessionStorage') && !sessionStorage.getItem('chatGreetingShown')) {
            chatContainer.classList.add('open');
            sessionStorage.setItem('chatGreetingShown', 'true');
            
            // Запускаем сессию при открытии чата
            setTimeout(startChatSession, 300);
        }
    }
    
    // Автоматически запускаем сессию при загрузке страницы
    function initChatSession() {
        if (isStorageSupported('localStorage')) {
            const lastSession = localStorage.getItem('lastChatSession');
            const now = Date.now();
            
            // Запускаем сессию, если прошло больше 30 минут с последней сессии
            // или если это первый визит
            if (!lastSession || (now - parseInt(lastSession)) > 1800000) {
                startChatSession();
                localStorage.setItem('lastChatSession', now.toString());
            }
        } else {
            // Если localStorage не поддерживается, просто запускаем сессию
            startChatSession();
        }
    }
    
    // Показываем уведомление о новом сообщении если чат свернут
    function showNotification() {
        if (!chatContainer.classList.contains('open')) {
            // Создаем уведомление (можно стилизовать через CSS)
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 100px;
                right: 20px;
                background: #007bff;
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                cursor: pointer;
                animation: fadeIn 0.3s ease;
            `;
            notification.textContent = '💬 AI-помощник готов к общению!';
            notification.onclick = () => {
                chatContainer.classList.add('open');
                document.body.removeChild(notification);
            };
            
            document.body.appendChild(notification);
            
            // Автоматически скрываем через 5 секунд
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 5000);
        }
    }
    
    // Обработка Enter
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatSend.click();
            }
        });
    }
    
    if (chatToggle) {
        chatToggle.addEventListener('click', function() {
            chatContainer.classList.toggle('open');
            
            // Если чат открывается и сессия еще не начата, запускаем её
            if (chatContainer.classList.contains('open') && !chatSessionStarted) {
                startChatSession();
            }
        });
    }
    
    if (chatMinimize) {
        chatMinimize.addEventListener('click', function() {
            chatContainer.classList.remove('open');
        });
    }
    
    if (chatClose) {
        chatClose.addEventListener('click', function() {
            chatContainer.classList.remove('open');
            sessionStorage.removeItem('chatGreetingShown');
        });
    }
    
    if (chatForm) {
        chatForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (isProcessing) return;
            
            const userMessage = chatInput.value.trim();
            if (!userMessage) return;
            
            isProcessing = true;
            chatSend.disabled = true;
            
            const loadingIndicator = document.createElement('div');
            loadingIndicator.classList.add('message', 'ai-message', 'loading');
            loadingIndicator.textContent = 'ИИ думает...';
            chatMessages.appendChild(loadingIndicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            addMessage(userMessage, 'user');
            chatInput.value = '';
            
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: userMessage})
                });
                
                chatMessages.removeChild(loadingIndicator);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.reply && !data.reply.includes('Произошла ошибка:')) {
                    addMessage(data.reply, 'ai');
                } else {
                    addMessage('Извините, произошла ошибка. Попробуйте позже.', 'ai');
                }
            } catch (error) {
                console.error('Error:', error);
                addMessage('Извините, произошла ошибка. Попробуйте позже.', 'ai');
            } finally {
                isProcessing = false;
                chatSend.disabled = false;
            }
        });
    }
    
    // Инициализируем чат при загрузке
    autoOpenChat();
    
    // Запускаем сессию с небольшой задержкой после загрузки страницы
    setTimeout(() => {
        initChatSession();
        showNotification();
    }, 2000);
});

// Добавляем CSS анимацию для уведомления
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);