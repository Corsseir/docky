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

    advancedSearch(cryteria, callback){
        if (cryteria.checksum != ''){
            SearchQueries.findFileByChecksum(cryteria.checksum, callback)
        } else if (cryteria.skip_file && (cryteria.date_from != '' || cryteria.date_to != '')){
            // jest ogr daty
            SearchQueries.findFileByDate('', cryteria.date_from, cryteria.date_to, (err, idDates) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    SearchQueries.findByTag(cryteria.key, cryteria.value, (err, idFileT)=> {
                        let matchingFiles = idFileT.concat(idDates)
                        let ids = matchingFiles.filter(function (element, index){return matchingFiles.indexOf(element) === index})
                        callback && callback(null, ids)
                    })
                }
            })
        } else if (cryteria.skip_file && !(cryteria.date_from != '' || cryteria.date_to != '')) {
            SearchQueries.findByTag(cryteria.key, cryteria.value, (err, idFileT)=> {
                if (err){
                    callback && callback(err, null)
                } else {
                    callback && callback(null, idFileT)
                }
            })
        }else if (!cryteria.skip_file && (cryteria.date_from != '' || cryteria.date_to != '')) {
            // jest ogr daty
            SearchQueries.findFileByDate(cryteria.phrase, cryteria.date_from, cryteria.date_to, (err, idDates) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    SearchQueries.findByTag(cryteria.key, cryteria.value, (err, idFileT)=> {
                        let matchingFiles = idFileT.concat(idDates)
                        let ids = matchingFiles.filter(function (element, index){return matchingFiles.indexOf(element) === index})
                        callback && callback(null, ids)
                    })
                }
            })
        }else if (!cryteria.skip_file && !(cryteria.date_from != '' || cryteria.date_to != '')) {
            SearchQueries.findFile(cryteria.phrase, (err, rows) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    SearchQueries.findByTag(cryteria.key, cryteria.value, (err, idFileT)=> {
                        let matchingFiles = idFileT.concat(rows)
                        let ids = matchingFiles.filter(function (element, index){return matchingFiles.indexOf(element) === index})
                        callback && callback(null, ids)
                    })
                }
            })
        } else {
            callback && callback(null, [])
        }
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

class SearchQueries {

    static findFile (filename, callback) {
        DatabaseOperation.File.GetAllFiles(filename, null, null, (err, rows)=> {
            if (err){
                callback && callback(err, null)
            } else {
                callback && callback (null, rows)
            }
        })
    }
    //zwraca [ID_File]
    static findFileByChecksum (checksum, callback){
        DatabaseOperation.AdvancedSearch.getFile(checksum, (err, row) => {
            if (err){
                callback && callback(err, null)
            } else {
                if (row) {
                    callback && callback(null, [row.ID_File])
                } else {
                    callback && callback (null, [])
                }
            }
        })
    }
    //zwraca [ID_File]
    static findFileByDate (filename, from, to, callback) {
        if (filename != '' && from != '' && to != ''){
            //from nie null, to nie null
            DatabaseOperation.AdvancedSearch.getFileFromTo(filename, from, to, (err, rows) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    let fileIds = rows.map(SearchHelper.mapIds)
                    callback && callback (null, fileIds)
                }
            })
        } else if (filename != '' && from != '' && to === ''){
            //from nie null, tu null
            DatabaseOperation.AdvancedSearch.getFileFrom(filename, from, null, (err, rows) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    let fileIds = rows.map(SearchHelper.mapIds)
                    callback && callback (null, fileIds)
                }
            })
        } else if (filename != '' && from === '' && to != '') {
            //from null to nie null
            DatabaseOperation.AdvancedSearch.getFileTo(filename, null, to, (err, rows) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    let fileIds = rows.map(SearchHelper.mapIds)
                    callback && callback (null, fileIds)
                }
            })
        } else  if (filename === '' && from != '' && to != ''){
            //from nie null, to nie null
            DatabaseOperation.AdvancedSearch.getFileFromTo(null, from, to, (err, rows) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    let fileIds = rows.map(SearchHelper.mapIds)
                    callback && callback (null, fileIds)
                }
            })
        } else if (filename === '' && from != '' && to === '') {
            //from nie null, tu null
            DatabaseOperation.AdvancedSearch.getFileFrom(null, from, null, (err, rows) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    let fileIds = rows.map(SearchHelper.mapIds)
                    callback && callback (null, fileIds)
                }
            })

        } else if (filename === '' && from === '' && to != '') {
            //from null to nie null
            DatabaseOperation.AdvancedSearch.getFileTo(null, null, to, (err, rows) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    let fileIds = rows.map(SearchHelper.mapIds)
                    callback && callback (null, fileIds)
                }
            })
        } else {
            callback && callback (null, [])
        }
    }

    static findByTag(key, value, callback){
        if (key != '' && value != ''){
            this.findAllTNV(key, value, (fileIds)=> {
                callback && callback(null, fileIds)
            })

        } else if (key === '' && value != ''){
            this.findAllTNV(null, value, (fileIds)=> {
                callback && callback(null, fileIds)
            })
        } else if (key != '' && value === ''){
            this.findAllTNV(key, null, (fileIds)=> {
                callback && callback(null, fileIds)
            })
        } else {
            callback && callback (null, [])
        }
    }

    static findAllTNV(tagname, tagvalue, callback){
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

}
