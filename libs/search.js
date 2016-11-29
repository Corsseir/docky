/**
 * Created by mike on 11/19/16.
 */
const Database = require('./database.js').Database
const DatabaseOperation = require('./database.js').DatabaseOperation

class Search {
    static findValue (type, value, callback) {
        let values
        if (type === 'file'){
            this.findFile(value, function (results) {
                values = results
                callback && callback(values)
            })
        } else if (type === 'tag') {
            this.findTag(value, function (results) {
                values = results
                callback && callback(values)
            })
        } else {
            this.findAllFileId(value, function (results) {
                values = results
                callback && callback(values)
            })
        }
    }

    static isFileInArr(element){
        return (element.Filename === this)
    }
    static isTagInArr(element){
        return (element.Name === this || element.Value === this)
    }

    //W cb otrzymujemy wiersze tabeli File o Filename = szukanej
    static findFile(value, callback) {
        DatabaseOperation.File.GetAllFiles(value, null, null, function lookupF(err, rows) {
            //let results = rows.filter(this.isFileInArr(element), value)
            callback && callback (rows)
        })
    }
    //W cb otrzymujemy wiersze tabeli Tag o Name lub Value = szukanej
    static findTag(value, callback) {
        DatabaseOperation.Tag.GetAllTags(null, null, null, null, function lookupF(err, rows) {
            let results = rows.filter(this.isTagInArr(element), value)
            callback && callback (results)
        })
    }
    //W cb otrzymujemy tablice FileID tabeli File
    static parseFileRows (fileRows, callback) {
        fileRows.forEach(function (element){})
        let ids = fileRows.map(function (element) {
            let id = element.ID_File
            return id
        })
        callback && callback(ids)
    }
    //W cb otrzymujemy tablice TagID tabeli Tag
    static parseTagRows(tagRows, callback) {
        let ids = tagRows.map(function (element) {
            let id = element.ID_Tag
            return id
        })
        callback && callback(ids)
    }
    //W cb otrzymujemy tablice FileID tabeli FileTag dla wszystkich TagID
    static parseFileTag(tagIds, callback){
        let ids = []
        let i
        for (i = 0; i< tagIds.length; i++){
            DatabaseOperation.File_Tag.GetAllFile_Tag(null, tagIds[i], null, null, function (err, rows){
                rows = rows.map(function (element){
                    let fileId = element.ID_File
                    return fileId
                })
                ids = ids.concat(rows)
                ids = ids.filter(function (element, index){return ids.indexOf(element) === index})
            })
        }
        if (i === tagRows.length) {callback && callback(ids)}
    }
    //W cb otrzymujemy tablice wszystkich FileID, ktore sa powiazane z szukana wartoscia
    static findAllFileId(value, callback) {
        let fileIds
        this.findFile(value, function filterFiles (fileRows) {
            this.parseFileRows(fileRows, function getFid(fIds){
                fileIds = fileIds.concat(fIds).filter(function (element, index){return fileIds.indexOf(element) === index})
                this.findTag(value, function filterTags(tagRows){
                    this.parseTagRows(tagRows, function getTid(tIds){
                        this.parseFileTag(tIds, function filterTagFile(ftIds){
                            fileIds = fileIds.concat(ftIds).filter(function (element, index){return fileIds.indexOf(element) === index})
                            callback && callback(fileIds)
                        })
                    })
                })
            })
        })
    }
}
exports.Search = Search