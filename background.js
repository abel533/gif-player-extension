// GIF 播放控制器 - 后台服务脚本

// 默认配置
const DEFAULT_CONFIG = {
    autoLoadEnabled: true,
    autoPlayEnabled: true,
    minWidth: 200,
    minHeight: 100,
    maxAutoLoadCount: 4,
    disabledDomains: []
};

// 扩展安装或更新时初始化默认配置
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (result) => {
        const updates = {};

        for (const [key, defaultValue] of Object.entries(DEFAULT_CONFIG)) {
            if (result[key] === undefined) {
                updates[key] = defaultValue;
            }
        }

        if (Object.keys(updates).length > 0) {
            chrome.storage.sync.set(updates, () => {
                console.log('GIF 控制器: 已设置默认配置', updates);
            });
        }
    });
});
