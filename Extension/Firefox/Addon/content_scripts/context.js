iconURL = browser.extension.getURL("icons/docky-48.png");

$("[href*='.pdf']").each(function ()
{
  let replacement = $("<div>" + $(this).get(0).outerHTML + " <img id='" + $(this)[0].href + "' src='" + iconURL + "' height='20' width='20' style='vertical-align: bottom;'></div>")
  $(this).replaceWith(replacement)
  replacement.find('img').click(function(){
    console.log(replacement.find('img').attr('id'))
    browser.runtime.sendMessage({"url": replacement.find('img').attr('id')});
    replacement.find('img').hide()
  });
})