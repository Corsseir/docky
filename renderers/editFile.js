/**
 * Created by corss on 11/10/2016.
 */

const Tree = require('../renderer.js').Tree

function EditFile() {
    var handleAcceptFileClick = function (event) {
        var inputs = $('#side-right').find('input')
        var data = {};

        console.log(inputs)

        inputs.each(function (i, v) {
            data[$(v).attr('name')] = $(v).val()
        })

        console.log(data)

        new Tree().editFile(data)
    }

    var init = function () {
        $(document).on('click', '#accept-file', handleAcceptFileClick)
    }
    init()
}

new EditFile()

