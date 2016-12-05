/**
 * Created by mike on 30/11/16.
 */
let childProcess = require('child_process')
let fs = require('fs')

class PDFOpener {

    static open(fpath) {
        let self = this

        fs.access(fpath, fs.constants.R_OK, function(err) {
            if (!err) {
                self.resolveCommand(function(cmd){
                    if (!cmd) {return}
                    cmd = cmd + ' "' + fpath + '"'
                    console.log(cmd)
                    childProcess.exec(cmd)
                })
            }
        })
    }

    static resolveCommand(callback){
        let cmd
        switch(process.platform){
            case 'win32':
                cmd = 'start "" '
                break
            case 'darwin':
                cmd = 'open'
                break
            case 'linux':
                cmd = 'xdg-open'
                break
            default:
                console.log('Ta platforma nie jest obslugiwana')
                cmd = null
        }
        callback && callback (cmd)
    }

}

exports.PDFOpener = PDFOpener