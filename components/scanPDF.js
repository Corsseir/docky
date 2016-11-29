/**
 * Created by corsseir on 11/6/16.
 */

const dialog = require('electron').dialog
const ipc = require('electron').ipcMain
const IO = require('../libs/io.js').IO

class Scan {
    static proceed(event) {
        var rootPath = dialog.showOpenDialog({properties: ['openDirectory']})
        if (!rootPath){
            return
        }
        event.sender.send('scanBegins')
        var pdfs = IO.scan(rootPath)

        IO.addToLibAndDbFromScan(pdfs, function () {
            console.log("Dodalem")
            event.sender.send('scanCompleted')
        })
    }
}

ipc.on('proceed', function (event, arg) {
    Scan.proceed(event)
})