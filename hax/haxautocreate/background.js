//定义一个变量（是否启用WebRTC）、一个常量（判断是不是firefox）。
let pubwebrtc=false;
const isFirefox = /Firefox/.test(navigator.userAgent) || typeof InstallTrigger !== 'undefined';

//这个是关闭标签页触发的回调，主要功能是删除计时器
chrome.tabs.onRemoved.addListener((tabId) => {
	chrome.storage.local.get(["refreshTabs"], (data) => {
		let refreshTabs = data.refreshTabs || {};
		if (refreshTabs[tabId]){
			if (refreshTabs[tabId]["timer"])chrome.alarms.clear(refreshTabs[tabId]["timer"]);
			delete refreshTabs[tabId];
			chrome.storage.local.set({ refreshTabs });
		}
	});
});

//这个是设置并开启定时刷新的功能，由popup.html（交互式窗口）触发
function setRefreshTimer(tabId, interval) {
    chrome.storage.local.get(["refreshTabs"], (data) => {
        let refreshTabs = data.refreshTabs || {};
		if (!refreshTabs[tabId]) refreshTabs[tabId]={};
		if (refreshTabs[tabId]["timer"])chrome.alarms.clear(refreshTabs[tabId]["timer"]);
		refreshTabs[tabId]["timer"]="auto"+tabId;
		chrome.alarms.create(refreshTabs[tabId]["timer"], {delayInMinutes: 0, periodInMinutes: interval/60});
		refreshTabs[tabId]["interval"] = interval;
        chrome.storage.local.set({ refreshTabs });
    });
}

//这个是接收popup.html传入的消息并做相应的处理，主要功能是开/关自动刷新、启用/禁用WebRTC
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action, tabId, interval } = request;
    if (action === "start_refresh") {
        setRefreshTimer(tabId, interval);
    } else if (action === "stop_refresh") {
		chrome.storage.local.get(["refreshTabs"], (data) => {
			let refreshTabs = data.refreshTabs || {};
			if(refreshTabs[tabId]){
				if(refreshTabs[tabId]["timer"]){
					chrome.alarms.clear(refreshTabs[tabId]["timer"]);
					delete refreshTabs[tabId]["timer"];
					chrome.storage.local.set({ refreshTabs });
				}
			}
		})
    } else if (action === "start_webrtc") {
		webrtcfunc(true,true);
	} else if (action === "stop_webrtc") {
		webrtcfunc(false,true);
	}
	sendResponse({ success: true });
});

//计时器主函数，主要功能是重载页面（不受其他外在因素影响）
chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name.substr(0,4) == "auto") {
		let tabId=parseInt(alarm.name.substr(4));
		try{chrome.tabs.reload(tabId)}catch(e){}
	}
});

//启用或禁用WebRTC后调用的功能函数
function webrtcaction() {
	chrome.storage.local.get({
		enabled: !pubwebrtc,
		eMode: isFirefox ? 'proxy_only' : 'disable_non_proxied_udp',
		dMode: 'default_public_interface_only'
	}, prefs => {
		const value = prefs.enabled ? prefs.eMode : prefs.dMode;
		chrome.privacy.network.webRTCIPHandlingPolicy.clear({}, () => {chrome.privacy.network.webRTCIPHandlingPolicy.set({value}, () => {chrome.privacy.network.webRTCIPHandlingPolicy.get({}, s => {})})});
	});
}

//开启、禁用WebRTC
function webrtcfunc(v,s){
	let webrtc = v; pubwebrtc = webrtc;
	if (s) chrome.storage.local.set({ webrtc });
	webrtcaction();
}

//在插件加载、安装、更新时触发，主要功能是初始化WebRTC
function webrtcinit(){
	chrome.storage.onChanged.addListener(() => {webrtcaction()});
	chrome.storage.local.get(["webrtc"], (data) => {
		let webrtc = data.webrtc || false;
		webrtcfunc(webrtc,false);
	});
}

//在插件加载、安装、更新时触发，主要功能是初始化计时器本地存储
function clearStoredTabs() {
	let refreshTabs={};
	chrome.storage.local.set({ refreshTabs });
}

chrome.runtime.onStartup.addListener(() => {webrtcinit(); clearStoredTabs()});
chrome.runtime.onInstalled.addListener((details) => {webrtcinit(); if (details.reason === "install") clearStoredTabs()});