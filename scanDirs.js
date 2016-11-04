/**
 * Created by mike on 11/3/16.
 */
//Rozpoczyna skanowanie folderów w celu znalezienia plików pdf po wcisnięciu elementu gui o id = "scan"
//Następnie tworzy katalog na pliki pdf
const {dialog} = require('electron').remote
const fs = require ('fs')
const libraryPath = "./DockyLibrary"
const overwritePath = "./DockyLibrary/Overwrite"
const util = require('util')
let streamEqual = require('stream-equal')
let path = require("path")
var nana = smiec


function scanDirs () {
    var rootPath = dialog.showOpenDialog({properties:['openDirectory']})
    var dirs = []
    var pdfs = []
    dirs.push(rootPath.toString())
    listPDFs(dirs[0], dirs, pdfs)
    pdfs.forEach(function(element) {console.log("Ścieżka do pdfa: " + element)})
    createDir(libraryPath)
    createDir(overwritePath)
    createLib(pdfs)
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

function createDir (path) {
    try {
        var stats = fs.lstatSync(path)
        console.log("Katalog już istnieje")
    }
    catch (e) {
        if (e.code === 'ENOENT'){
            fs.mkdirSync(path)
            console.log("Stworzono katalog")
        }
        else {
            throw e
        }
    }
}

function createLib (pdfArray) {
    for (var i = 0; i < pdfArray.length; i++) {
        var fName = path.basename(pdfArray[i]).toString()
        var pathInLib = libraryPath + "/" + fName
        var filePath = pdfArray[i]
        addFile(pathInLib, filePath)
    }
}

function addFile (pathInLib, filePath) {
    try {
        fs.accessSync(pathInLib, fs.F_OK)
        console.log("plik: " + pathInLib + " istnieje")
        var file1 = fs.createReadStream(pathInLib.toString())
        var file2 = fs.createReadStream(filePath.toString())
        streamEqual(file1, file2, function (err, equal) {
            //zapisz plik do folderu overwrite
            if (!equal) {
                var oldName = path.basename(pathInLib, '.pdf').toString()
                //Kazdy powtarzający sie plik bedzie znajdowac sie w katalaogu, ktory nazywa sie jak ten plik
                var originDirName = overwritePath + "/" + path.basename(filePath, ".pdf").toString()
                createDir(originDirName)
                var newName = originDirName + "/" + oldName + "_new" + ".pdf"
                addFile(newName, filePath)
                console.log("Wpisalem " + newName + " do overwrite")
            }
        })
    } catch (e) {
        if (e.code === 'ENOENT') {
            console.log("Zapisuje nie istniejący wczesniej plik: " + path.basename(filePath))
            fs.createReadStream(filePath).pipe(fs.createWriteStream(pathInLib))
        } else {
            throw e
        }
    }
}

var scanClick = document.getElementById("scan")
scanClick.addEventListener('click', scanDirs)
