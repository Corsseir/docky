/**
 * Created by mike on 11/3/16.
 */
//Rozpoczyna skanowanie folderów w celu znalezienia plików pdf po wcisnięciu elementu gui o id = "scan"
    //Nie chcę robić sufu w indexie, więc trzeba dorzucić przycisk gdzieś, żeby zadziałało.
const {dialog} = require('electron').remote
const fs = require ('fs')
path = require("path")
function scanDirs () {
    var rootPath = dialog.showOpenDialog({properties:['openDirectory']})
    var dirs = []
    var pdfs = []
    dirs.push(rootPath.toString())
    listPDFs(dirs[0], dirs, pdfs)
    pdfs.forEach(function(element) {console.log("Ścieżka do pdfa: " + element)})
    return pdfs
}

function listPDFs (dirpath, dirsArray, filesArray) {
    console.log("Przeszukuję katalog " + dirpath)
    var items = fs.readdirSync(dirpath)
    for (var i = 0; i < items.length; i++) {
        var filepath = path.join(dirpath, items[i].toString()).toString()
        if (fs.lstatSync(filepath).isDirectory()) {
            dirsArray.push(filepath)
        }
        if (fs.lstatSync(filepath).isFile()) {
            if (path.extname(filepath) === ".pdf") {
                filesArray.push(filepath)
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

var scanClick = document.getElementById("scan")
scanClick.addEventListener('click', scanDirs)
