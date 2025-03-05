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
    initDOMElements();
    preloadQRCodeLibrary();
    loadContents();
    renderContentList();
    updateDropZoneText(); // 添加这一行来更新拖拽区域文本
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
    
    // 处理文件 - 修复这里，删除错误的代码块
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
        markerImageData = existingContent.markerImage;
        contentFileData = existingContent.contentFile;
    }
    
    // 显示进度条
    if (markerProgressContainer) markerProgressContainer.style.display = 'block';
    if (contentProgressContainer) contentProgressContainer.style.display = 'block';
    
    // 处理标记图像
    const processMarkerImage = new Promise((resolve, reject) => {
        if (markerImage.files[0]) {
            readFileAsDataURL(markerImage.files[0], (progress) => {
                updateProgress(markerProgressBar, markerProgressText, progress);
            }).then(data => {
                markerImageData = data;
                resolve();
            }).catch(error => {
                console.error('处理标记图像失败:', error);
                alert('处理标记图像失败: ' + error.message);
                reject(error);
            });
        } else {
            // 如果没有新文件，直接完成
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
                resolve();
            }).catch(error => {
                console.error('处理内容文件失败:', error);
                alert('处理内容文件失败: ' + error.message);
                reject(error);
            });
        } else {
            // 如果没有新文件，直接完成
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
            if (markerProgressContainer) markerProgressContainer.style.display = 'none';
            if (contentProgressContainer) contentProgressContainer.style.display = 'none';
            
            // 显示二维码
            showQRCode(content.id);
        })
        .catch(error => {
            console.error('处理文件失败:', error);
            // 隐藏进度条
            if (markerProgressContainer) markerProgressContainer.style.display = 'none';
            if (contentProgressContainer) contentProgressContainer.style.display = 'none';
        });
}

// 更新进度条
function updateProgress(progressBar, progressText, progress) {
    if (!progressBar || !progressText) return;
    
    const safeProgress = Math.max(0, Math.min(100, progress));
    progressBar.style.width = `${safeProgress}%`;
    progressText.textContent = `${Math.round(safeProgress)}%`;
    
    // 根据进度改变颜色
    if (safeProgress < 30) {
        progressBar.style.backgroundColor = '#ff9800';
    } else if (safeProgress < 70) {
        progressBar.style.backgroundColor = '#2196f3';
    } else {
        progressBar.style.backgroundColor = '#4caf50';
    }
}

// 读取文件为 Data URL
function readFileAsDataURL(file, progressCallback) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        // 开始读取时显示0%进度
        progressCallback(0);
        
        // 显示文件信息
        const fileSize = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`开始上传: ${file.name} (${fileSize} MB)`);
        
        // 模拟进度更新，更加平滑
        let simulatedProgress = 0;
        const progressInterval = setInterval(() => {
            if (simulatedProgress < 95) {
                // 根据文件大小调整进度增长速度
                const increment = Math.max(0.5, Math.min(5, 10 / Math.sqrt(file.size / 1024)));
                simulatedProgress += increment;
                progressCallback(Math.min(simulatedProgress, 95));
            } else {
                clearInterval(progressInterval);
            }
        }, 100);
        
        reader.onload = function(e) {
            clearInterval(progressInterval);
            progressCallback(100);
            console.log(`上传完成: ${file.name}`);
            resolve(e.target.result);
        };
        
        reader.onerror = function(e) {
            clearInterval(progressInterval);
            console.error(`上传失败: ${file.name}`, e);
            reject(new Error(`文件 ${file.name} 读取失败`));
        };
        
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                clearInterval(progressInterval);
                progressCallback(progress);
                console.log(`上传进度: ${file.name} - ${Math.round(progress)}%`);
                
                if (progress < 95) {
                    simulatedProgress = progress;
                    const newProgressInterval = setInterval(() => {
                        if (simulatedProgress < 95) {
                            simulatedProgress += 0.5;
                            progressCallback(Math.min(simulatedProgress, 95));
                        } else {
                            clearInterval(newProgressInterval);
                        }
                    }, 100);
                }
            }
        };
        
        // 添加小延迟以确保UI更新
        setTimeout(() => {
            reader.readAsDataURL(file);
        }, 50);
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
    
    // 生成AR查看器URL
    const baseUrl = window.location.href.includes('index.html') 
        ? window.location.href.replace('index.html', '') 
        : window.location.href.endsWith('/') 
            ? window.location.href 
            : window.location.href + '/';
    
    const url = `${baseUrl}ar-viewer.html?id=${id}`;
    
    // 清空二维码容器
    qrCode.innerHTML = '';
    
    // 显示URL
    arUrl.textContent = url;
    
    // 显示模态框
    qrModal.style.display = 'block';
    
    // 生成二维码
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrCode, {
            text: url,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        // 如果QRCode库尚未加载，等待加载完成后再生成
        const checkQRCode = setInterval(() => {
            if (typeof QRCode !== 'undefined') {
                clearInterval(checkQRCode);
                new QRCode(qrCode, {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }, 200);
        
        // 5秒后如果仍未加载，显示错误信息
        setTimeout(() => {
            if (typeof QRCode === 'undefined') {
                clearInterval(checkQRCode);
                qrCode.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <p>二维码生成失败，请手动复制链接</p>
                    </div>
                `;
            }
        }, 5000);
    }
}

// 检测浏览器存储限制
function checkStorageLimit() {
    let testData = '';
    const testSize = 1024 * 1024; // 1MB
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    try {
        // 尝试存储越来越多的数据，直到失败
        for (let i = 0; i < 10; i++) {
            testData += new Array(testSize).join('a');
            localStorage.setItem('storageTest', testData);
        }
    } catch (e) {
        console.log('存储限制约为:', testData.length / 1024 / 1024, 'MB');
    } finally {
        localStorage.removeItem('storageTest');
    }
}

// 初始化时检查存储限制
// checkStorageLimit();
