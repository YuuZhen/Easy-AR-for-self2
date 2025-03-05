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
    
    // 添加进度条覆盖层到预览区域
    addProgressOverlay(markerPreview, 'marker-progress-overlay');
    addProgressOverlay(contentPreview, 'content-progress-overlay');
    
    // 获取新创建的覆盖层进度条元素
    const markerProgressOverlay = document.getElementById('marker-progress-overlay');
    const contentProgressOverlay = document.getElementById('content-progress-overlay');
    
    // 处理标记图像
    const processMarkerImage = new Promise((resolve, reject) => {
        if (markerImage.files[0]) {
            readFileAsDataURL(markerImage.files[0], (progress) => {
                updateProgressOverlay(markerProgressOverlay, progress);
            }).then(data => {
                markerImageData = data;
                // 完成后设置为100%
                updateProgressOverlay(markerProgressOverlay, 100);
                // 短暂延迟后隐藏覆盖层
                setTimeout(() => {
                    if (markerProgressOverlay) markerProgressOverlay.style.opacity = '0';
                }, 500);
                resolve();
            }).catch(error => {
                console.error('处理标记图像失败:', error);
                alert('处理标记图像失败: ' + error.message);
                reject(error);
            });
        } else {
            // 如果没有新文件，直接设置为100%并隐藏
            updateProgressOverlay(markerProgressOverlay, 100);
            setTimeout(() => {
                if (markerProgressOverlay) markerProgressOverlay.style.opacity = '0';
            }, 500);
            resolve();
        }
    });
    
    // 处理内容文件
    const processContentFile = new Promise((resolve, reject) => {
        if (contentFile.files[0]) {
            readFileAsDataURL(contentFile.files[0], (progress) => {
                updateProgressOverlay(contentProgressOverlay, progress);
            }).then(data => {
                contentFileData = data;
                // 完成后设置为100%
                updateProgressOverlay(contentProgressOverlay, 100);
                // 短暂延迟后隐藏覆盖层
                setTimeout(() => {
                    if (contentProgressOverlay) contentProgressOverlay.style.opacity = '0';
                }, 500);
                resolve();
            }).catch(error => {
                console.error('处理内容文件失败:', error);
                alert('处理内容文件失败: ' + error.message);
                reject(error);
            });
        } else {
            // 如果没有新文件，直接设置为100%并隐藏
            updateProgressOverlay(contentProgressOverlay, 100);
            setTimeout(() => {
                if (contentProgressOverlay) contentProgressOverlay.style.opacity = '0';
            }, 500);
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
            
            // 移除进度条覆盖层
            removeProgressOverlay('marker-progress-overlay');
            removeProgressOverlay('content-progress-overlay');
            
            // 显示二维码
            showQRCode(content.id);
        })
        .catch(error => {
            console.error('处理文件失败:', error);
            // 移除进度条覆盖层
            removeProgressOverlay('marker-progress-overlay');
            removeProgressOverlay('content-progress-overlay');
        });
}

// 读取文件为 Data URL
function readFileAsDataURL(file, progressCallback) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        // 开始读取时显示0%进度
        progressCallback(0);
        
        // 模拟进度更新
        let simulatedProgress = 0;
        const progressInterval = setInterval(() => {
            if (simulatedProgress < 90) {
                simulatedProgress += Math.random() * 5 + 2; // 更平滑的增长
                progressCallback(Math.min(simulatedProgress, 90));
            } else {
                clearInterval(progressInterval);
            }
        }, 100); // 更频繁的更新
        
        reader.onload = function(e) {
            // 清除模拟进度定时器
            clearInterval(progressInterval);
            // 完成时回调100%进度
            progressCallback(100);
            resolve(e.target.result);
        };
        
        reader.onerror = function(e) {
            clearInterval(progressInterval);
            reject(new Error('文件读取失败'));
        };
        
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                // 实际进度优先于模拟进度
                clearInterval(progressInterval);
                progressCallback(progress);
                
                // 如果实际进度小于90%，继续模拟剩余进度
                if (progress < 90) {
                    simulatedProgress = progress;
                    const newProgressInterval = setInterval(() => {
                        if (simulatedProgress < 90) {
                            simulatedProgress += Math.random() * 3 + 1;
                            progressCallback(Math.min(simulatedProgress, 90));
                        } else {
                            clearInterval(newProgressInterval);
                        }
                    }, 100);
                }
            }
        };
        
        // 添加短暂延迟，确保UI更新
        setTimeout(() => {
            reader.readAsDataURL(file);
        }, 50);
    });
}
