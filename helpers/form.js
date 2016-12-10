/**
 * Created by corsseir on 10/21/16.
 */

class Form {
    collect() {
        var inputs = $('#side-right').find('input')
        var data = {}

        inputs.each(function (i, v) {
            data[$(v).attr('name')] = $(v).val()
        })

        return data
    }
}

module.exports = { Form };