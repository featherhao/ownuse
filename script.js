// 注意：这个文件必须在 data.js 之后被引用

// DOM元素引用
const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
const favoritesContainer = document.getElementById('favorites-container');
const favoritesGrid = document.getElementById('favorites-grid');
const toolGrid = document.getElementById('tool-grid');

// --- 动态生成工具网格 ---
function generateToolGrid() {
    toolGrid.innerHTML = ''; // 清空现有网格
    toolsData.forEach(tool => {
        const toolSection = document.createElement('div');
        toolSection.className = 'tool-section';
        toolSection.setAttribute('data-name', tool.name);
        toolSection.setAttribute('data-desc', tool.desc);

        // 构建按钮组的 HTML
        let buttonGroupHtml = '';
        if (tool.link) {
            buttonGroupHtml += `<a href="${tool.link}" target="_blank">前往 ${tool.name}</a>`;
        }
        if (tool.copyScript) {
            buttonGroupHtml += `<button class="copy-button" onclick="copyToClipboard('${tool.copyScript}')">复制脚本</button>`;
        }
        buttonGroupHtml += `<button class="favorite-button">收藏</button>`;
        
        toolSection.innerHTML = `
            <h2>${tool.name}</h2>
            <p>${tool.desc}</p>
            <div class="button-group">
                ${buttonGroupHtml}
            </div>
        `;
        toolGrid.appendChild(toolSection);
    });
    // 动态生成后，为收藏按钮添加事件监听器
    setupFavoriteButtons();
}


// --- 功能 1: 搜索和筛选 ---
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.tool-section').forEach(section => {
        const title = section.querySelector('h2').textContent.toLowerCase();
        const description = section.querySelector('p').textContent.toLowerCase();
        const isMatch = title.includes(searchTerm) || description.includes(searchTerm);
        section.style.display = isMatch ? 'flex' : 'none';
    });
});


// --- 功能 2: 深色模式切换 ---
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
    themeToggle.textContent = savedTheme === 'dark-mode' ? '浅色模式' : '深色模式';
}

themeToggle.addEventListener('click', () => {
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', '');
        themeToggle.textContent = '深色模式';
    } else {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark-mode');
        themeToggle.textContent = '浅色模式';
    }
});


// --- 功能 3: 本地收藏夹 ---
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function renderFavorites() {
    favoritesGrid.innerHTML = '';
    if (favorites.length > 0) {
        favoritesContainer.style.display = 'block';
        favorites.forEach(tool => {
            const favItem = document.createElement('div');
            favItem.className = 'favorite-item';
            favItem.innerHTML = `
                <a href="${tool.link}" target="_blank">${tool.name}</a>
                <button onclick="removeFavorite('${tool.name}')">移除</button>
            `;
            favoritesGrid.appendChild(favItem);
        });
    } else {
        favoritesContainer.style.display = 'none';
    }
    updateFavoriteButtons();
}

function removeFavorite(name) {
    favorites = favorites.filter(tool => tool.name !== name);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

function toggleFavorite(toolData) {
    const isFavorite = favorites.some(tool => tool.name === toolData.name);
    if (isFavorite) {
        removeFavorite(toolData.name);
    } else {
        favorites.push(toolData);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
}

function updateFavoriteButtons() {
    document.querySelectorAll('.tool-section').forEach(section => {
        const button = section.querySelector('.favorite-button');
        const title = section.querySelector('h2').textContent;
        const isFavorite = favorites.some(tool => tool.name === title);
        if (isFavorite) {
            button.classList.add('active');
            button.textContent = '已收藏';
        } else {
            button.classList.remove('active');
            button.textContent = '收藏';
        }
    });
}

function setupFavoriteButtons() {
    document.querySelectorAll('.tool-section').forEach(section => {
        const button = section.querySelector('.favorite-button');
        button.addEventListener('click', () => {
            const toolData = {
                name: section.querySelector('h2').textContent,
                link: section.querySelector('a') ? section.querySelector('a').href : '#',
            };
            toggleFavorite(toolData);
        });
    });
}


// --- 辅助函数 ---
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showFeedback('脚本已复制到剪贴板！');
    }, function(err) {
        console.error('无法复制文本: ', err);
        showFeedback('复制失败，请手动复制。');
    });
}
    
function showFeedback(message) {
    const feedbackElement = document.getElementById('copy-feedback');
    feedbackElement.textContent = message;
    feedbackElement.classList.add('show');
    setTimeout(() => {
        feedbackElement.classList.remove('show');
    }, 2000);
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', () => {
    generateToolGrid();
    renderFavorites();
});