
// 拡張アイコン押下時にcontent scriptへ自動入力メッセージ送信
chrome.action.onClicked.addListener((tab) => {
	if (tab.id) {
		chrome.tabs.sendMessage(tab.id, { type: 'autoFillForm' });
	}
});
