/**
 * Created by mike on 11/19/16.
 */
const Database = require('./database.js').Database
const DatabaseOperation = require('./database.js').DatabaseOperation
const {ipcMain} = require('electron')

class Search {

    findAllFileId(value, callback){
        let results = []
        let fileIds = []
        let tagIds = []
        //Szukanie pliku o podanej nazwie
        DatabaseOperation.File.GetAllFiles(value, null, null, function getFiles(err, fileRows) {
            fileIds = fileRows.map(SearchHelper.mapIds)
            //console.log("znalazlem " + fileIds.length + " plikow")
            //Szukanie tagu o podanej nazwie
            DatabaseOperation.Tag.GetAllTags(null, value, null, null, function getTags(err, tagRows) {
                tagIds = tagRows.map(SearchHelper.mapTags)
                //console.log("znalazlem " + tagIds.length + " tagow")
                DatabaseOperation.File_Tag.GetAllFile_Tag(null, null, null, null, function (err, ftRows) {
                    //console.log("znalazlem " + ftRows.length + " ftrows")
                    ftRows.forEach(function (row){
                        let matchingTags = tagIds.filter(SearchHelper.isTagId, row.ID_Tag)
                        if ( matchingTags.length >= 1) {
                            results.push(row.ID_File)
                        }
                    })
                    let matchingFiles = results.concat(fileIds)
                    let ids = matchingFiles.filter(function (element, index){return matchingFiles.indexOf(element) === index})
                    callback && callback(ids)
                })
            })
        })
    }

    constructor() {
        var self = this

        ipcMain.on('search', function (event, arg) {
            self.findAllFileId(arg.phrase, function (fileIDs) {
                for (let i = 0; i < fileIDs. length; i++){
                    console.log(fileIDs[i])
                }
                event.returnValue = fileIDs
            })
        })
    }
}

new Search()

exports.Search = Search

class SearchHelper {

    static isFileId(element){
        return element === this
    }

    static isTagId(element){
        return element === this
    }


    static mapIds(element){
        return element.ID_File
    }

    static mapTags(element){
        return element.ID_Tag
    }

}
