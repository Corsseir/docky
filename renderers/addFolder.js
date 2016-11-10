/**
 * Created by corss on 11/10/2016.
 */

const Tree = require('../renderer.js').Tree

function AddFolder() {
    var handleAcceptClick = function (event) {
        var inputs = $('#side-right').find('input')
        var data = {};

        console.log(inputs)

        inputs.each(function (i, v) {
            data[$(v).attr('name')] = $(v).val()
        })

        console.log(data)

        new Tree().addCollection(data)
    }
    
    var init = function () {
        $(document).on('click', '#accept', handleAcceptClick)
    }
    init()
}

new AddFolder()

