// GIF 播放控制器 - Popup 脚本

// ==================== 国际化翻译 ====================
const translations = {
    'zh-CN': {
        title: 'GIF 播放控制器设置',
        header_title: 'GIF 播放控制器',
        loading: '加载中...',
        section_current_page: '当前页面',
        temp_disable_name: '临时禁用此页面',
        temp_disable_desc: '刷新后恢复',
        domain_disable_name: '禁用此域名',
        domain_disable_desc: '永久禁用该网站',
        section_global_config: '全局配置',
        min_size_name: '最小尺寸阈值',
        min_size_desc: '小于此尺寸不处理',
        width: '宽',
        height: '高',
        auto_load_limit_name: '自动加载上限',
        auto_load_limit_desc: '超过此数量需手动点击',
        auto_play_name: '自动播放',
        auto_play_desc: '加载后自动开始播放',
        auto_load_name: '自动加载',
        auto_load_desc: '关闭后需点击 GIF 手动加载',
        section_config_mgmt: '配置管理',
        config_placeholder: '配置 JSON 将显示在此处...',
        export_config: '导出配置',
        import_config: '导入配置',
        toast_temp_disabled: '已临时禁用此页面',
        toast_temp_enabled: '已恢复此页面',
        toast_domain_disabled: '已禁用 {domain}',
        toast_domain_enabled: '已启用 {domain}',
        toast_config_exported: '配置已导出',
        toast_config_imported: '配置已导入',
        toast_paste_config: '请先粘贴配置内容',
        toast_config_error: '配置格式错误'
    },
    'en': {
        title: 'GIF Player Settings',
        header_title: 'GIF Player',
        loading: 'Loading...',
        section_current_page: 'Current Page',
        temp_disable_name: 'Temporarily Disable This Page',
        temp_disable_desc: 'Restored after refresh',
        domain_disable_name: 'Disable This Domain',
        domain_disable_desc: 'Permanently disable this website',
        section_global_config: 'Global Configuration',
        min_size_name: 'Minimum Size Threshold',
        min_size_desc: 'Ignore GIFs smaller than this',
        width: 'W',
        height: 'H',
        auto_load_limit_name: 'Auto Load Limit',
        auto_load_limit_desc: 'Require manual click if exceeded',
        auto_play_name: 'Auto Play',
        auto_play_desc: 'Start playing after loading',
        auto_load_name: 'Auto Load',
        auto_load_desc: 'Click GIF to load manually when off',
        section_config_mgmt: 'Configuration Management',
        config_placeholder: 'Configuration JSON will be displayed here...',
        export_config: 'Export Config',
        import_config: 'Import Config',
        toast_temp_disabled: 'Page temporarily disabled',
        toast_temp_enabled: 'Page restored',
        toast_domain_disabled: 'Disabled {domain}',
        toast_domain_enabled: 'Enabled {domain}',
        toast_config_exported: 'Configuration exported',
        toast_config_imported: 'Configuration imported',
        toast_paste_config: 'Please paste configuration first',
        toast_config_error: 'Invalid configuration format'
    }
};

// 检测浏览器语言
function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    // 如果是中文（任何变体），使用中文
    if (browserLang.startsWith('zh')) {
        return 'zh-CN';
    }
    // 否则使用英文
    return 'en';
}

// 当前语言
let currentLang = detectLanguage();

// 获取翻译文本
function t(key, params = {}) {
    let text = translations[currentLang][key] || translations['en'][key] || key;
    // 替换参数
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    return text;
}

// 应用翻译到页面
function applyTranslations() {
    // 更新 title
    document.title = t('title');

    // 更新所有带 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // 更新 placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // 应用翻译
    applyTranslations();

    // DOM 元素
    const currentDomainEl = document.getElementById('currentDomain');
    const tempDisableToggle = document.getElementById('tempDisableToggle');
    const domainDisableToggle = document.getElementById('domainDisableToggle');
    const minWidthInput = document.getElementById('minWidth');
    const minHeightInput = document.getElementById('minHeight');
    const maxAutoLoadCountInput = document.getElementById('maxAutoLoadCount');
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    const autoLoadToggle = document.getElementById('autoLoadToggle');
    const configTextarea = document.getElementById('configTextarea');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const toast = document.getElementById('toast');

    let currentDomain = '';
    let currentTabId = null;

    // 显示提示信息
    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.className = 'toast show' + (isError ? ' error' : '');
        setTimeout(() => {
            toast.className = 'toast';
        }, 2000);
    }

    // 获取当前标签页信息
    async function getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }

    // 从 URL 提取域名
    function extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return '';
        }
    }

    // 加载配置
    async function loadConfig() {
        return new Promise((resolve) => {
            chrome.storage.sync.get([
                'autoLoadEnabled',
                'autoPlayEnabled',
                'minWidth',
                'minHeight',
                'maxAutoLoadCount',
                'disabledDomains'
            ], (result) => {
                resolve({
                    autoLoadEnabled: result.autoLoadEnabled !== false,
                    autoPlayEnabled: result.autoPlayEnabled !== false,
                    minWidth: result.minWidth ?? 200,
                    minHeight: result.minHeight ?? 100,
                    maxAutoLoadCount: result.maxAutoLoadCount ?? 4,
                    disabledDomains: result.disabledDomains ?? []
                });
            });
        });
    }

    // 保存单个配置项
    function saveConfig(key, value) {
        chrome.storage.sync.set({ [key]: value });
    }

    // 向当前页面发送消息
    async function sendMessageToTab(message) {
        if (!currentTabId) return;
        try {
            await chrome.tabs.sendMessage(currentTabId, message);
        } catch (e) {
            // 页面可能没有加载 content script
        }
    }

    // 初始化
    async function init() {
        // 获取当前标签页
        const tab = await getCurrentTab();
        if (tab) {
            currentTabId = tab.id;
            currentDomain = extractDomain(tab.url);
            currentDomainEl.textContent = currentDomain || t('loading');
        }

        // 加载配置
        const config = await loadConfig();

        // 设置 UI 状态
        autoLoadToggle.checked = config.autoLoadEnabled;
        autoPlayToggle.checked = config.autoPlayEnabled;
        minWidthInput.value = config.minWidth;
        minHeightInput.value = config.minHeight;
        maxAutoLoadCountInput.value = config.maxAutoLoadCount;

        // 检查当前域名是否被禁用
        domainDisableToggle.checked = config.disabledDomains.includes(currentDomain);
    }

    // ==================== 事件处理 ====================

    // 临时禁用当前页面
    tempDisableToggle.addEventListener('change', async () => {
        const disabled = tempDisableToggle.checked;
        await sendMessageToTab({
            type: 'GIF_TEMP_DISABLE',
            disabled: disabled
        });
        showToast(disabled ? t('toast_temp_disabled') : t('toast_temp_enabled'));
    });

    // 禁用域名
    domainDisableToggle.addEventListener('change', async () => {
        const disabled = domainDisableToggle.checked;
        const config = await loadConfig();
        let domains = config.disabledDomains;

        if (disabled) {
            if (!domains.includes(currentDomain)) {
                domains.push(currentDomain);
            }
        } else {
            domains = domains.filter(d => d !== currentDomain);
        }

        saveConfig('disabledDomains', domains);

        // 通知页面刷新状态
        await sendMessageToTab({
            type: 'GIF_DOMAIN_DISABLE_CHANGED',
            disabled: disabled,
            domain: currentDomain
        });

        showToast(disabled ? t('toast_domain_disabled', { domain: currentDomain }) : t('toast_domain_enabled', { domain: currentDomain }));
    });

    // 最小宽度
    minWidthInput.addEventListener('change', () => {
        const value = parseInt(minWidthInput.value) || 0;
        saveConfig('minWidth', value);
        sendMessageToTab({ type: 'GIF_CONFIG_UPDATE', minWidth: value });
    });

    // 最小高度
    minHeightInput.addEventListener('change', () => {
        const value = parseInt(minHeightInput.value) || 0;
        saveConfig('minHeight', value);
        sendMessageToTab({ type: 'GIF_CONFIG_UPDATE', minHeight: value });
    });

    // 自动加载数量上限
    maxAutoLoadCountInput.addEventListener('change', () => {
        const value = parseInt(maxAutoLoadCountInput.value) || 1;
        saveConfig('maxAutoLoadCount', value);
        sendMessageToTab({ type: 'GIF_CONFIG_UPDATE', maxAutoLoadCount: value });
    });

    // 自动播放
    autoPlayToggle.addEventListener('change', () => {
        const enabled = autoPlayToggle.checked;
        saveConfig('autoPlayEnabled', enabled);
        sendMessageToTab({ type: 'GIF_CONFIG_UPDATE', autoPlayEnabled: enabled });
    });

    // 自动加载
    autoLoadToggle.addEventListener('change', () => {
        const enabled = autoLoadToggle.checked;
        saveConfig('autoLoadEnabled', enabled);
        sendMessageToTab({ type: 'GIF_CONFIG_UPDATE', autoLoadEnabled: enabled });
    });

    // 导出配置
    exportBtn.addEventListener('click', async () => {
        const config = await loadConfig();
        const exportData = {
            minWidth: config.minWidth,
            minHeight: config.minHeight,
            maxAutoLoadCount: config.maxAutoLoadCount,
            autoPlayEnabled: config.autoPlayEnabled,
            autoLoadEnabled: config.autoLoadEnabled,
            disabledDomains: config.disabledDomains
        };
        configTextarea.value = JSON.stringify(exportData, null, 2);
        showToast(t('toast_config_exported'));
    });

    // 导入配置
    importBtn.addEventListener('click', async () => {
        const text = configTextarea.value.trim();
        if (!text) {
            showToast(t('toast_paste_config'), true);
            return;
        }

        try {
            const importData = JSON.parse(text);

            // 验证并保存配置
            if (typeof importData.minWidth === 'number') {
                saveConfig('minWidth', importData.minWidth);
                minWidthInput.value = importData.minWidth;
            }
            if (typeof importData.minHeight === 'number') {
                saveConfig('minHeight', importData.minHeight);
                minHeightInput.value = importData.minHeight;
            }
            if (typeof importData.maxAutoLoadCount === 'number') {
                saveConfig('maxAutoLoadCount', importData.maxAutoLoadCount);
                maxAutoLoadCountInput.value = importData.maxAutoLoadCount;
            }
            if (typeof importData.autoPlayEnabled === 'boolean') {
                saveConfig('autoPlayEnabled', importData.autoPlayEnabled);
                autoPlayToggle.checked = importData.autoPlayEnabled;
            }
            if (typeof importData.autoLoadEnabled === 'boolean') {
                saveConfig('autoLoadEnabled', importData.autoLoadEnabled);
                autoLoadToggle.checked = importData.autoLoadEnabled;
            }
            if (Array.isArray(importData.disabledDomains)) {
                saveConfig('disabledDomains', importData.disabledDomains);
                domainDisableToggle.checked = importData.disabledDomains.includes(currentDomain);
            }

            showToast(t('toast_config_imported'));
        } catch (e) {
            showToast(t('toast_config_error'), true);
        }
    });

    // 启动
    await init();
});
