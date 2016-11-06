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

//funkcja przeznaczona do pierwszego uruchomienia
function createLocalLib () {
    createDir(libraryMain)
    createDir(libraryPath)
    createDir(overwritePath)
    var pdfs = scan()
    addToLibAndDb(pdfs, function () {console.log("Dodalem")})
}

//funkcja przeznaczona do przeszukiwania of wybranego z file dialog roota
function scan () {
    var rootPath = dialog.showOpenDialog({properties:['openDirectory']})
    var pdfs = scanDirs(rootPath)
    return pdfs
}

//Dodaje dowolną liczbę plików do lib i db, input to tablica
function addToLibAndDb(pdfs, callback) {
    pdfs.forEach(function(element) {
        console.log(element)
        var fName = path.basename(element).toString()
        var pathInLib = libraryPath + "/" + fName
        var filePath = element
        addF(pathInLib, element, function (result) {
            addToDb(result)
        })
    })
}


//Dodaje plik do bazy, pomocnicza dla addToLibAndDb
function addToDb (element) {
    console.log("Jestem w add to DB")
    var fileLocalPath = element.local
    var fileSysPath = element.filesys
    var fileName = path.basename(element.filesys).toString()
    addEntryToDb(fileName, fileLocalPath, fileSysPath)
}

//Utwórz katalog w wybranej ścieżce (synchroniczna)
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

//Funkcje pomocnicze - nie używać :)


//funkcja pomocnicza dla addAlltoDb
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

//funkcja pomocnicza dla scan
function scanDirs (rootPath) {
    var dirs = []
    var pdfs = []
    dirs.push(rootPath.toString())
    listPDFs(dirs[0], dirs, pdfs)
    return pdfs
}

//funkcja pomocnicza dla scan -> scanDirs
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

//Dodaj plik do biblioteki, pomocnicza
function addF (pathInLib, filePath, callback) {
    var result = new Object()
    if (fs.existsSync(pathInLib)) {
        console.log(pathInLib + " już jest")
        var baseN = path.basename(filePath, ".pdf").toString()
        var ovPath = overwritePath + "/" + baseN
        fs.mkdir(ovPath, function handleCreated(err){
            if (err) {
                if (err.code === "EEXIST") {
                    fs.readdir(ovPath, function getFolders(err, files) {
                        console.log("Katalog w override juz jest")
                        var x = 0
                        var max = 0
                        for (var i = 0; i < files.length; i++) {
                            var oldNumber = (parseInt(files[i].split("__").pop()))
                            if (max < oldNumber) {
                                max = oldNumber
                            }
                        }
                        var newNumber = (max + 1).toString()
                        var newName = "__" + newNumber
                        var newPath = ovPath +"/" + baseN + newName
                        fs.createReadStream(filePath).pipe(fs.createWriteStream(newPath))
                        result.filesys = filePath
                        result.local = newPath
                        result.type = "overwrite"
                        callback && callback(result)
                    })
                }
            } else {
                var newPath = ovPath + "/" + baseN + "__1" + ".pdf"
                fs.createReadStream(filePath).pipe(fs.createWriteStream(newPath))
                result.filesys = filePath
                result.local = newPath
                result.type = "overwrite"
                callback && callback(result)
            }
        })
    } else {
        console.log(pathInLib + " nie ma")
        fs.createReadStream(filePath).pipe(fs.createWriteStream(pathInLib))
        result.filesys = filePath
        result.local = pathInLib
        result.type = "unique"
        callback && callback(result)
    }
    /*
    fs.access(pathInLib, fs.constants.R_OK, function waitForCheck (err) {
        var result = new Object()
        if (err === null) {
            console.log(pathInLib + " już jest")
            var baseN = path.basename(filePath, ".pdf").toString()
            var ovPath = overwritePath + "/" + baseN
            fs.mkdir(ovPath, function handleCreated(err){
                if (err === null) {
                    var newPath = ovPath + "/" + baseN + "__1" + ".pdf"
                    fs.createReadStream(filePath).pipe(fs.createWriteStream(newPath))
                    result.filesys = filePath
                    result.local = newPath
                    result.type = "overwrite"
                    callback && callback(result)
                } else if (error.code === "EEXIST") {
                    fs.readdir(ovPath, function getFolders (err, files) {
                        console.log("Katalog w override juz jest")
                        var x = 0
                        var max = 0
                        for (var i = 0; i < files.length; i++) {
                            var oldNumber = (parseInt(files[i].split("__").pop()))
                            if (max < oldNumber) {
                                max = oldNumber
                            }
                        }
                        var newNumber = (max + 1).toString()
                        var newName = "__" + newNumber
                        var newPath = ovPath +  + "/" + baseN + "__" + newNumber
                        fs.createReadStream(filePath).pipe(fs.createWriteStream(newPath))
                        result.filesys = filePath
                        result.local = newPath
                        result.type = "overwrite"
                        callback && callback(result)
                    })
                }
            })
        } else if (err.code === "ENOENT") {
            console.log(pathInLib + " nie ma")
            fs.createReadStream(filePath).pipe(fs.createWriteStream(pathInLib))
            result.filesys = filePath
            result.local = pathInLib
            result.type = "unique"
            callback && callback(result)
        } else {
            throw err
        }
    })
    */
}

//testowa
function check_test(){
    var file1 = fs.createReadStream(dialog.showOpenDialog({properties:['openFile']}).toString())
    var file2 = fs.createReadStream(dialog.showOpenDialog({properties:['openFile']}).toString())
    streamEqual(file1, file2, function (err, equal) {
        if (!equal) {
            console.log("rozne")
        } else {
            console.log("takie same")
        }
    })
}

//check_test()
var scanClick = document.getElementById("scan")
var test = scanClick.addEventListener('click', createLocalLib)