/**
 * Created by corsseir on 10/21/16.
 */

const {File} = require('../renderer.js')
const {Collection} = require('../renderer.js')

class Confirm {
    constructor() {
        var self = this

        $(document).on('click', '#yes', self.handleYesClick)
    }

    handleYesClick(event) {
        var data = new Form().collect()

        if(data.id !== '') {
            new File().remove(data)
        } else {
            new Collection().remove(data)
        }
    }
}

new Confirm()