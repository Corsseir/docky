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
            console.log("znalazlem " + fileIds.length + " plikow")
            //Szukanie tagu o podanej nazwie
            DatabaseOperation.Tag.GetAllTags(null, value, null, null, function getTags(err, tagRows) {
                tagIds = tagRows.map(SearchHelper.mapTags)
                console.log("znalazlem " + tagIds.length + " tagow")
                DatabaseOperation.File_Tag.GetAllFile_Tag(null, null, null, null, function (err, ftRows) {
                    console.log("znalazlem " + ftRows.length + " ftrows")
                    for (let i = 0; i < ftRows.length; i++) {
                        let matchingFiles = fileIds.filter(SearchHelper.isFileId, ftRows[i].ID_File)
                        let matchingTags = tagIds.filter(SearchHelper.isTagId, ftRows[i].ID_Tag)
                        if (matchingFiles.length >= 1 || matchingTags.length >= 1) {
                            results.push(ftRows[i].ID_File)
                        }
                    }
                    results = results.filter(function (element, index){return results.indexOf(element) === index})
                    callback && callback(results)
                })
            })
        })
    }

    constructor() {
        var self = this

        ipcMain.on('search', function (event, arg) {
            self.findAllFileId(arg.phrase, function (fileIDs) {
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
