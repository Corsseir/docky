/**
 * Created by mike on 11/3/16.
 */
//Rozpoczyna skanowanie folderów w celu znalezienia plików pdf po wcisnięciu elementu gui o id = "scan"
//Następnie tworzy katalog na pliki pdf
//node
const fs = require ('fs')
let http = require('http');
let https = require('https');
let path = require('path')
let crypto = require('crypto')
let streamEqual = require('stream-equal')
const Database = require('./database.js').Database
const DatabaseOperation = require('./database.js').DatabaseOperation
const CollectionHelper = require('../helpers/collection.js').CollectionHelper
const dialog = require('electron').dialog
//sciezki
const libraryMain = "./DockyLibrary"
const libraryPath = "./DockyLibrary/Zeskanowane"
const overwritePath = "./DockyLibrary/Zeskanowane/Overwrite"
const Search = require('./search.js').Search

class IO {
    //funkcja przeznaczona do pierwszego uruchomienia

    static createLocalLib() {
        let self = this
        this.createDir(libraryMain)
        this.createDir(libraryPath)
        this.createDir(overwritePath)
        this.addFileFromURL('http://www.pdf995.com/samples/pdf.pdf')
    }

    //funkcja przeznaczona do przeszukiwania of wybranego z file dialog roota

    static scan() {
        var rootPath = dialog.showOpenDialog({properties: ['openDirectory']})
        var pdfs = this.scanDirs(rootPath)
        console.log("Znalazłem: " + pdfs.length + " pdfów")
        for (var i = 0; i < pdfs.length; i++) {
            if (pdfs[i].includes(libraryPath)) {
                pdfs.splice(i, 1)
            } else {
                console.log("PDF: " + pdfs[i])
            }
        }
        return pdfs
    }

    //Dodaje dowolną liczbę plików do lib i db, input to tablica

    static addToLibAndDb(pdfs, collectionId, filename, callback) {
        var self = this;
        var i;

        for (i = 0; i < pdfs.length; i++) {
            var element = pdfs[i]
            console.log("addToLibAndDb Element: " + element + "Collection id: " + collectionId)
            var fName = path.basename(element).toString()
            var pathInLib = libraryPath + "/" + fName
            self.addFile(pathInLib, element, function (result) {
                console.log("Obiekt result: " + result.local + " , " + result.type)
                self.addToDb(result, collectionId, filename, function () {
                    if(i === pdfs.length && typeof filename !== 'undefined') {
                        callback()
                    }
                })
            })
        }

        if (i === pdfs.length - 1) {
            console.log("Zakonczono dodawanie")
        }
    }

    static addToLibAndDbFromScan(pdfs, callback) {
        var self = this;

        DatabaseOperation.Collection.GetAllCollections(null, null, null, null, function (err, rows) {
                var rootCollection = CollectionHelper.getRootCollection(rows)

                DatabaseOperation.Collection.CreateCollection("Zeskanowane", rootCollection.ID_Collection, function () {
                    var collectionId = this.lastID

                    self.addToLibAndDb(pdfs, collectionId)
                })
        })
    }

    //Dodaje plik do bazy, pomocnicza dla addToLibAndDb

    static addToDb(element, collectionId, fileName, callback) {
        console.log("Jestem w add to DB")
        var fileLocalPath = element.local
        var fileSysPath = element.filesys
        var checksum = element.checksum
        //console.log("Dodaje do db plik : " + fileName)
        if(typeof fileName === 'undefined') {
            fileName = path.basename(element.filesys).toString().split('.')[0]
        }
        console.log("addToDb: collection id: " + collectionId + " file name: " + fileName)

        this.addEntryToDb(fileName, fileLocalPath, fileSysPath, checksum, collectionId, function () {
            console.log('Dzialam2')
            callback()
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

    //Funkcje pomocnicze - nie używać :)
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
                    console.log("Jestem w create location typ:global " + "L_ID: " + locationId2 + " F_ID: " + fileId)
                    DatabaseOperation.File_Location.CreateFile_Location(fileId, locationId2, function () {
                        console.log("Skonczylem dodawać do F_L globalną scieżkę")
                    })
                })
                console.log('Dzialam1')
                DatabaseOperation.File_Collection.CreateFile_Collection(fileId, collectionId)
                callback()
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
    // Uporządkowane addF, ponizej sama funkcja i funkcje jej dotycące
    static createResult(resultObj, sysPath, libPath, type, callback) {
        resultObj.filesys = sysPath
        resultObj.local = libPath
        resultObj.type = type
        callback && callback (resultObj)
    }

    static createOvFilePath(ovFolderPath, baseN, files, callback) {
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

    static addToOverwrite(err, self, result, filePath, ovPath, baseN, callback){
        if (err) {
            if (err.code === "EEXIST") {
                fs.readdir(ovPath, function getFolders(err, files) {
                    console.log("Katalog o nazwie" + ovPath + "jest już utworzony w overwrite")
                    self.createOvFilePath(ovPath, baseN, files, function (newPath){
                        fs.createReadStream(filePath).pipe(fs.createWriteStream(newPath))
                        self.createResult(result, filePath, newPath, "overwrite", function sendResult(resultObj) {
                            callback && callback(resultObj)
                        })
                    })
                })
            }
        } else {
            console.log("Katalog o nazwie" + ovPath + "zostanie utworzony w overwrite")
            var newPath = ovPath + "/" + baseN + "__1" + ".pdf"
            fs.createReadStream(filePath).pipe(fs.createWriteStream(newPath))
            self.createResult(result, filePath, newPath, "overwrite", function sendResult(resultObj) {
                callback && callback(resultObj)
            })
        }
    }

    static addFile(pathInLib, filePath, callback){
        var result = new Object()
        var self = this
        self.createChecksum(filePath, function compareFiles(checksum) {
            console.log("Stworzyłem checksum: " + checksum)
            result.checksum = checksum
            var fileChecksum = checksum
            if (fs.existsSync(pathInLib)) {
                console.log(pathInLib + " już jest w bibliotece")
                var baseN = path.basename(filePath, ".pdf").toString()
                var ovPath = overwritePath + "/" + baseN
                DatabaseOperation.File.GetAllFiles(baseN, null, null, function comp (err, rows) {
                    if (!rows.filter(function(element) { return element.Checksum === fileChecksum})) {
                        console.log("Chekcsum są różne")
                        fs.mkdir(ovPath, function handleMk(err) {
                            self.addToOverwrite(err, self, result, filePath, ovPath, baseN, callback)
                        })
                    } else {
                        console.log('Nie trzeba dodawać ' + filePath)
                    }
                })

            } else {
                console.log("Pliku o sciezce: " + pathInLib + " nie ma w bibliotece. Kopiowanie rozp.")
                fs.createReadStream(filePath).pipe(fs.createWriteStream(pathInLib))
                console.log("Liczba Piotra: " + 1)
                self.createResult(result, filePath, pathInLib, "unique", function sendResult(resultObj) {
                    callback && callback(resultObj)
                })
            }
        })

    }

    static addFileFromURL(url) {
        let self = this
        this.downloadFile(url, function (fname) {
            let file = []
            file.push(fname)
            self.addToLibAndDbFromScan(file)
        })
    }

    static downloadFile(url, callback) {
        let parts = url.split('/')
        let parts2 = parts[parts.length - 1].split('.')
        let fname = parts2[0] + '.pdf'

        let pdf = fs.createWriteStream(fname)

        if (url.substring(0,5) ==='https') {
            https.get(url, function(response) {
                response.pipe(pdf)
            })
        } else if (url.substring(0,4) ==='http') {
            http.get(url, function(response) {
                response.pipe(pdf)
            })
        } else {
            console.log('niepoprawny url')
        }

        callback&&callback(fname)
    }
}

exports.IO = IO