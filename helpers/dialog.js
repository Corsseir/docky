/**
 * Created by corsseir on 03.12.16.
 */

const {dialog} = require('electron')

class Dialog {
    file() {
        return dialog.showOpenDialog({properties: ['openFile']})
    }

    collection() {
        return dialog.showOpenDialog({properties: ['openDirectory']})
    }
}

exports.Dialog = Dialog
