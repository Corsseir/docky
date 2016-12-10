iconURL = browser.extension.getURL("icons/docky-48.png");
toolbarButton = $("<button id='DockyExtensionToolbarButton' class='toolbarButton'><img src='" + iconURL + "' height='18' width='18'></button>")
$("#toolbarViewerRight").prepend(toolbarButton)
toolbarButton.click(function ()
{
  browser.runtime.sendMessage({"url": $(location).attr('href')});
})
