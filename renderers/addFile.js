/**
 * Created by corss on 11/10/2016.
 */

const mainProccess = require('electron').remote.require('./main.js')
const Tree = require('../renderer.js').Tree

function AddFile() {
    var handleOpenClick = function (event) {
        var path = mainProccess.getFilePath()
        $('#id_path').val(path)
    }

    var handleAcceptFileClick = function (event) {
        var inputs = $('#side-right').find('input')
        var data = {};

        console.log(inputs)

        inputs.each(function (i, v) {
            data[$(v).attr('name')] = $(v).val()
        })

        console.log(data)

        new Tree().addFile(data)
    }

    var init = function () {
        $(document).on('click', '#id_path-icon', handleOpenClick)
        $(document).on('click', '#accept-file', handleAcceptFileClick)
    }
    init()
}

new AddFile()

