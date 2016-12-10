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

    findAllFileTN(filename, tagname, callback){
        let results = []
        let fileIds = []
        let tagIds = []
        DatabaseOperation.File.GetAllFiles(filename, null, null, function getFiles(err, fileRows) {
            fileIds = fileRows.map(SearchHelper.mapIds)
            //console.log("znalazlem " + fileIds.length + " plikow")
            //Szukanie tagu o podanej nazwie
            DatabaseOperation.Tag.GetAllTags(tagname, null, null, null, function getTags(err, tagRows) {
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

    findAllFileTNV(filename, tagname, tagvalue, callback){
        let results = []
        let fileIds = []
        let tagIds = []
        DatabaseOperation.File.GetAllFiles(filename, null, null, function getFiles(err, fileRows) {
            fileIds = fileRows.map(SearchHelper.mapIds)
            //console.log("znalazlem " + fileIds.length + " plikow")
            //Szukanie tagu o podanej nazwie
            DatabaseOperation.Tag.GetAllTags(tagname, tagvalue, null, null, function getTags(err, tagRows) {
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

    findAllTN(tagname, callback){
        let results = []
        let tagIds = []
        //Szukanie tagu o podanej nazwie
        DatabaseOperation.Tag.GetAllTags(tagname, null, null, null, function getTags(err, tagRows) {
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
                let matchingFiles = results
                let ids = matchingFiles.filter(function (element, index){return matchingFiles.indexOf(element) === index})
                callback && callback(ids)
            })
        })
    }
    findAllTV(tagvalue, callback){
        let results = []
        let tagIds = []
        //Szukanie tagu o podanej nazwie
        DatabaseOperation.Tag.GetAllTags(null, tagvalue, null, null, function getTags(err, tagRows) {
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
                let matchingFiles = results
                let ids = matchingFiles.filter(function (element, index){return matchingFiles.indexOf(element) === index})
                callback && callback(ids)
            })
        })
    }

    findAllTNV(tagname, tagvalue, callback){
        let results = []
        let tagIds = []
        //Szukanie tagu o podanej nazwie
        DatabaseOperation.Tag.GetAllTags(tagname, tagvalue, null, null, function getTags(err, tagRows) {
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
                let matchingFiles = results
                let ids = matchingFiles.filter(function (element, index){return matchingFiles.indexOf(element) === index})
                callback && callback(ids)
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
