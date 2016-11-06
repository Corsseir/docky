/**
 * Created by mike on 11/3/16.
 */
//Rozpoczyna skanowanie folderów w celu znalezienia plików pdf po wcisnięciu elementu gui o id = "scan"
//Następnie tworzy katalog na pliki pdf
//node
const fs = require ('fs')
let path = require('path')
let crypto = require('crypto')
let streamEqual = require('stream-equal')
const Database = require('./database.js').Database
const DatabaseOperation = require('./database.js').DatabaseOperation
const dialog = require('electron').dialog
//sciezki
const libraryMain = "./DockyLibrary"
const libraryPath = "./DockyLibrary/Zeskanowane"
const overwritePath = "./DockyLibrary/Zeskanowane/Overwrite"

class IO {
    //funkcja przeznaczona do pierwszego uruchomienia

    static createLocalLib() {
        this.createDir(libraryMain)
        this.createDir(libraryPath)
        this.createDir(overwritePath)
    }

    //funkcja przeznaczona do przeszukiwania of wybranego z file dialog roota

    static scan() {
        var rootPath = dialog.showOpenDialog({properties: ['openDirectory']})
        var pdfs = this.scanDirs(rootPath)

        return pdfs
    }

    //Dodaje dowolną liczbę plików do lib i db, input to tablica

    static addToLibAndDb(pdfs, callback) {
        var self = this;
        for (var i = 0; i < pdfs.length; i++) {
            var element = pdfs[i]
            console.log(element)
            var fName = path.basename(element).toString()
            var pathInLib = libraryPath + "/" + fName
            this.addF(pathInLib, element, function (result) {
                self.addToDb(result)
            })
        }
    }


    //Dodaje plik do bazy, pomocnicza dla addToLibAndDb

    static addToDb(element) {
        console.log("Jestem w add to DB")
        var fileLocalPath = element.local
        var fileSysPath = element.filesys
        var fileName = path.basename(element.filesys).toString()
        this.addEntryToDb(fileName, fileLocalPath, fileSysPath)
    }

    //Utwórz katalog w wybranej ścieżce (synchroniczna)

    static createDir(path) {
        try {
            var stats = fs.lstatSync(path)
            console.log("Katalog już istnieje")
        }
        catch (e) {
            if (e.code === 'ENOENT') {
                fs.mkdirSync(path)
                console.log("Stworzono katalog")
            }
            else {
                throw e
            }
        }
    }

// Utwórz sumę kontrolną MD5 dla podanego pliku.

    static createChecksum (fpath, callback) {
        console.log ('Tworze checksum')
        var checksum = crypto.createHash('md5')
        var rs = fs.createReadStream(fpath)
        fs.readFile(fpath, function hashFile(err, data) {
            checksum.update(data, 'utf8')
            callback && callback(checksum.digest('hex'))
        })
    }

    //Funkcje pomocnicze - nie używać :)
    //funkcja pomocnicza dla addAlltoDb

    static addEntryToDb(fileName, fileLocalPath, fileSysPath) {
        this.createChecksum (fileLocalPath, function getChecksum (checksum) {
            console.log("Hash: " + checksum + " dla: " + fileLocalPath)
            DatabaseOperation.File.CreateFile(null, fileName, checksum, function addFileId() {
                var fileId = this.lastID
                console.log("Jestem w create file " + fileId)
                DatabaseOperation.Location.CreateLocation("local", fileLocalPath, function addLocationId() {
                    var locationId = this.lastID
                    console.log("Jestem w create location " + locationId + " test file: " + fileId)
                    DatabaseOperation.File_Location.CreateFile_Location(fileId, locationId, function () {
                        console.log("Skonczylem dodawać lokalną")
                    })
                })
                DatabaseOperation.Location.CreateLocation("global", fileSysPath, function addLocationId() {
                    var locationId2 = this.lastID
                    console.log("Jestem w create location " + locationId2 + " test file: " + fileId)
                    DatabaseOperation.File_Location.CreateFile_Location(fileId, locationId2, function () {
                        console.log("Skonczylem dodawać globalną")
                    })
                })
            })
        })
    }

    //funkcja pomocnicza dla scan

    static scanDirs(rootPath) {
        var dirs = []
        var pdfs = []
        dirs.push(rootPath.toString())
        this.listPDFs(dirs[0], dirs, pdfs)

        return pdfs
    }

    //funkcja pomocnicza dla scan -> scanDirs

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
            this.listPDFs(dirsArray[i], dirsArray, filesArray)
        }
    }

    //Dodaj plik do biblioteki, pomocnicza

    static addF(pathInLib, filePath, callback) {
        var result = new Object()
        if (fs.existsSync(pathInLib)) {
            console.log(pathInLib + " już jest")
            var baseN = path.basename(filePath, ".pdf").toString()
            var ovPath = overwritePath + "/" + baseN
            fs.mkdir(ovPath, function handleCreated(err) {
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
                            var newPath = ovPath + "/" + baseN + newName + ".pdf"
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
            console.log(1)
            result.filesys = filePath
            result.local = pathInLib
            result.type = "unique"
            callback && callback(result)
        }
    }
}


exports.IO = IO