// 游戏状态
let clickedNumbers = [];
let isCalculated = false;
let currentFruits = []; // 存储水果 DOM 元素的数组
let fruitIdCounter = 0;
let currentRowsCount = 0;

// 音频上下文（通过 Web Audio API 合成音效）
let audioCtx;
const playSound = (type) => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'success') {
        // 叮咚成功音效
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'error') {
        // 错误提示音效
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.setValueAtTime(130, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
    }
};

// DOM 元素
const calcScreen = document.getElementById('calcScreen');
const bagsContainer = document.getElementById('bagsContainer');
const fruitsContainer = document.getElementById('fruitsContainer');
const checkBtn = document.getElementById('checkBtn');
const resetBtn = document.getElementById('resetBtn');
const robotBtn = document.getElementById('robotBtn');

// 水果 Emoji 映射表（1-10）
const fruitMap = {
    1: '🍌',
    2: '🍑',
    3: '🍇',
    4: '🍎',
    5: '🍐',
    6: '🍍',
    7: '🍓',
    8: '🥝',
    9: '🍊',
    10: '🥭'
};

// --- 语音合成 ---
const speak = (text) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.1;
        utterance.pitch = 1.2; // 可爱的音调
        window.speechSynthesis.speak(utterance);
    }
};

robotBtn.addEventListener('click', () => {
    speak('小朋友们好！我是机器人水果店的服务员，我们店买水果是开盲盒哟！不信的话，你说出一个数字试试吧！');
});

// --- 计算器逻辑 ---
document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = e.target.dataset.val;
        const num = parseInt(val);
        
        if (num >= 1 && num <= 10) {
            if (clickedNumbers.length >= 3) {
                speak('桌子装不下啦，请先点击右下角的清空吧！');
                // 视觉提示：清空按钮高亮抖动
                const resetBtn = document.getElementById('resetBtn');
                resetBtn.style.transform = 'scale(1.1)';
                resetBtn.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.5)';
                setTimeout(() => {
                    resetBtn.style.transform = '';
                    resetBtn.style.boxShadow = '0 6px 0 #cc0052';
                }, 500);
                return;
            }
            clickedNumbers.push(num);
            calcScreen.textContent = clickedNumbers.join(', ');
            addFruitRow(num);
            isCalculated = true; // 激活验证逻辑
        }
    });
});

function clearGameArea() {
    // 清除 DOM 中所有水果元素
    document.querySelectorAll('.fruit').forEach(f => f.remove());
    bagsContainer.replaceChildren();
    fruitsContainer.replaceChildren();
    currentFruits = [];
}

function resetGame() {
    clickedNumbers = [];
    currentRowsCount = 0;
    calcScreen.textContent = '';
    isCalculated = false;
    clearGameArea();
}

resetBtn.addEventListener('click', () => {
    resetGame();
});

// --- 游戏生成逻辑 ---
function addFruitRow(num) {
    const rowIndex = currentRowsCount++;
    const fruitTypeKey = num; // fruitMap 的键：1->🍌, 2->🍑 等

    // 创建购物袋行
    const row = document.createElement('div');
    row.className = 'bag-row';
    // 存储数量和唯一行 ID，供验证时分组使用
    row.dataset.rowId = rowIndex;
    row.dataset.qty = num;
    
    const numBags = Math.ceil(num / 2);
    
    // 在行左上角添加数字标签
    const rowLabel = document.createElement('div');
    rowLabel.className = 'row-label';
    rowLabel.textContent = num;
    row.appendChild(rowLabel);

    for (let i = 0; i < numBags; i++) {
        const bag = document.createElement('div');
        bag.className = 'bag';
        // targetRowId 将购物袋与其所属行关联，用于跨类型验证
        bag.dataset.targetRowId = rowIndex;
        // targetFruitType 是 fruitMap 的键，决定哪种 emoji 是正确的
        bag.dataset.targetFruitType = fruitTypeKey;
        bag.dataset.targetQty = num;
        
        row.appendChild(bag);
    }
    bagsContainer.appendChild(row);
    
    // 随机散布水果，用 rowIndex 将水果与所属行关联
    for (let i = 0; i < num; i++) {
        createScatteredFruit(fruitTypeKey, rowIndex);
    }
}

function createScatteredFruit(fruitTypeKey, rowIndex) {
    const fruit = document.createElement('div');
    fruit.className = 'fruit';
    fruit.textContent = fruitMap[fruitTypeKey];
    // 存储 emoji 类型和所属行，供验证使用
    fruit.dataset.fruitType = fruitTypeKey;
    fruit.dataset.rowId = rowIndex;
    fruit.id = 'fruit_' + (fruitIdCounter++);
    
    // 在 fruitsContainer 内随机定位，限制范围避免出现滚动条
    const x = 5 + Math.random() * 75; // 5% 到 80%
    const y = 5 + Math.random() * 55; // 5% 到 60%
    
    fruit.style.left = x + '%';
    fruit.style.top = y + '%';
    
    setupDragAndDrop(fruit);
    fruitsContainer.appendChild(fruit);
    currentFruits.push(fruit);
}

// --- 拖拽逻辑（使用 Pointer Events）---
// 所有拖拽以 gameArea 为坐标参考，因为 bagsContainer 和 fruitsContainer 都在其内部
const gameArea = document.getElementById('gameArea');
let draggedFruit = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function setupDragAndDrop(fruit) {
    fruit.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        draggedFruit = fruit;
        fruit.classList.add('dragging');

        const fruitRect = fruit.getBoundingClientRect();
        const gameRect = gameArea.getBoundingClientRect();

        // 将水果挂到 gameArea，坐标需要加上 gameArea 的滚动偏移
        const left = fruitRect.left - gameRect.left + gameArea.scrollLeft;
        const top = fruitRect.top - gameRect.top + gameArea.scrollTop;

        gameArea.appendChild(fruit);
        fruit.style.position = 'absolute';
        fruit.style.left = left + 'px';
        fruit.style.top = top + 'px';

        // 指针在水果内的偏移量
        dragOffsetX = e.clientX - fruitRect.left;
        dragOffsetY = e.clientY - fruitRect.top;

        fruit.setPointerCapture(e.pointerId);
    });

    fruit.addEventListener('pointermove', (e) => {
        if (draggedFruit !== fruit) return;

        const gameRect = gameArea.getBoundingClientRect();
        // 移动时同样需要加上滚动偏移
        fruit.style.left = (e.clientX - dragOffsetX - gameRect.left + gameArea.scrollLeft) + 'px';
        fruit.style.top = (e.clientY - dragOffsetY - gameRect.top + gameArea.scrollTop) + 'px';

        checkBagHover(e.clientX, e.clientY);
    });

    fruit.addEventListener('pointerup', (e) => {
        if (draggedFruit !== fruit) return;
        fruit.releasePointerCapture(e.pointerId);
        fruit.classList.remove('dragging');

        document.querySelectorAll('.bag').forEach(b => b.classList.remove('highlight'));

        const targetBag = getTargetBag(e.clientX, e.clientY);

        if (targetBag) {
            // 放入购物袋：水果变为袋内流式布局
            fruit.style.position = 'relative';
            fruit.style.left = 'auto';
            fruit.style.top = 'auto';
            targetBag.appendChild(fruit);
        } else {
            // 未放入袋子：保持在 gameArea 中的绝对定位，停在松手位置
        }

        draggedFruit = null;
    });
}

function checkBagHover(x, y) {
    let hovered = false;
    document.querySelectorAll('.bag').forEach(bag => {
        const rect = bag.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            bag.classList.add('highlight');
            hovered = true;
        } else {
            bag.classList.remove('highlight');
        }
    });
}

function getTargetBag(x, y) {
    let target = null;
    document.querySelectorAll('.bag').forEach(bag => {
        const rect = bag.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            target = bag;
        }
    });
    return target;
}

// --- 验证逻辑 ---
checkBtn.addEventListener('click', () => {
    if (!isCalculated) return;
    
    // 检查是否还有水果在袋子外面
    // 袋子外的水果可能在 fruitsContainer 或拖拽后留在 gameArea 中
    const allFruits = document.querySelectorAll('.fruit');
    const unplacedFruits = Array.from(allFruits).filter(f => !f.closest('.bag'));
    if (unplacedFruits.length > 0) {
        playSound('error');
        return;
    }
    
    let isCorrect = true;
    
    const allBags = document.querySelectorAll('.bag');
    
    let totalFruits = 0;
    let count2 = 0;
    let count1 = 0;
    
    allBags.forEach(bag => {
        const len = bag.querySelectorAll('.fruit').length;
        if (len === 2) {
            count2++;
        } else if (len === 1) {
            count1++;
        } else if (len > 2) {
            isCorrect = false; // 每个袋子最多放 2 个水果
        }
        totalFruits += len;
    });
    
    // 验证：count2*2 + count1 === totalFruits，且 count1 <= 2
    // 即所有水果都装进了袋子，每袋不超过2个，余数袋最多2个
    if (count2 * 2 + count1 !== totalFruits || count1 > 2) {
        isCorrect = false;
    }

    if (isCorrect) {
        playSound('success');

        // 找出空袋子（两个余数水果合并后留下的空袋）
        const emptyBags = Array.from(document.querySelectorAll('.bag')).filter(
            b => b.querySelectorAll('.fruit').length === 0
        );

        // 确认按钮变绿
        checkBtn.classList.add('success-flash');

        // 非空袋子绿色背景 + 弹跳动画
        document.querySelectorAll('.bag').forEach(b => {
            if (b.querySelectorAll('.fruit').length > 0) {
                b.style.backgroundColor = '#ccffcc';
                b.classList.add('success-bounce');
            }
        });

        // 空袋子淡出消失
        emptyBags.forEach(b => {
            b.style.transition = 'opacity 0.5s, transform 0.5s';
            b.style.opacity = '0';
            b.style.transform = 'scale(0.5)';
        });

        setTimeout(() => {
            document.querySelectorAll('.bag').forEach(b => {
                b.style.backgroundColor = '';
                b.classList.remove('success-bounce');
            });
            checkBtn.classList.remove('success-flash');
            emptyBags.forEach(b => b.remove());
        }, 1000);
    } else {
        playSound('error');

        // 确认按钮抖动变红
        checkBtn.classList.add('error-shake');
        document.querySelectorAll('.bag').forEach(b => b.style.backgroundColor = '#ffcccc');

        setTimeout(() => {
            document.querySelectorAll('.bag').forEach(b => b.style.backgroundColor = '');
            checkBtn.classList.remove('error-shake');
            checkBtn.style.backgroundColor = '';
            checkBtn.style.borderColor = '';
        }, 600);
    }
});