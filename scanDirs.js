/**
 * Created by mike on 11/3/16.
 */
//Rozpoczyna skanowanie folderów w celu znalezienia plików pdf po wcisnięciu elementu gui o id = "scan"
//Następnie tworzy katalog na pliki pdf
// electron
const {dialog} = require('electron').remote
//node
const fs = require ('fs')
let path = require("path")
let streamEqual = require('stream-equal')
//pliki wlasne
const Database = require('./Database.js').Database
const DatabaseOperation = require('./Database.js').DatabaseOperation
//sciezki
const libraryMain = "./DockyLibrary"
const libraryPath = "./DockyLibrary/Zeskanowane"
const overwritePath = "./DockyLibrary/Zeskanowane/Overwrite"

function createLocalLib () {
    createDir(libraryMain)
    createDir(libraryPath)
    createDir(overwritePath)
    var pdfs = scan()
    var libPdfs = []
    fillLib(pdfs, function (r) {
        addAllToDb (r)
    })
}

function addEntryToDb (fileName, fileLocalPath, fileSysPath) {
    DatabaseOperation.File.CreateFile(null, fileName, function addFileId (){
        var fileId = this.lastID
        console.log("Jestem w create file " + fileId)
        DatabaseOperation.Location.CreateLocation("local", fileLocalPath, function addLocationId(){
            var locationId = this.lastID
            console.log("Jestem w create location " + locationId + " test file: " + fileId)
            DatabaseOperation.File_Location.CreateFile_Location(fileId, locationId, function () {console.log("Skonczylem dodawać lokalną")})
        })
        DatabaseOperation.Location.CreateLocation("global", fileSysPath, function addLocationId(){
            var locationId2 = this.lastID
            console.log("Jestem w create location " + locationId2 + " test file: " + fileId)
            DatabaseOperation.File_Location.CreateFile_Location(fileId, locationId2, function () {console.log("Skonczylem dodawać globalną")})
        })
    })
}

function addAllToDb (libPDFs) {
    console.log("Jestem w add to DB")
    libPDFs.forEach(function (element) {
        var fileLocalPath = element.local
        var fileSysPath = element.filesys
        var fileName = path.basename(element.filesys).toString()
        var origin = element.original
        addEntryToDb(fileName, fileLocalPath, fileSysPath, origin)
    })
}

function scan () {
    var rootPath = dialog.showOpenDialog({properties:['openDirectory']})
    var pdfs = scanDirs(rootPath)
    return pdfs
}

function scanDirs (rootPath) {
    var dirs = []
    var pdfs = []
    dirs.push(rootPath.toString())
    listPDFs(dirs[0], dirs, pdfs)
    //pdfs.forEach(function(element) {console.log("Ścieżka do pdfa: " + element)})
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

function fillLib (pdfArray, callback) {
    var libPathArray = []
    var x = 0
    pdfArray.forEach(function (element) {
        var fName = path.basename(element).toString()
        var pathInLib = libraryPath + "/" + fName
        var filePath = element
        addFile(pathInLib, filePath, function (r){
            x = appendToArray(libPathArray, r)
            console.log(x)
            if (pdfArray.length === x) {
                console.log("skoczyelm fill lib")
                console.log("xwynosił: " + x)
                var result = libPathArray
                callback && callback(result)
            }
        })
    })
}

function appendToArray(array, entry) {
    console.log("appendToArray")
    array.push(entry)
    //array.forEach(function(element) {console.log("Ścieżka do pdfa test: " + element)})
    console.log("Dopisałem: " + entry.local)
    return array.length
}

function addFile (pathInLib, filePath, callback) {
   try {
        fs.accessSync(pathInLib, fs.F_OK)
        console.log("plik: " + pathInLib + " już istnieje")
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
                addFile(newName, filePath, callback)
            }
        })
    } catch (e) {
        if (e.code === 'ENOENT') {
            console.log("Zapisuje plik: " + path.basename(filePath) + " do " + pathInLib)
            fs.createReadStream(filePath).pipe(fs.createWriteStream(pathInLib))
            console.log("Zwracam lokalizację lokalną: " + pathInLib)
            //localLocations.push(pathInLib)
            var r = new Object()
            r.filesys = filePath
            r.local = pathInLib
            r.original = path.basename(filePath).toString()
            console.log("addFile")
            callback && callback(r)
        } else {
            throw e
        }
    }
}

var scanClick = document.getElementById("scan")
var test = scanClick.addEventListener('click', createLocalLib)