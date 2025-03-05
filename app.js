// 全局变量
let contents = [];

// DOM 元素
let contentList, contentModal, qrModal, contentForm, modalTitle, contentId, contentName, contentType;
let markerImage, contentFile, markerPreview, contentPreview, addContentBtn, closeButtons, qrCode, arUrl, copyUrlBtn;
let markerDropZone, contentDropZone, markerProgressContainer, contentProgressContainer;
let markerProgressBar, contentProgressBar, markerProgressText, contentProgressText;

// 初始化
document.addEventListener('DOMContentLoaded', init);

function init() {
    // 获取DOM元素
    initDOMElements();
    
    // 预加载QRCode库
    preloadQRCodeLibrary();
    
    // 从本地存储加载内容
    loadContents();
    
    // 渲染内容列表
    renderContentList();
    
    // 添加事件监听器
    addEventListeners();
    
    // 初始化拖拽上传
    initDragAndDrop();
}

// 预加载QRCode库
function preloadQRCodeLibrary() {
    if (typeof QRCode === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js';
        document.head.appendChild(script);
        console.log('QRCode库预加载中...');
    }
}

// 初始化DOM元素
function initDOMElements() {
    contentList = document.getElementById('contentList');
    contentModal = document.getElementById('contentModal');
    qrModal = document.getElementById('qrModal');
    contentForm = document.getElementById('contentForm');
    modalTitle = document.getElementById('modalTitle');
    contentId = document.getElementById('contentId');
    contentName = document.getElementById('contentName');
    contentType = document.getElementById('contentType');
    markerImage = document.getElementById('markerImage');
    contentFile = document.getElementById('contentFile');
    markerPreview = document.getElementById('markerPreview');
    contentPreview = document.getElementById('contentPreview');
    addContentBtn = document.getElementById('addContentBtn');
    
    // 检查addContentBtn是否正确获取
    if (!addContentBtn) {
        console.error('无法找到添加内容按钮，尝试使用类选择器');
        addContentBtn = document.querySelector('.add-content-btn');
    }
    
    closeButtons = document.querySelectorAll('.close');
    qrCode = document.getElementById('qrCode');
    arUrl = document.getElementById('arUrl');
    copyUrlBtn = document.getElementById('copyUrlBtn');
    
    // 拖拽上传相关元素
    markerDropZone = document.getElementById('markerDropZone');
    contentDropZone = document.getElementById('contentDropZone');
    markerProgressContainer = document.getElementById('markerProgressContainer');
    contentProgressContainer = document.getElementById('contentProgressContainer');
    markerProgressBar = document.getElementById('markerProgressBar');
    contentProgressBar = document.getElementById('contentProgressBar');
    markerProgressText = document.getElementById('markerProgressText');
    contentProgressText = document.getElementById('contentProgressText');
    
    // 初始化隐藏进度条
    if (markerProgressContainer) markerProgressContainer.style.display = 'none';
    if (contentProgressContainer) contentProgressContainer.style.display = 'none';
}

// 加载内容
function loadContents() {
    try {
        const storedContents = localStorage.getItem('arContents');
        if (storedContents) {
            contents = JSON.parse(storedContents);
            console.log(`已从本地存储加载 ${contents.length} 个内容项`);
        }
    } catch (error) {
        console.error('加载内容失败:', error);
        contents = [];
        // 尝试恢复损坏的数据
        localStorage.removeItem('arContents');
    }
}

// 保存内容到本地存储
function saveContents() {
    try {
        localStorage.setItem('arContents', JSON.stringify(contents));
        console.log(`已保存 ${contents.length} 个内容项到本地存储`);
        return true;
    } catch (error) {
        console.error('保存内容失败:', error);
        alert('保存内容失败，可能是由于存储空间不足。请尝试删除一些旧内容。');
        return false;
    }
}

// 渲染内容列表
function renderContentList() {
    contentList.innerHTML = '';
    
    if (contents.length === 0) {
        contentList.innerHTML = `
            <div class="empty-state">
                <i class="ri-file-list-3-line"></i>
                <h3>暂无内容</h3>
                <p>点击"添加新内容"按钮开始创建AR内容</p>
            </div>
        `;
        return;
    }
    
    // 按更新时间排序，最新的在前面
    const sortedContents = [...contents].sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    
    sortedContents.forEach(content => {
        const card = document.createElement('div');
        card.className = 'content-card';
        
        card.innerHTML = `
            <img src="${content.markerImage}" alt="${content.name}" class="card-image">
            <div class="card-content">
                <h3 class="card-title">${content.name}</h3>
                <div class="card-info">
                    <p>类型: ${getContentTypeName(content.type)}</p>
                    <p>创建时间: ${new Date(content.createdAt).toLocaleString()}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary view-qr" data-id="${content.id}"><i class="ri-qr-code-line"></i> 查看二维码</button>
                    <button class="btn edit-content" data-id="${content.id}"><i class="ri-edit-line"></i> 编辑</button>
                    <button class="btn btn-danger delete-content" data-id="${content.id}"><i class="ri-delete-bin-line"></i> 删除</button>
                </div>
            </div>
        `;
        
        contentList.appendChild(card);
    });
}
// 获取内容类型名称
function getContentTypeName(type) {
    switch (type) {
        case 'image': return '图片';
        case 'video': return '视频';
        case '3d': return '3D 模型';
        default: return '未知';
    }
}

// 添加事件监听器
function addEventListeners() {
    // 添加内容按钮
    console.log('添加内容按钮元素:', addContentBtn);
    
    if (addContentBtn) {
        console.log('为添加内容按钮添加点击事件');
        // 移除重复的事件监听器，只保留一个
        addContentBtn.removeEventListener('click', openAddContentModal);
        addContentBtn.addEventListener('click', function() {
            console.log('添加内容按钮被点击');
            openAddContentModal();
        });
    } else {
        console.error('添加内容按钮未找到，尝试查找其他可能的选择器');
        // 尝试其他可能的选择器
        const possibleButtons = document.querySelectorAll('button, .btn, .button');
        console.log('页面上的所有按钮:', possibleButtons);
        
        // 尝试通过文本内容查找
        const addButton = Array.from(possibleButtons).find(btn => 
            btn.textContent.includes('添加') || 
            btn.textContent.includes('新增') || 
            btn.textContent.includes('新建') ||
            btn.textContent.includes('Add')
        );
        
        if (addButton) {
            console.log('找到可能的添加按钮:', addButton);
            addButton.addEventListener('click', openAddContentModal);
        }
    }
    
    // 关闭按钮
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            contentModal.style.display = 'none';
            qrModal.style.display = 'none';
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === contentModal) {
            contentModal.style.display = 'none';
        }
        if (e.target === qrModal) {
            qrModal.style.display = 'none';
        }
    });
    
    // 表单提交
    contentForm.addEventListener('submit', handleFormSubmit);
    
    // 文件输入变化
    markerImage.addEventListener('change', handleMarkerImageChange);
    contentFile.addEventListener('change', handleContentFileChange);
    
    // 内容类型变化时更新文件接受类型
    contentType.addEventListener('change', updateContentFileAcceptType);
    
    // 代理事件监听器，用于动态生成的按钮
    contentList.addEventListener('click', handleContentListClick);
    
    // 复制URL按钮
    copyUrlBtn.addEventListener('click', copyArUrl);
    
    // 添加键盘事件，按ESC关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            contentModal.style.display = 'none';
            qrModal.style.display = 'none';
        }
    });
}

// 更新内容文件接受类型
function updateContentFileAcceptType() {
    const type = contentType.value;
    
    switch (type) {
        case 'image':
            contentFile.setAttribute('accept', 'image/*');
            break;
        case 'video':
            contentFile.setAttribute('accept', 'video/*');
            break;
        case '3d':
            contentFile.setAttribute('accept', '.gltf,.glb');
            break;
    }
}

// 初始化拖拽上传
function initDragAndDrop() {
    // 标记图像拖拽区域
    setupDropZone(markerDropZone, markerImage, handleMarkerImageChange);
    
    // 内容文件拖拽区域
    setupDropZone(contentDropZone, contentFile, handleContentFileChange);
}

// 设置拖拽区域
function setupDropZone(dropZone, fileInput, changeHandler) {
    if (!dropZone) return;
    
    // 点击拖拽区域触发文件选择
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 拖拽事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // 拖拽进入和悬停
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('active');
        });
    });
    
    // 拖拽离开和放下
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('active');
        });
    });
    
    // 处理文件放下
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            changeHandler({ target: fileInput });
        }
    });
}

// 处理内容列表点击事件
function handleContentListClick(e) {
    const target = e.target.closest('button');
    if (!target) return;
    
    const id = target.dataset.id;
    
    if (target.classList.contains('view-qr')) {
        showQRCode(id);
    } else if (target.classList.contains('edit-content')) {
        openEditContentModal(id);
    } else if (target.classList.contains('delete-content')) {
        deleteContent(id);
    }
}

// 打开添加内容模态框
function openAddContentModal() {
    console.log('打开添加内容模态框');
    modalTitle.textContent = '添加新内容';
    contentId.value = '';
    contentForm.reset();
    markerPreview.innerHTML = '';
    contentPreview.innerHTML = '';
    updateContentFileAcceptType();
    contentModal.style.display = 'block';
}

// 打开编辑内容模态框
function openEditContentModal(id) {
    const content = contents.find(item => item.id === id);
    if (!content) return;
    
    modalTitle.textContent = '编辑内容';
    contentId.value = content.id;
    contentName.value = content.name;
    contentType.value = content.type;
    updateContentFileAcceptType();
    
    // 显示预览
    markerPreview.innerHTML = `<img src="${content.markerImage}" alt="标记图像预览" class="preview-image">`;
    
    if (content.type === 'image') {
        contentPreview.innerHTML = `<img src="${content.contentFile}" alt="内容预览" class="preview-image">`;
    } else if (content.type === 'video') {
        contentPreview.innerHTML = `<video src="${content.contentFile}" controls style="max-width: 100%; max-height: 200px;"></video>`;
    } else if (content.type === '3d') {
        contentPreview.innerHTML = `<div style="text-align: center; color: var(--text-light);">3D 模型 (${content.contentFile.split('/').pop()})</div>`;
    }
    
    contentModal.style.display = 'block';
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const id = contentId.value || generateId();
    const name = contentName.value.trim();
    const type = contentType.value;
    
    // 验证名称
    if (!name) {
        alert('请输入内容名称');
        contentName.focus();
        return;
    }
    
    // 检查是否有文件
    if (!markerImage.files[0] && !document.querySelector('#markerPreview img')) {
        alert('请选择标记图像');
        return;
    }
    
    if (!contentFile.files[0] && !isEditingWithExistingContent()) {
        alert('请选择内容文件');
        return;
    }
    
    // 处理文件
    processFiles(id, name, type);
}

// 检查是否是编辑模式且已有内容
function isEditingWithExistingContent() {
    const id = contentId.value;
    if (!id) return false;
    
    const content = contents.find(item => item.id === id);
    return content && content.contentFile;
}

// 生成唯一ID
function generateId() {
    return 'ar_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 复制AR URL
function copyArUrl() {
    const urlText = arUrl.textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(urlText)
            .then(() => {
                // 显示复制成功提示
                const originalText = copyUrlBtn.textContent;
                copyUrlBtn.textContent = '已复制!';
                copyUrlBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyUrlBtn.textContent = originalText;
                    copyUrlBtn.classList.remove('copied');
                }, 2000);
            })
            .catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制URL');
            });
    } else {
        // 回退方法
        const textArea = document.createElement('textarea');
        textArea.value = urlText;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            const originalText = copyUrlBtn.textContent;
            copyUrlBtn.textContent = '已复制!';
            copyUrlBtn.classList.add('copied');
            
            setTimeout(() => {
                copyUrlBtn.textContent = originalText;
                copyUrlBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制URL');
        }
        
        document.body.removeChild(textArea);
    }
}
