/**
 * Created by corsseir on 10/21/16.
 */

function Import () {
    var getTemplate = function (linkId, sectionId) {
        var link = document.querySelector(linkId);
        var template = link.import.querySelector(sectionId);
        var clone = document.importNode(template.content, true);

        return $(clone)
    }

    return {
        getTemplate: getTemplate,
    }
}

module.exports = { Import };