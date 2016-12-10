browser.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs)
{
  if(tabs[0].url.toString().toLowerCase().includes(".pdf"))
  {
    $("b").text("Dodaj PDF")
    $("div").click(function ()
    {
      browser.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs)
      {
        browser.runtime.sendMessage({"url": tabs[0].url});
      });
    })
  }
  else
  {
    $("b").text("To nie jest PDF")
  }
});