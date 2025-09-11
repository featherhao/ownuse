// 注意：这个文件必须在 data.js 之后被引用

// =======================================================
// === 1. DOM 元素引用与数据初始化 ===
// =======================================================
const DOM = {
    body: document.body,
    themeToggle: document.getElementById('theme-toggle'),
    searchInput: document.getElementById('search-input'),
    favoritesContainer: document.getElementById('favorites-container'),
    favoritesGrid: document.getElementById('favorites-grid'),
    toolGrid: document.getElementById('tool-grid'),
    copyFeedback: document.getElementById('copy-feedback')
};

// 假设 toolsData 来自 data.js
let allTools = toolsData;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// =======================================================
// === 2. 核心渲染函数 ===
// =======================================================

/**
 * 渲染工具网格，支持筛选和搜索。
 * @param {Array} tools - 要渲染的工具数组。
 */
function renderTools(tools) {
    DOM.toolGrid.innerHTML = ''; // 清空现有网格
    if (tools.length === 0) {
        DOM.toolGrid.innerHTML = '<p>没有找到相关工具。</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    tools.forEach(tool => {
        const isFav = isFavorite(tool.name);
        const toolSection = document.createElement('div');
        toolSection.className = 'tool-section';
        toolSection.innerHTML = `
            <h2>${tool.name}</h2>
            <p>${tool.desc}</p>
            <div class="button-group">
                ${tool.link ? `<a href="${tool.link}" target="_blank" rel="noopener noreferrer">前往 ${tool.name}</a>` : ''}
                ${tool.copyScript ? `<button class="copy-button" data-script="${tool.copyScript}">复制脚本</button>` : ''}
                <button class="favorite-button ${isFav ? 'active' : ''}" data-name="${tool.name}">
                    ${isFav ? '已收藏' : '收藏'}
                </button>
            </div>
        `;
        fragment.appendChild(toolSection);
    });
    DOM.toolGrid.appendChild(fragment);
}

/**
 * 渲染收藏夹列表。
 */
function renderFavorites() {
    DOM.favoritesGrid.innerHTML = '';
    if (favorites.length > 0) {
        DOM.favoritesContainer.style.display = 'block';
        const fragment = document.createDocumentFragment();
        favorites.forEach(tool => {
            const favItem = document.createElement('div');
            favItem.className = 'favorite-item';
            favItem.innerHTML = `
                <a href="${tool.link}" target="_blank" rel="noopener noreferrer">${tool.name}</a>
                <button class="remove-favorite-button" data-name="${tool.name}">移除</button>
            `;
            fragment.appendChild(favItem);
        });
        DOM.favoritesGrid.appendChild(fragment);
    } else {
        DOM.favoritesContainer.style.display = 'none';
    }
}

// =======================================================
// === 3. 功能函数 ===
// =======================================================

/**
 * 收藏夹相关操作。
 */
function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function isFavorite(name) {
    return favorites.some(tool => tool.name === name);
}

function toggleFavorite(name) {
    const toolData = allTools.find(tool => tool.name === name);
    if (!toolData) return;

    if (isFavorite(name)) {
        favorites = favorites.filter(tool => tool.name !== name);
    } else {
        // 确保收藏的数据完整
        favorites.push({ name: toolData.name, link: toolData.link, desc: toolData.desc });
    }
    saveFavorites();
    renderFavorites();
    renderTools(allTools); // 重新渲染主列表以更新按钮状态
}

/**
 * 复制到剪贴板。
 * @param {string} text - 要复制的文本。
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showFeedback('脚本已复制到剪贴板！');
    }).catch(err => {
        console.error('无法复制文本: ', err);
        showFeedback('复制失败，请手动复制。');
    });
}

/**
 * 显示复制反馈。
 * @param {string} message - 反馈消息。
 */
function showFeedback(message) {
    DOM.copyFeedback.textContent = message;
    DOM.copyFeedback.classList.add('show');
    setTimeout(() => {
        DOM.copyFeedback.classList.remove('show');
    }, 2000);
}

/**
 * 搜索逻辑，使用防抖。
 */
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

const filterAndSearchTools = debounce(() => {
    const searchTerm = DOM.searchInput.value.toLowerCase();
    const filteredTools = allTools.filter(tool => {
        return (
            (tool.name && tool.name.toLowerCase().includes(searchTerm)) ||
            (tool.desc && tool.desc.toLowerCase().includes(searchTerm))
        );
    });
    renderTools(filteredTools);
}, 300);

// =======================================================
// === 4. 事件监听器 ===
// =======================================================

// 搜索框输入事件
DOM.searchInput.addEventListener('input', filterAndSearchTools);

// 主题切换事件
DOM.themeToggle.addEventListener('click', () => {
    DOM.body.classList.toggle('dark-mode');
    const isDarkMode = DOM.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark-mode' : '');
    DOM.themeToggle.textContent = isDarkMode ? '浅色模式' : '深色模式';
});

// 使用事件委托处理工具卡片上的点击事件
DOM.toolGrid.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('copy-button')) {
        copyToClipboard(target.dataset.script);
    } else if (target.classList.contains('favorite-button')) {
        toggleFavorite(target.dataset.name);
    }
});

// 使用事件委托处理收藏夹上的点击事件
DOM.favoritesGrid.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('remove-favorite-button')) {
        toggleFavorite(target.dataset.name);
    }
});

// =======================================================
// === 5. 初始化 ===
// =======================================================
function initialize() {
    // 加载保存的主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark-mode') {
        DOM.body.classList.add('dark-mode');
        DOM.themeToggle.textContent = '浅色模式';
    } else {
        DOM.themeToggle.textContent = '深色模式';
    }

    renderTools(allTools);
    renderFavorites();
}

document.addEventListener('DOMContentLoaded', initialize);
