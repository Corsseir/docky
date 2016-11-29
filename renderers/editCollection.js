/**
 * Created by corss on 11/10/2016.
 */

const Tree = require('../renderer.js').Tree

function EditCollection() {
    var handleAcceptCollectionClick = function (event) {
        console.log('jestem tu')
        var inputs = $('#side-right').find('input')
        var data = {};

        console.log(inputs)

        inputs.each(function (i, v) {
            data[$(v).attr('name')] = $(v).val()
        })

        console.log(data)

        new Tree().editCollection(data)
    }

    var init = function () {
        $(document).on('click', '#accept-collection', handleAcceptCollectionClick)
    }
    init()
}

new EditCollection()
