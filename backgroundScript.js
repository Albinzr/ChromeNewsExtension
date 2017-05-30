chrome.contextMenus.create({
	title: "Search with Quintype",
	contexts: ["selection"],
	onclick: search
});

function search(data) {
	var selectedText = data.selectionText;
	chrome.tabs.create({
		url: "https://thequint.com/search?q=" + selectedText
	});
}
