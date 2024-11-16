document.addEventListener('DOMContentLoaded', () => {
    // 页面导航
    const navItems = document.querySelectorAll('.nav-item');
    const pages = ['index.html', 'lottery.html', 'history.html'];
    
    // 设置当前页面的激活状态
    const currentPath = location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
    
    // 为每个导航项添加点击事件
    navItems.forEach((item, index) => {
        // 设置当前页面的激活状态
        if (pages[index] === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
        
        // 添加点击事件处理
        item.addEventListener('click', (e) => {
            e.preventDefault(); // 阻止默认事件
            
            // 如果是抽奖按钮，不进行页面跳转
            if (item.id === 'lotteryNav') {
                return;
            }
            
            // 其他按钮正常跳转
            if (pages[index] !== currentPage) {
                window.location.href = pages[index];
            }
        });
    });

    // 抽奖功能
    if (document.querySelector('.wheel')) {
        const pointer = document.querySelector('.pointer-wrapper');
        const drawBtn = document.querySelector('.draw-btn');
        const customPoolBtn = document.getElementById('customPoolBtn');
        const customPoolModal = document.getElementById('customPoolModal');
        let isRotating = false;
        let currentRotation = 0;

        // 默认奖池
        const defaultPrizes = [
            { name: "1等奖", probability: 0.1 },
            { name: "2等奖", probability: 0.1 },
            { name: "3等奖", probability: 0.1 },
            { name: "4等奖", probability: 0.1 },
            { name: "5等奖", probability: 0.1 },
            { name: "6等奖", probability: 0.1 },
            { name: "7等奖", probability: 0.1 },
            { name: "8等奖", probability: 0.1 },
            { name: "9等奖", probability: 0.2 }
        ];

        // 初始化转盘显示
        const savedPrizes = localStorage.getItem('customPrizePool');
        if (savedPrizes) {
            updatePrizeWheel(JSON.parse(savedPrizes));
        } else {
            updatePrizeWheel(defaultPrizes);
        }

        // 立即抽奖按钮点击事件
        drawBtn.addEventListener('click', startLottery);

        // 自定义奖池按钮点击事件
        customPoolBtn.addEventListener('click', () => {
            customPoolModal.style.display = 'flex';
        });

        // 新增奖项按钮点击事件
        document.getElementById('addPrizeBtn').addEventListener('click', () => {
            const prizeInputs = document.getElementById('prizeInputs');
            const newGroup = document.createElement('div');
            newGroup.className = 'prize-input-group';
            newGroup.innerHTML = `
                <input type="text" placeholder="奖项名称" class="prize-name">
            `;
            prizeInputs.appendChild(newGroup);
        });

        // 保存按钮点击事件
        document.getElementById('savePoolBtn').addEventListener('click', () => {
            const prizeGroups = document.querySelectorAll('.prize-input-group');
            const customPrizes = Array.from(prizeGroups)
                .map(group => ({
                    name: group.querySelector('.prize-name').value,
                    probability: 1 / prizeGroups.length  // 平均分配概率
                }))
                .filter(prize => prize.name); // 只保留有名称的奖项
            
            if (customPrizes.length > 0) {
                localStorage.setItem('customPrizePool', JSON.stringify(customPrizes));
                updatePrizeWheel(customPrizes);
                customPoolModal.style.display = 'none';
            } else {
                alert('请至少添加一个奖项');
            }
        });

        // 取消按钮点击事件
        document.getElementById('cancelPoolBtn').addEventListener('click', () => {
            customPoolModal.style.display = 'none';
        });

        // 默认奖池按钮点击事件
        document.getElementById('defaultPoolBtn').addEventListener('click', () => {
            // 使用默认奖池
            localStorage.removeItem('customPrizePool'); // 清除自定义奖池
            updatePrizeWheel(defaultPrizes); // 更新转盘显示
        });

        function startLottery() {
            if (isRotating) return;
            
            isRotating = true;
            drawBtn.disabled = true;
            drawBtn.textContent = '抽奖中...';
            
            const currentPrizes = JSON.parse(localStorage.getItem('customPrizePool')) || defaultPrizes;
            
            // 根据概率随机选择奖项
            const random = Math.random();
            let accumulatedProbability = 0;
            let selectedPrize = null;
            let selectedIndex = 0;
            
            for (let i = 0; i < currentPrizes.length; i++) {
                accumulatedProbability += currentPrizes[i].probability;
                if (random <= accumulatedProbability) {
                    selectedPrize = currentPrizes[i];
                    selectedIndex = i;
                    break;
                }
            }
            
            // 增加基础旋转圈数和随机性
            const baseRotation = (8 + Math.floor(Math.random() * 8)) * 360; // 随机8-15圈
            const sectorDegree = 360 / currentPrizes.length; // 根据奖项数量计算每个扇形的角度
            
            // 计算目标角度，增加随机范围
            const minDegree = selectedIndex * sectorDegree + 10; // 留出10度边距
            const maxDegree = (selectedIndex + 1) * sectorDegree - 10; // 留出10度边距
            const targetDegree = minDegree + Math.random() * (maxDegree - minDegree);
            
            const targetRotation = currentRotation + baseRotation + targetDegree;
            
            // 增加动画时间
            pointer.style.transition = `transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)`;  // 从4秒改为6秒
            pointer.style.transform = `translate(-50%, -50%) rotate(${targetRotation}deg)`;
            
            currentRotation = targetRotation;
            
            // 计算最终指向的奖项
            const finalAngle = targetRotation % 360;  // 最终角度
            const finalIndex = Math.floor(finalAngle / (360 / currentPrizes.length));  // 根据奖项数量计算索引
            const finalPrize = currentPrizes[finalIndex];
            
            // 增加等待时间
            setTimeout(() => {
                isRotating = false;
                drawBtn.disabled = false;
                drawBtn.textContent = '立即抽奖';
                
                // 移除可能存在的旧弹窗
                const oldModal = document.querySelector('.result-modal');
                if (oldModal) {
                    oldModal.remove();
                }
                
                // 创建新的结果弹窗
                const modal = document.createElement('div');
                modal.className = 'result-modal';
                modal.innerHTML = `
                    <div class="result-content">
                        <h3>恭喜您！</h3>
                        <p>获得${finalPrize.name}</p>
                        <button class="close-btn">确定</button>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // 添加关闭按钮事件
                const closeBtn = modal.querySelector('.close-btn');
                closeBtn.addEventListener('click', () => {
                    modal.remove();
                });
                
                // 更新上次抽奖结果显示
                const lastPrize = document.getElementById('lastPrize');
                if (lastPrize) {
                    lastPrize.textContent = finalPrize.name;
                }
                
                // 保存历史记录
                saveHistory(finalPrize.name);
            }, 6000);  // 从4000改为6000，匹配动画时间
        }

        // 更新转盘的函数
        function updatePrizeWheel(prizes) {
            const prizeList = document.querySelector('.prize-list');
            
            // 定义不同的色
            const colors = [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFBE0B',
                '#9B5DE5', '#F15BB5', '#00BBF9', '#00F5D4', '#FEE440'
            ];
            
            // 计算每个奖项的角度范围
            let conicGradient = 'conic-gradient(';
            let currentAngle = 0;
            let textElements = '';
            
            prizes.forEach((prize, index) => {
                const startAngle = currentAngle;
                const endAngle = currentAngle + (360 / prizes.length);
                
                conicGradient += `${colors[index]} ${startAngle}deg ${endAngle}deg${index < prizes.length - 1 ? ',' : ')'}`;
                
                // 计算文字位置
                const textAngle = startAngle + (360 / prizes.length) / 2;
                const textRadius = 120;
                const textX = 150 + textRadius * Math.cos((textAngle - 90) * Math.PI / 180);
                const textY = 150 + textRadius * Math.sin((textAngle - 90) * Math.PI / 180);
                
                textElements += `
                    <div class="prize-text" style="
                        position: absolute;
                        left: ${textX}px;
                        top: ${textY}px;
                        transform: translate(-50%, -50%) rotate(${textAngle}deg);
                        color: white;
                        font-size: 14px;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
                        white-space: nowrap;
                    ">${prize.name}</div>
                `;
                
                currentAngle = endAngle;
            });
            
            prizeList.style.background = conicGradient;
            prizeList.innerHTML = textElements;
        }
    }

    // 历史记录相关
    function saveHistory(prizeName) {
        let history = JSON.parse(localStorage.getItem('lotteryHistory') || '[]');
        history.unshift({
            prize: prizeName,
            time: new Date().toLocaleString()
        });
        
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem('lotteryHistory', JSON.stringify(history));
        
        // 如果在历史记录页面，则刷新显示
        if (document.getElementById('historyList')) {
            showHistory();
        }
    }

    function showHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        const history = JSON.parse(localStorage.getItem('lotteryHistory') || '[]');
        historyList.innerHTML = history.map(record => `
            <div class="history-item">
                <span>${record.time}</span>
                <span>${record.prize}</span>
            </div>
        `).join('');
    }

    // 初始化历史记录显示
    if (document.getElementById('historyList')) {
        showHistory();
    }

    // 页面加载时显示上次抽奖结果
    const lastPrize = document.getElementById('lastPrize');
    if (lastPrize) {
        const savedResult = localStorage.getItem('lastLotteryResult');
        if (savedResult) {
            lastPrize.textContent = savedResult;
        }
    }

    // 功能项点击事件
    const functionItems = document.querySelectorAll('.function-item');
    functionItems.forEach(item => {
        item.addEventListener('click', () => {
            const text = item.textContent.trim();
            if (text === '转盘抽奖') {
                window.location.href = 'lottery.html';
            } else if (text === '猜谜语') {
                window.location.href = 'riddle.html';
            }
        });
    });

    // 添加猜谜语功能的代码
    if (document.querySelector('.riddle-container')) {
        const riddleQuestion = document.getElementById('riddleQuestion');
        const riddleAnswer = document.getElementById('riddleAnswer');
        const answerText = document.getElementById('answerText');
        const startBtn = document.getElementById('startBtn');
        const showAnswerBtn = document.getElementById('showAnswerBtn');
        const nextBtn = document.getElementById('nextBtn');

        // 谜语数据
        const riddles = [
            { question: '什么东西越越脏？', answer: '水' },
            { question: '什么门永远关不上？', answer: '球' },
            { question: '什么东西没人爱吃，却要天天吃？', answer: '药' },
            // 可以继续添加更多谜语
        ];

        let currentRiddle = -1;

        startBtn.addEventListener('click', () => {
            startBtn.style.display = 'none';
            showAnswerBtn.style.display = 'block';
            nextRiddle();
        });

        showAnswerBtn.addEventListener('click', () => {
            riddleAnswer.style.display = 'block';
            showAnswerBtn.style.display = 'none';
            nextBtn.style.display = 'block';
        });

        nextBtn.addEventListener('click', () => {
            riddleAnswer.style.display = 'none';
            nextBtn.style.display = 'none';
            showAnswerBtn.style.display = 'block';
            nextRiddle();
        });

        function nextRiddle() {
            currentRiddle = (currentRiddle + 1) % riddles.length;
            riddleQuestion.textContent = riddles[currentRiddle].question;
            answerText.textContent = riddles[currentRiddle].answer;
        }
    }

    // 子菜单控制
    const lotteryNav = document.getElementById('lotteryNav');
    const submenu = document.getElementById('submenu');
    const overlay = document.getElementById('overlay');

    // 点击奖按钮切换子菜单显示状态
    if (lotteryNav) {
        lotteryNav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 如果子菜单已经激活，则关闭它
            if (submenu.classList.contains('active')) {
                submenu.classList.remove('active');
                overlay.classList.remove('active');
            } else {
                // 否则显示子菜单
                submenu.classList.add('active');
                overlay.classList.add('active');
            }
        });
    }

    // 点击遮罩层关闭子菜单
    if (overlay) {
        overlay.addEventListener('click', () => {
            submenu.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // 子菜单项点击事件
    const submenuItems = document.querySelectorAll('.submenu-item');
    submenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.dataset.page;
            if (targetPage) {
                window.location.href = targetPage;
            }
            submenu.classList.remove('active');
            overlay.classList.remove('active');
        });
    });
}); 