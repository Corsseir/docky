/**
 * Created by corsseir on 10/21/16.
 */

class Form {
    collect() {
        var inputs = $('#side-right').find('input')
        var data = {}
        var value

        inputs.each(function (i, v) {
            if(v.type === 'checkbox') {
                if($(v).is(':checked')) {
                    value = true
                } else {
                    value = false
                }
            } else {
                value = $(v).val()
            }

            data[$(v).attr('name')] = value
        })

        return data
    }
}

module.exports = { Form };