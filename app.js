// 全局变量
let contents = [];

// DOM 元素
let contentList, contentModal, qrModal, contentForm, modalTitle, contentId, contentName, contentType;
let markerImage, contentFile, markerPreview, contentPreview, addContentBtn, closeButtons, qrCode, arUrl, copyUrlBtn;
let markerDropZone, contentDropZone, markerProgressContainer, contentProgressContainer;
let markerProgressText, contentProgressText;

// 初始化
document.addEventListener('DOMContentLoaded', init);

function init() {
    initDOMElements();
    preloadQRCodeLibrary();
    loadContents();
    renderContentList();
    updateDropZoneText();
    addEventListeners();
    initDragAndDrop();
}

// 更新拖拽区域文本
function updateDropZoneText() {
    if (markerDropZone) {
        const textElement = markerDropZone.querySelector('.drop-text') || markerDropZone;
        if (textElement) {
            textElement.innerHTML = '<i class="ri-upload-cloud-line"></i><br>拖拽文件到此处或点击上传';
        }
    }
    
    if (contentDropZone) {
        const textElement = contentDropZone.querySelector('.drop-text') || contentDropZone;
        if (textElement) {
            textElement.innerHTML = '<i class="ri-upload-cloud-line"></i><br>拖拽文件到此处或点击上传';
        }
    }
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
    
    if (!addContentBtn) {
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
    markerProgressText = document.getElementById('markerProgressText');
    contentProgressText = document.getElementById('contentProgressText');
    
    // 初始化隐藏进度容器
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
    const typeMap = {
        'image': '图片',
        'video': '视频',
        '3d': '3D 模型'
    };
    return typeMap[type] || '未知';
}

// 添加事件监听器
function addEventListeners() {
    // 添加内容按钮
    if (addContentBtn) {
        addContentBtn.removeEventListener('click', openAddContentModal);
        addContentBtn.addEventListener('click', openAddContentModal);
    } else {
        const possibleButtons = document.querySelectorAll('button, .btn, .button');
        const addButton = Array.from(possibleButtons).find(btn => 
            btn.textContent.includes('添加') || 
            btn.textContent.includes('新增') || 
            btn.textContent.includes('新建') ||
            btn.textContent.includes('Add')
        );
        
        if (addButton) {
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
        if (e.target === contentModal) contentModal.style.display = 'none';
        if (e.target === qrModal) qrModal.style.display = 'none';
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
    const acceptMap = {
        'image': 'image/*',
        'video': 'video/*',
        '3d': '.gltf,.glb'
    };
    contentFile.setAttribute('accept', acceptMap[type] || '');
}

// 初始化拖拽上传
function initDragAndDrop() {
    setupDropZone(markerDropZone, markerImage, handleMarkerImageChange);
    setupDropZone(contentDropZone, contentFile, handleContentFileChange);
}

// 设置拖拽区域
function setupDropZone(dropZone, fileInput, changeHandler) {
    if (!dropZone) return;
    
    // 隐藏原始文件输入框
    if (fileInput) {
        fileInput.style.display = 'none';
    }
    
    // 点击拖拽区域触发文件选择
    dropZone.addEventListener('click', () => fileInput.click());
    
    // 拖拽事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    
    // 拖拽进入和悬停
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('active'));
    });
    
    // 拖拽离开和放下
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('active'));
    });
    
    // 处理文件放下
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
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
    
    const copyToClipboard = async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(urlText);
                showCopySuccess();
            } else {
                fallbackCopyToClipboard();
            }
        } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制URL');
        }
    };
    
    const showCopySuccess = () => {
        const originalText = copyUrlBtn.textContent;
        copyUrlBtn.textContent = '已复制!';
        copyUrlBtn.classList.add('copied');
        
        setTimeout(() => {
            copyUrlBtn.textContent = originalText;
            copyUrlBtn.classList.remove('copied');
        }, 2000);
    };
    
    const fallbackCopyToClipboard = () => {
        const textArea = document.createElement('textarea');
        textArea.value = urlText;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopySuccess();
        } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制URL');
        }
        
        document.body.removeChild(textArea);
    };
    
    copyToClipboard();
}

// 处理文件
function processFiles(id, name, type) {
    const isEditing = contentId.value !== '';
    let markerImageData = '';
    let contentFileData = '';
    
    // 如果是编辑模式且没有选择新文件，使用现有文件
    if (isEditing) {
        const existingContent = contents.find(item => item.id === id);
        if (existingContent) {
            markerImageData = existingContent.markerImage;
            contentFileData = existingContent.contentFile;
        } else {
            console.error('编辑内容不存在:', id);
            alert('编辑的内容不存在，请重新创建');
            return;
        }
    }
    
    // 显示上传状态文本
    if (markerProgressText) markerProgressText.textContent = '准备上传...';
    if (contentProgressText) contentProgressText.textContent = '准备上传...';
    
    // 显示进度容器
    if (markerProgressContainer) markerProgressContainer.style.display = 'block';
    if (contentProgressContainer) contentProgressContainer.style.display = 'block';
    
    // 处理标记图像
    const processMarkerImage = new Promise((resolve, reject) => {
        if (markerImage.files[0]) {
            readFileAsDataURL(markerImage.files[0], (progress) => {
                if (markerProgressText) markerProgressText.textContent = `${Math.round(progress)}%`;
            }).then(data => {
                markerImageData = data;
                if (markerProgressText) markerProgressText.textContent = '完成';
                resolve();
            }).catch(error => {
                console.error('处理标记图像失败:', error);
                if (markerProgressText) markerProgressText.textContent = '失败';
                alert('处理标记图像失败: ' + error.message);
                reject(error);
            });
        } else {
            if (markerProgressText) markerProgressText.textContent = '无需上传';
            
            if (!markerImageData) {
                reject(new Error('缺少标记图像'));
                return;
            }
            
            resolve();
        }
    });
    
    // 处理内容文件
    const processContentFile = new Promise((resolve, reject) => {
        if (contentFile.files[0]) {
            readFileAsDataURL(contentFile.files[0], (progress) => {
                if (contentProgressText) contentProgressText.textContent = `${Math.round(progress)}%`;
            }).then(data => {
                contentFileData = data;
                if (contentProgressText) contentProgressText.textContent = '完成';
                resolve();
            }).catch(error => {
                console.error('处理内容文件失败:', error);
                if (contentProgressText) contentProgressText.textContent = '失败';
                alert('处理内容文件失败: ' + error.message);
                reject(error);
            });
        } else {
            if (contentProgressText) contentProgressText.textContent = '无需上传';
            
            if (!contentFileData) {
                reject(new Error('缺少内容文件'));
                return;
            }
            
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
                if (index !== -1) {
                    contents[index] = content;
                } else {
                    contents.push(content);
                }
            } else {
                contents.push(content);
            }
            
            // 保存到本地存储
            saveContents();
            
            // 重新渲染内容列表
            renderContentList();
            
            // 关闭模态框
            contentModal.style.display = 'none';
            
            // 隐藏进度容器
            if (markerProgressContainer) markerProgressContainer.style.display = 'none';
            if (contentProgressContainer) contentProgressContainer.style.display = 'none';
            
            // 显示上传成功通知
            showNotification(`AR内容 "${content.name}" 已成功${isEditing ? '更新' : '创建'}`, 'success');
            
            // 显示二维码
            showQRCode(content.id);
            
            console.log(`AR内容 "${content.name}" 已成功${isEditing ? '更新' : '创建'}`);
        })
        .catch(error => {
            console.error('处理文件失败:', error);
            alert(`处理文件失败: ${error.message}`);
            
            // 隐藏进度容器
            if (markerProgressContainer) markerProgressContainer.style.display = 'none';
            if (contentProgressContainer) contentProgressContainer.style.display = 'none';
        });
}

// 读取文件为 Data URL
function readFileAsDataURL(file, progressCallback) {
    return new Promise((resolve, reject) => {
        if (!file || !(file instanceof File)) {
            reject(new Error('无效的文件对象'));
            return;
        }
        
        const reader = new FileReader();
        
        // 开始读取时显示0%进度
        progressCallback(0);
        
        // 显示文件信息
        const fileSize = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`开始处理: ${file.name} (${fileSize} MB)`);
        
        reader.onload = function(e) {
            progressCallback(100);
            console.log(`处理完成: ${file.name}`);
            resolve(e.target.result);
        };
        
        reader.onerror = function(e) {
            console.error(`处理失败: ${file.name}`, e);
            reject(new Error(`文件 ${file.name} 读取失败`));
        };
        
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                progressCallback(progress);
                console.log(`处理进度: ${file.name} - ${Math.round(progress)}%`);
            }
        };
        
        // 添加小延迟以确保UI更新
        setTimeout(() => {
            try {
                reader.readAsDataURL(file);
            } catch (error) {
                reject(new Error(`无法读取文件 ${file.name}: ${error.message}`));
            }
        }, 50);
    });
}

// 处理标记图像变化
function handleMarkerImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件作为标记图像');
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
    
    // 验证文件类型
    if (type === 'image' && !file.type.startsWith('image/')) {
        alert('请选择图片文件作为内容');
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
    const content = contents.find(item => item.id === id);
    if (!content) return;
    
    if (confirm(`确定要删除 "${content.name}" 吗？此操作不可撤销。`)) {
        const index = contents.findIndex(item => item.id === id);
        if (index !== -1) {
            contents.splice(index, 1);
            saveContents();
            renderContentList();
            console.log(`已删除内容: ${content.name}`);
        }
    }
}

// 显示二维码
function showQRCode(id) {
    const content = contents.find(item => item.id === id);
    if (!content) return;
    
    // 构建AR URL
    const baseUrl = window.location.origin + window.location.pathname;
    const arViewerUrl = baseUrl.replace(/\/[^\/]*$/, '/ar-viewer.html');
    const url = `${arViewerUrl}?id=${content.id}`;
    
    // 显示URL
    arUrl.textContent = url;
    
    // 清空并创建新的二维码
    qrCode.innerHTML = '';
    
    // 检查QRCode库是否已加载
    if (typeof QRCode === 'undefined') {
        qrCode.innerHTML = '<div style="text-align: center; padding: 20px;">QRCode库加载中，请稍候...</div>';
        
        // 加载QRCode库
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js';
        script.onload = () => {
            createQRCode(url);
        };
        document.head.appendChild(script);
    } else {
        createQRCode(url);
    }
    
    // 显示模态框
    qrModal.style.display = 'block';
}

// 创建二维码
function createQRCode(url) {
    qrCode.innerHTML = '';
    
    new QRCode(qrCode, {
        text: url,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // 添加下载按钮
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.innerHTML = '<i class="ri-download-line"></i> 下载二维码';
    downloadBtn.style.marginTop = '15px';
    
    downloadBtn.addEventListener('click', () => {
        const canvas = qrCode.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'ar-qrcode.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    });
    
    qrCode.appendChild(downloadBtn);
}

// 检查浏览器兼容性
function checkBrowserCompatibility() {
    const isWebARSupported = navigator.xr && navigator.xr.isSessionSupported;
    const isWebGLSupported = (() => {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    })();
    
    if (!isWebGLSupported) {
        console.warn('WebGL 不受支持，AR体验可能受限');
    }
    
    if (!isWebARSupported) {
        console.warn('WebXR 不受支持，AR体验可能受限');
    }
    
    return {
        webgl: isWebGLSupported,
        webxr: isWebARSupported
    };
}

// 初始化应用
checkBrowserCompatibility();
