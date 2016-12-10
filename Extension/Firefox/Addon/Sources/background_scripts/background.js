browser.runtime.onMessage.addListener(passMessageToHost);
var port = browser.runtime.connectNative("docky_host")
port.onMessage.addListener(function(response)
{
    console.log("Received: ")
    console.log(response)
    console.log(response.file)
    console.log(response.status)
    if(response.status === "success")
    {
        let message = "Dodano plik: " + response.file.Filename
        message += "\nData: " + response.file.Date
        message += "\nChecksum: " + response.file.Checksum
        browser.notifications.create(
        {
            "type": "basic",
            "iconUrl": browser.extension.getURL("icons/docky-48.png"),
            "title": "Docky Extension: dodano nowy plik",
            "message": message
        })
    }
    else if(response.status === "exist")
    {
        let message = "Plik już istnieje w bazie pod nazwą: " + response.file.Filename
        message += "\nData dodania: " + response.file.Date
        message += "\nChecksum: " + response.file.Checksum
        browser.notifications.create(
        {
            "type": "basic",
            "iconUrl": browser.extension.getURL("icons/docky-48.png"),
            "title": "Docky Extension: plik już istnieje w bazie",
            "message": message
        })
    }
    else if(response.status === "error")
    {
        let message = "Ups, coś poszło nie tak."
        message += "\nSpróbuj dodać plik ręcznie."
        browser.notifications.create(
        {
            "type": "basic",
            "iconUrl": browser.extension.getURL("icons/docky-48.png"),
            "title": "Docky Extension: coś poszło nie tak",
            "message": message
        })
    }
});

function passMessageToHost(message)
{
    console.log("Sending: " + message.url)
    port.postMessage("add " + message.url)
}