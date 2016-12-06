browser.runtime.onMessage.addListener(passMessageToHost);
var port = browser.runtime.connectNative("docky_host")
port.onMessage.addListener(function(response)
{
    console.log("Received: " + response)
     browser.notifications.create(
     {
     "type": "basic",
     "iconUrl": browser.extension.getURL("icons/docky-48.png"),
     "title": "Docky Extension",
     "message": "Dodano: " + response.toString()
     })
});

function passMessageToHost(message)
{
    console.log("Sending: " + message.url)
    port.postMessage("add " + message.url)
}