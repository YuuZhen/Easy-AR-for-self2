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

// 处理文件
function processFiles(id, name, type) {
    const isEditing = contentId.value !== '';
    let markerImageData = '';
    let contentFileData = '';
    
    // 如果是编辑模式且没有选择新文件，使用现有文件
    if (isEditing) {
        const existingContent = contents.find(item => item.id === id);
        markerImageData = existingContent.markerImage;
        contentFileData = existingContent.contentFile;
    }
    
    // 显示进度条容器
    markerProgressContainer.style.display = 'block';
    contentProgressContainer.style.display = 'block';
    
    // 初始化进度条
    updateProgress(markerProgressBar, markerProgressText, 0);
    updateProgress(contentProgressBar, contentProgressText, 0);
    
    // 处理标记图像
    const processMarkerImage = new Promise((resolve, reject) => {
        if (markerImage.files[0]) {
            readFileAsDataURL(markerImage.files[0], (progress) => {
                updateProgress(markerProgressBar, markerProgressText, progress);
            }).then(data => {
                markerImageData = data;
                // 完成后设置为100%
                updateProgress(markerProgressBar, markerProgressText, 100);
                resolve();
            }).catch(error => {
                // 删除重复的代码块
                console.error('处理标记图像失败:', error);
                alert('处理标记图像失败: ' + error.message);
                reject(error);
            });
        } else {
            // 如果没有新文件，直接设置为100%
            updateProgress(markerProgressBar, markerProgressText, 100);
            resolve();
        }
    });
    
    // 处理内容文件
    const processContentFile = new Promise((resolve, reject) => {
        if (contentFile.files[0]) {
            readFileAsDataURL(contentFile.files[0], (progress) => {
                updateProgress(contentProgressBar, contentProgressText, progress);
            }).then(data => {
                contentFileData = data;
                // 完成后设置为100%
                updateProgress(contentProgressBar, contentProgressText, 100);
                resolve();
            }).catch(error => {
                console.error('处理内容文件失败:', error);
                alert('处理内容文件失败: ' + error.message);
                reject(error);
            });
        } else {
            // 如果没有新文件，直接设置为100%
            updateProgress(contentProgressBar, contentProgressText, 100);
            resolve();
        }
    });
    
    // 等待所有文件处理完成
    Promise.all([processMarkerImage, processContentFile])
        .then(() => {
            // 创建或更新内容
            const content = {
                id,
                name,
                type,
                markerImage: markerImageData,
                contentFile: contentFileData,
                createdAt: isEditing ? contents.find(item => item.id === id).createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // 更新内容列表
            if (isEditing) {
                const index = contents.findIndex(item => item.id === id);
                contents[index] = content;
            } else {
                contents.push(content);
            }
            
            // 保存到本地存储
            saveContents();
            
            // 重新渲染内容列表
            renderContentList();
            
            // 关闭模态框
            contentModal.style.display = 'none';
            
            // 隐藏进度条
            setTimeout(() => {
                markerProgressContainer.style.display = 'none';
                contentProgressContainer.style.display = 'none';
            }, 1000);
            
            // 显示二维码
            showQRCode(content.id);
        })
        .catch(error => {
            console.error('处理文件失败:', error);
            // 隐藏进度条
            markerProgressContainer.style.display = 'none';
            contentProgressContainer.style.display = 'none';
        });
}

// 更新进度条
function updateProgress(progressBar, progressText, progress) {
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
}

// 读取文件为 Data URL
function readFileAsDataURL(file, progressCallback) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        // 开始读取时显示0%进度
        progressCallback(0);
        
        reader.onload = function(e) {
            // 完成时回调100%进度
            progressCallback(100);
            resolve(e.target.result);
        };
        
        reader.onerror = function(e) {
            reject(new Error('文件读取失败'));
        };
        
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                progressCallback(progress);
            }
        };
        
        // 添加延迟，确保进度条动画可见
        setTimeout(() => {
            reader.readAsDataURL(file);
        }, 100);
    });
}

// 处理标记图像变化
function handleMarkerImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图像文件作为标记图像');
        e.target.value = '';
        return;
    }
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = function(e) {
        markerPreview.innerHTML = `<img src="${e.target.result}" alt="标记图像预览" class="preview-image">`;
    };
    reader.readAsDataURL(file);
}

// 处理内容文件变化
function handleContentFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const type = contentType.value;
    
    // 检查文件类型
    if (type === 'image' && !file.type.startsWith('image/')) {
        alert('请选择图像文件作为内容');
        e.target.value = '';
        return;
    } else if (type === 'video' && !file.type.startsWith('video/')) {
        alert('请选择视频文件作为内容');
        e.target.value = '';
        return;
    } else if (type === '3d' && !file.name.endsWith('.gltf') && !file.name.endsWith('.glb')) {
        alert('请选择GLTF或GLB文件作为3D模型内容');
        e.target.value = '';
        return;
    }
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = function(e) {
        if (type === 'image') {
            contentPreview.innerHTML = `<img src="${e.target.result}" alt="内容预览" class="preview-image">`;
        } else if (type === 'video') {
            contentPreview.innerHTML = `<video src="${e.target.result}" controls style="max-width: 100%; max-height: 200px;"></video>`;
        } else if (type === '3d') {
            contentPreview.innerHTML = `<div style="text-align: center; color: var(--text-light);">3D 模型 (${file.name})</div>`;
        }
    };
    reader.readAsDataURL(file);
}

// 删除内容
function deleteContent(id) {
    if (!confirm('确定要删除此内容吗？此操作无法撤销。')) return;
    
    const index = contents.findIndex(item => item.id === id);
    if (index !== -1) {
        contents.splice(index, 1);
        saveContents();
        renderContentList();
    }
}

// 显示二维码
function showQRCode(id) {
    const content = contents.find(item => item.id === id);
    if (!content) return;
    
    // 生成AR查看器URL - 确保使用正确的路径
    const baseUrl = window.location.href.includes('index.html') 
        ? window.location.href.replace('index.html', '') 
        : window.location.href.endsWith('/') 
            ? window.location.href 
            : window.location.href + '/';
    
    const url = `${baseUrl}ar-viewer.html?id=${id}`;
    
    console.log('生成的AR URL:', url);
    console.log('内容ID:', id);
    
    // 清空二维码容器
    qrCode.innerHTML = '';
    
    // 显示URL
    arUrl.textContent = url;
    
    // 使用QRCode库生成二维码
    try {
        // 确保QRCode库已加载
        if (typeof QRCode === 'undefined') {
            // 如果QRCode未定义，动态加载库
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js';
            document.head.appendChild(script);
            
            script.onload = function() {
                // 库加载完成后生成二维码
                generateQRCode(qrCode, url);
            };
            
            script.onerror = function() {
                console.error('QRCode库加载失败');
                qrCode.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">QRCode库加载失败</div>';
            };
        } else {
            // QRCode已定义，直接生成
            generateQRCode(qrCode, url);
        }
    } catch (error) {
        console.error('生成二维码失败:', error);
        qrCode.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">二维码生成失败，请检查控制台错误</div>';
    }
    
    // 显示模态框
    qrModal.style.display = 'block';
}

// 生成二维码的辅助函数
function generateQRCode(element, text) {
    try {
        // 清空容器
        element.innerHTML = '';
        
        // 创建新的QRCode实例
        new QRCode(element, {
            text: text,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        console.log('二维码生成成功');
    } catch (error) {
        console.error('二维码生成出错:', error);
        element.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
            二维码生成失败: ${error.message}<br>
            请手动复制链接: <br>
            <textarea readonly style="width: 100%; margin-top: 10px;">${text}</textarea>
        </div>`;
    }
}

// 复制AR URL
function copyArUrl() {
    const url = arUrl.textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url)
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
                alert('复制失败，请手动复制链接');
            });
    } else {
        // 回退方法
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            // 显示复制成功提示
            const originalText = copyUrlBtn.textContent;
            copyUrlBtn.textContent = '已复制!';
            copyUrlBtn.classList.add('copied');
            
            setTimeout(() => {
                copyUrlBtn.textContent = originalText;
                copyUrlBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制链接');
        }
        
        document.body.removeChild(textarea);
    }
}

// 生成唯一ID
function generateId() {
    return 'ar-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}
