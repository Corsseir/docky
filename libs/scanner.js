/**
 * Created by mike on 01/12/16.
 */
let fs = require('fs')
let path = require('path')

//funkcja pomocnicza dla scan -> scanDirs
class ScannerHelper {

    static listPDFs(dirpath, dirsArray, filesArray) {
        console.log("Przeszukuję katalog " + dirpath)
        var items = fs.readdirSync(dirpath)
        for (var i = 0; i < items.length; i++) {
            var filepath = path.join(dirpath, items[i].toString()).toString()
            if (fs.lstatSync(filepath).isDirectory()) {
                dirsArray.push(filepath)
            }
            if (fs.lstatSync(filepath).isFile()) {
                if (path.extname(filepath) === ".pdf") {
                    filesArray.push(filepath.toString())
                }
            }
        }
        //Usuń przeszukany katalog z listy katalagów, które należy przeszukać.
        for (var i = 0; i < dirsArray.length; i++) {
            if (dirsArray[i] === dirpath) {
                dirsArray.splice(i, 1)
            }
        }
        //Przejdź rekurencyjnie po wszystkich podfolderach.
        for (var i = 0; i < dirsArray.length; i++) {
            listPDFs(dirsArray[i], dirsArray, filesArray)
        }
    }
}

class Scan {

    static scanDirs(rootPath) {
        let dirs = [], pdfs = []
        dirs.push(rootPath.toString())
        ScannerHelper.listPDFs(dirs[0], dirs, pdfs)
        console.log("zakoncozno skan")
        return pdfs
    }

    static scanSingleDir(rootPath){
        let pdfs = []
        let items = fs.readdirSync(rootPath)
        for (let i = 0; i < items.length; i++) {
            let filepath = path.join(rootPath, items[i].toString()).toString()
            if (fs.lstatSync(filepath).isFile()) {
                if (path.extname(filepath) === ".pdf") {
                    pdfs.push(filepath.toString())
                }
            }
        }
    }

}

exports.Scan = Scan