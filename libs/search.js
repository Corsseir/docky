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
        DatabaseOperation.File.GetAllFiles(null, null, null, function getFiles(err, fileRows) {
            let submatch =  fileRows.filter(SearchHelper.filterSubFilename, value)
            fileIds = submatch.map(SearchHelper.mapIds)
            //console.log("znalazlem " + fileIds.length + " plikow")
            //Szukanie tagu o podanej nazwie
            DatabaseOperation.Tag.GetAllTags(null, null, null, null, function getTags(err, tagRows) {
                let submatchT =  tagRows.filter(SearchHelper.filterSubValue, value)
                tagIds = submatchT.map(SearchHelper.mapTags)
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
            SearchQueries.findFileByDate(cryteria.date_from, cryteria.date_to, (err, idDates) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    if(cryteria.key !='' || cryteria.value !=''){
                        SearchQueries.findByTag(cryteria.key, cryteria.value, (err, idFileT)=> {
                            let filteredDates = idFileT.filter(SearchHelper.filterUsingArray, idDates)
                            let ids = filteredDates.filter(function (element, index){return filteredDates.indexOf(element) === index})
                            callback && callback(null, ids)
                        })
                    } else {
                        callback && callback(null, idDates)
                    }
                }
            })
        } else if (cryteria.skip_file && !(cryteria.date_from != '' || cryteria.date_to != '')) {
            if (cryteria.key === '' && cryteria.value === ''){
                callback && callback(null, [])
            } else {
                if(cryteria.key !='' || cryteria.value !=''){
                    SearchQueries.findByTag(cryteria.key, cryteria.value, (err, idFileT)=> {
                        if (err){
                            callback && callback(err, null)
                        } else {
                            callback && callback(null, idFileT)
                        }
                    })
                } else {
                    callback && callback(null, [])
                }
            }
        }else if (!cryteria.skip_file && (cryteria.date_from != '' || cryteria.date_to != '')) {
            // jest ogr daty
            SearchQueries.findFile(cryteria.phrase, (err, rows) => {
                SearchQueries.findFileByDate(cryteria.date_from, cryteria.date_to, (err, idDates) => {
                    let filteredDates = idDates.filter(SearchHelper.filterUsingArray, rows)
                    if (err){
                        callback && callback(err, null)
                    } else {
                        if(cryteria.key !='' || cryteria.value !=''){
                            SearchQueries.findByTag(cryteria.key, cryteria.value, (err, idFileT)=> {
                                let filteredFinal = idFileT.filter(SearchHelper.filterUsingArray, filteredDates)
                                let ids = filteredFinal.filter(function (element, index){return filteredFinal.indexOf(element) === index})
                                callback && callback(null, ids)
                            })
                        } else {
                            callback && callback(null, filteredDates)
                        }
                    }
                })
            })
        }else if (!cryteria.skip_file && !(cryteria.date_from != '' || cryteria.date_to != '')) {
            SearchQueries.findFile(cryteria.phrase, (err, rows) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    if(cryteria.key !='' || cryteria.value !=''){
                        SearchQueries.findByTag(cryteria.key, cryteria.value, (err, idFileT)=> {
                            let filteredDates = idFileT.filter(SearchHelper.filterUsingArray, rows)
                            let ids = filteredDates.filter(function (element, index){return filteredDates.indexOf(element) === index})
                            callback && callback(null, ids)
                        })
                    } else {
                        callback && callback(null, rows)
                    }
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

        ipcMain.on('searchAdvance', function (event, arg) {
            self.advancedSearch(arg, function (result, fileIDs) {
                if(result === null) {
                    event.returnValue = fileIDs
                }
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

    static filterSubKey(element){
        return element.Name.toLowerCase().includes(this.toLowerCase())
    }

    static filterSubFilename(element){
        return element.Filename.toLowerCase().includes(this.toLowerCase())
    }

    static filterSubValue(element){
        return element.Value.toLowerCase().includes(this.toLowerCase())
    }

    static filterUsingArray(element){
        return this.indexOf(element) > -1
    }

    static filterTagID(element){
        return this.indexOf(element.ID_Tag) > -1
    }

}

class SearchQueries {

    static findFile (filename, callback) {
        DatabaseOperation.File.GetAllFiles(null, null, null, (err, rows)=> {
            if (err){
                callback && callback(err, null)
            } else {
                let submatch =  rows.filter(SearchHelper.filterSubFilename, filename)
                submatch = submatch.map(SearchHelper.mapIds)
                callback && callback (null, submatch)
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
    static findFileByDate (from, to, callback) {
        if (from != '' && to != ''){
            //from nie null, to nie null
            DatabaseOperation.AdvancedSearch.getFileFromTo(from, to, (err, rows) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    let fileIds = rows.map(SearchHelper.mapIds)
                    callback && callback (null, fileIds)
                }
            })
        } else if (from != '' && to === ''){
            //from nie null, tu null
            DatabaseOperation.AdvancedSearch.getFileFrom(from, (err, rows) => {
                if (err){
                    callback && callback(err, null)
                } else {
                    let fileIds = rows.map(SearchHelper.mapIds)
                    callback && callback (null, fileIds)
                }
            })
        } else if (from === '' && to != '') {
            //from null to nie null
            DatabaseOperation.AdvancedSearch.getFileTo(to, (err, rows) => {
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
            callback && callback(null, [])
        }
    }

    static findAllTNV(tagname, tagvalue, callback){
        let results = []
        let tagIds = []
        //Szukanie tagu o podanej nazwie
        DatabaseOperation.Tag.GetAllTags(null, null, null, null, function getTags(err, tagRows) {
            if(tagname != null){
                tagRows = tagRows.filter(SearchHelper.filterSubKey, tagname)
            }
            if (tagvalue != null) {
                tagRows = tagRows.filter(SearchHelper.filterSubValue, tagvalue)
            }
            tagIds = tagRows.map(SearchHelper.mapTags)
            //console.log("znalazlem " + tagIds.length + " tagow")
            DatabaseOperation.File_Tag.GetAllFile_Tag(null, null, null, null, function (err, ftRows) {
                // console.log("znalazlem " + ftRows.length + " ftrows")
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
