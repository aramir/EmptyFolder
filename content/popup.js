 window.addEventListener("load", onLoad);
 
 async function notifyMode(event) {
	await messenger.runtime.sendMessage({ popupCloseMode: event.target.getAttribute("data") });
	 //does not work until bug 1675940 has landed on ESR
	 // window.close();
	 let win = await messenger.windows.getCurrent();
	 messenger.windows.remove(win.id);
 }

 async function onLoad() {
	 document.getElementById("button_ok").addEventListener("click", notifyMode);
	 document.getElementById("button_cancel").addEventListener("click", notifyMode);
	 document.addEventListener("keydown", function(event) {
		 const key = event.key;
		 if (key === "Escape") {
			 document.getElementById("button_cancel").dispatchEvent(new Event('click'));
		 }
		 if (key === "Enter") {
			 document.getElementById("button_ok").dispatchEvent(new Event("click"));
		 }
	 });

 }