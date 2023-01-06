/* globals browser, messenger */

browser.menus.create({
  id: "empty-folder",
  title: browser.i18n.getMessage("empty-folder"),
  contexts: ["folder_pane"],
  async onclick(info) {
    emptyFolder(info.selectedFolder);
  },
});

browser.menus.onShown.addListener((info) => {
  let folder = info.selectedFolder;
  //console.log("Selected Folder", folder)
  if (folder == undefined || folder.type === "trash") {
    //hiding for trash folder
    browser.menus.update("empty-folder", { visible: false });
    browser.menus.refresh();
  } else {
    //showing for all others, but disabling if no messages in folder
    browser.menus.update("empty-folder", { visible: true });
    messenger.messages.list(folder).then(
      function(r) {
        browser.menus.update("empty-folder", { enabled: r.messages.length > 0 });
        browser.menus.refresh();
      }
    );
  }
});

browser.commands.onCommand.addListener((command) => {
  // console.log("Command", command, messenger.mailTabs.getCurrent());
  if (command === "empty-folder") {
    messenger.mailTabs.getCurrent().then(
      function(mt) {
        if (mt && mt.displayedFolder.type !== "trash") {
          emptyFolder(mt.displayedFolder);
        }
      }
    );
  }
});

async function emptyFolder(folder) {
  if (await confirm()) {
    let page = await messenger.messages.list(folder);
    if (page.messages.length > 0) {
      page.messages.forEach(m => markRead(m));
      messenger.messages.delete(page.messages.map(m => m.id));
    }
    while (page.id) {
      page = await messenger.messages.continueList(page.id);
      if (page.messages.length > 0) {
        page.messages.forEach(m => markRead(m));
        messenger.messages.delete(page.messages.map(m => m.id));
      }
    }
  }
}

function markRead(message) {
  
}

async function confirm() {
  let window = await messenger.windows.create({
      url: "content/popup.html",
      titlePreface: "Empty Folder - ",
      allowScriptsToClose: true,
      type: "popup",
      height: 100,
      width: 370
    }
  );
  // await the created popup to be closed and define a default
  // return value if the window is closed without clicking a button
  let rv = await popupClosePromise(window.id, "cancel");
  return rv === "ok";
}

// Function to open a popup and await user feedback
async function popupClosePromise(popupId, defaultPopupCloseMode) {
  try {
    await messenger.windows.get(popupId);
  } catch (e) {
    //window does not exist, assume closed
    return defaultPopupCloseMode;
  }
  return new Promise(resolve => {
    let popupCloseMode = defaultPopupCloseMode;
    function windowRemoveListener(closedId) {
      if (popupId == closedId) {
        messenger.windows.onRemoved.removeListener(windowRemoveListener);
        messenger.runtime.onMessage.removeListener(messageListener);
        resolve(popupCloseMode);
      }
    }
    function messageListener(request, sender, sendResponse) {
      if (sender.tab.windowId == popupId && request && request.popupCloseMode) {
        popupCloseMode = request.popupCloseMode;
      }
    }
    messenger.runtime.onMessage.addListener(messageListener);
    messenger.windows.onRemoved.addListener(windowRemoveListener);
  });
}

