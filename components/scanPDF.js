/**
 * Created by corsseir on 11/6/16.
 */

const IO = require('../libs/io.js').IO

class Scan {
    static proceed() {
        var pdfs = IO.scan()
        IO.addToLibAndDbFromScan(pdfs, function () {
            console.log("Dodalem")
        })

        return {'status': 'Success'}
    }
}

exports.Scan = Scan