/**
 * Created by mike on 11/19/16.
 */
const Database = require('./database.js').Database
const DatabaseOperation = require('./database.js').DatabaseOperation

class Search {

    //W cb otrzymujemy tablice wszystkich FileID, ktore sa powiazane z szukana wartoscia
    static findAllFileId(value, callback) {
        let fileIds = []
        findFile(value, function filterFiles (fileRows) {
            parseFileRows(fileRows, function getFid(fIds){
                fileIds = fIds
                fileIds = fileIds.filter(function (element, index){return fileIds.indexOf(element) === index})
                findTag(value, function filterTags(tagRows){
                    parseTagRows(tagRows, function getTid(tIds){
                        parseFileTag(tIds, function filterTagFile(ftIds){
                            fileIds = fileIds.concat(ftIds)
                            fileIds = fileIds.filter(function (element, index){return fileIds.indexOf(element) === index})
                            callback && callback(fileIds)
                        })
                    })
                })
            })
        })
    }
}

exports.Search = Search

function isTagInArr(element){
    return (element.Name === this || element.Value === this)
}

//W cb otrzymujemy wiersze tabeli File o Filename = szukanej
function findFile(value, callback) {
    DatabaseOperation.File.GetAllFiles(value, null, null, function lookupF(err, rows) {
        callback && callback (rows)
    })
}
//W cb otrzymujemy wiersze tabeli Tag o Name lub Value = szukanej
function findTag(value, callback) {
    DatabaseOperation.Tag.GetAllTags(null, null, null, null, function lookupF(err, rows) {
        let results = rows.filter(isTagInArr, value)
        callback && callback (results)
    })
}
//W cb otrzymujemy tablice FileID tabeli File
function parseFileRows (fileRows, callback) {
    let ids = fileRows.map(function (element) {
        let id = element.ID_File
        return id
    })
    callback && callback(ids)
}
//W cb otrzymujemy tablice TagID tabeli Tag
function parseTagRows(tagRows, callback) {
    let ids = tagRows.map(function (element) {
        return element.ID_Tag
    })
    callback && callback(ids)
}
//W cb otrzymujemy tablice FileID tabeli FileTag dla wszystkich TagID
function parseFileTag(tagIds, callback){
    let i
    for (i = 0; i< tagIds.length; i++){
        DatabaseOperation.File_Tag.GetAllFile_Tag(null, tagIds[i], null, null, function (err, rows){
            rows = rows.map(function (element){
                return element.ID_File
            })
            callback && callback(rows)
        })
    }
}
