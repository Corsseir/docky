/**
 * Created by mike on 11/3/16.
 */
//Rozpoczyna skanowanie folderów w celu znalezienia plików pdf po wcisnięciu elementu gui o id = "scan"
//Następnie tworzy katalog na pliki pdf
//node
const fs = require ('fs')
const scanner = require('./scanner.js').Scan
const Database = require('./database.js').Database
const DatabaseOperation = require('./database.js').DatabaseOperation
const url = require('./urlHandler.js').URLHandler
const libraryMain = "./DockyLibrary"
const libraryPath = "./DockyLibrary/Zeskanowane"
const overwritePath = "./DockyLibrary/Zeskanowane/Overwrite"

let path = require('path')
let crypto = require('crypto')
let archiver = require('archiver')
let pdfOpener = require('./pdfOpener.js').PDFopener
let watcher = require('./fileWatcher.js').FileWatcher


class IO {
    //funkcja przeznaczona do pierwszego uruchomienia

    static createLocalLib() {
        this.createDir(libraryMain)
        this.createDir(libraryPath)
        this.createDir(overwritePath)
        watcher.startWatch()
    }

    //funkcja przeznaczona do przeszukiwania of wybranego z file dialog roota

    static scan(rootPath, callback) {
        let pdfs = scanner.scanDirs(rootPath)
        console.log("Znalazłem: " + pdfs.length + " pdfów")

        if(pdfs.length === 0) {
            callback && callback(pdfs)
        } else {
            for (var i = 0; i < pdfs.length; i++) {
                if (pdfs[i].includes(libraryPath)) {
                    pdfs.splice(i, 1)
                } else {
                    console.log("PDF: " + pdfs[i])
                }

                if(i === pdfs.length - 1) {
                    callback && callback(pdfs)
                }
            }
        }
    }

    //Sprawdza czy wprowadzono url
    static checkForUrl(pdfs, callback) {
        console.log(pdfs)
        if (pdfs.length === 1) {
            if (pdfs[0].substring(0,5) ==='https' || pdfs[0].substring(0,4) ==='http') {
                url.downloadFile(pdfs[0], function (file){
                    console.log(file[0])
                    pdfs[0] = file[0]
                    callback && callback(pdfs)
                })
            } else {
                callback && callback(pdfs)
            }
        } else {
            callback && callback(pdfs)
        }
    }

    //Dodaje dowolną liczbę plików do lib i db, input to tablica
    static addToLibAndDb(pdfsO, collectionId, callback) {
        let self = this
        self.checkForUrl(pdfsO, function (pdfs) {
            for (let i = 0; i < pdfs.length; i++) {
                var element = pdfs[i]
                console.log("addToLibAndDb Element: " + element + "Collection id: " + collectionId)
                var fName = path.basename(element).toString()
                var pathInLib = libraryPath + "/" + fName
                self.addFile(pathInLib, element, function (result) {
                    if(typeof result.status === 'undefined') {
                        console.log("Obiekt result: " + result.local + " , " + result.type)
                        self.addToDb(result, collectionId, function (fileID) {
                            if(i === pdfs.length - 1) {
                                callback({
                                    'status': 'success',
                                    'fileID': fileID
                                })
                            }
                        })
                    } else {
                        callback(result)
                    }
                })
            }
        })

    }

    static addToLibAndDbFromScan(pdfs, callback) {
        var self = this;

        DatabaseOperation.Collection.GetAllCollections('Zeskanowane', 1, null, null, function (err, rows) {
            if(rows.length === 0) {
                DatabaseOperation.Collection.CreateCollection("Zeskanowane", 1, function () {
                    var collectionId = this.lastID

                    self.addToLibAndDb(pdfs, collectionId, function () {
                        callback && callback(collectionId)
                    })
                })
            } else if(rows.length === 1) {
                self.addToLibAndDb(pdfs, rows[0].ID_Collection, function () {
                    console.log('skończyłem')
                    callback && callback(rows[0].ID_Collection)
                })
            }
        })
    }

    //Dodaje plik do bazy, pomocnicza dla addToLibAndDb

    static addToDb(element, collectionId, callback) {
        console.log("Jestem w add to DB")
        var fileLocalPath = element.local
        var fileSysPath = element.filesys
        var checksum = element.checksum
        var fileName = path.basename(element.filesys).toString()
        var index = fileName.lastIndexOf('.')

        fileName = fileName.slice(0, index)
        console.log("addToDb: collection id: " + collectionId + " file name: " + fileName)

        this.addEntryToDb(fileName, fileLocalPath, fileSysPath, checksum, collectionId, function (fileID) {
            console.log('Dzialam2')
            callback(fileID)
        })
    }

    //Utwórz katalog w wybranej ścieżce (synchroniczna)

    static createDir(path) {
        try {
            var stats = fs.lstatSync(path)
            console.log("Katalog " + path + " już istnieje")
        }
        catch (e) {
            if (e.code === 'ENOENT') {
                fs.mkdirSync(path)
                console.log("Stworzono katalog: " + path)
            }
            else {
                throw e
            }
        }
    }
// Utwórz sumę kontrolną MD5 dla podanego pliku.

    static createChecksum (fpath, callback) {
        console.log ('Tworze checksum')
        fpath = fpath.toString()
        var checksum = crypto.createHash('md5')
        var rs = fs.createReadStream(fpath)
        fs.readFile(fpath, function hashFile(err, data) {
            checksum.update(data, 'utf8')
            callback && callback(checksum.digest('hex'))
        })
    }

    //funkcja pomocnicza dla addAlltoDb

    static addEntryToDb(fileName, fileLocalPath, fileSysPath, checksum, collectionId, callback) {
            DatabaseOperation.File.CreateFile(null, fileName, checksum, function addFileId() {
                var fileId = this.lastID
                console.log("Jestem w create file " + "F_ID: " + fileId + " Sciezka: " + fileLocalPath)
                DatabaseOperation.Location.CreateLocation("local", fileLocalPath, function addLocationId() {
                    var locationId = this.lastID
                    console.log("Jestem w create location typ:local " + "L_ID:" + locationId + " FileID: " + fileId)
                    DatabaseOperation.File_Location.CreateFile_Location(fileId, locationId, function () {
                        console.log("Skonczylem dodawać do F_L lokalną sciezkę")
                    })
                })
                DatabaseOperation.Location.CreateLocation("global", fileSysPath, function addLocationId() {
                    var locationId2 = this.lastID
                    watcher.startSingleWatch(locationId2)
                    console.log("Jestem w create location typ:global " + "L_ID: " + locationId2 + " F_ID: " + fileId)
                    DatabaseOperation.File_Location.CreateFile_Location(fileId, locationId2, function () {
                        console.log("Skonczylem dodawać do F_L globalną scieżkę")
                    })
                })
                console.log('Dzialam1')
                DatabaseOperation.File_Collection.CreateFile_Collection(fileId, collectionId)
                callback(fileId)
            })

    }


    static addFile(pathInLib, filePath, callback){
        var result = {}
        let self = this
        self.createChecksum(filePath, function compareFiles(checksum) {
            console.log("Stworzyłem checksum: " + checksum)
            result.checksum = checksum
            var fileChecksum = checksum
            if (fs.existsSync(pathInLib)) {
                console.log(pathInLib + " już jest w bibliotece")
                var baseN = path.basename(filePath, ".pdf").toString()
                var ovPath = overwritePath + "/" + baseN
                DatabaseOperation.File.GetAllFiles(baseN, null, null, function comp (err, rows) {
                    if (rows.filter(function(element) { return element.Checksum === fileChecksum}).length < 1) {
                        console.log("Chekcsum są różne")
                        fs.mkdir(ovPath, function handleMk(err) {
                            self.addToOverwrite(err, result, filePath, ovPath, baseN, callback)
                        })
                    } else {
                        callback && callback({'status': 'exist', 'name': baseN})
                    }
                })

            } else {
                console.log("Pliku o sciezce: " + pathInLib + " nie ma w bibliotece. Kopiowanie rozp.")
                self.copyFile(filePath, pathInLib)
                console.log("Liczba Piotra: " + 1)
                createResult(result, filePath, pathInLib, "unique", function sendResult(resultObj) {
                    callback && callback(resultObj)
                })
            }
        })

    }

    static copyFile(source, destination, callback) {
        fs.createReadStream(source).pipe(fs.createWriteStream(destination))
        callback && callback()
    }

    static editFile(previousLocation, newLocation, callback) {
        fs.rename(previousLocation, newLocation)
        callback && callback()
    }

    static removeFile(path, callback) {
        fs.exists(path, function (exists) {
            if (exists) {
                fs.unlink(path, function (err) {
                    if (err) {
                        alert("An error ocurred updating the file" + err.message)
                        console.log(err);
                        return
                    }
                    console.log("File succesfully deleted")
                    callback()
                })
            } else {
                alert("This file doesn't exist, cannot delete")
            }
        });
    }

    static exportToZip(pArray) {
        let zip = fs.createWriteStream('export.zip')
        let zipper = archiver('zip')
        zipper.pipe(zip)
        for (let i = 0; i < pArray.length; i++){
            zipper.append(fs.createReadStream(pArray[i]), { name: path.basename(pArray[i]).toString() })
        }
        zipper.finalize()
    }

    static addToOverwrite(err, result, filePath, ovPath, baseN, callback){
        if (err) {
            if (err.code === "EEXIST") {
                fs.readdir(ovPath, function getFolders(err, files) {
                    console.log("Katalog o nazwie" + ovPath + "jest już utworzony w overwrite")
                    createOvFilePath(ovPath, baseN, files, function (newPath){
                        fs.createReadStream(filePath).pipe(fs.createWriteStream(newPath))
                        createResult(result, filePath, newPath, "overwrite", function sendResult(resultObj) {
                            callback && callback(resultObj)
                        })
                    })
                })
            }
        } else {
            console.log("Katalog o nazwie" + ovPath + "zostanie utworzony w overwrite")
            var newPath = ovPath + "/" + baseN + "__1" + ".pdf"
            fs.createReadStream(filePath).pipe(fs.createWriteStream(newPath))
            createResult(result, filePath, newPath, "overwrite", function sendResult(resultObj) {
                callback && callback(resultObj)
            })
        }
    }
}

exports.IO = IO


//Dodaj plik do biblioteki, pomocnicza
// Uporządkowane addF, ponizej sama funkcja i funkcje jej dotycące
function createResult(resultObj, sysPath, libPath, type, callback) {
    resultObj.filesys = sysPath
    resultObj.local = libPath
    resultObj.type = type
    callback && callback (resultObj)
}

function createOvFilePath(ovFolderPath, baseN, files, callback) {
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
    var newPath = ovFolderPath + "/" + baseN + newName + ".pdf"
    callback && callback(newPath)
}