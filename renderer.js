// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {remote} = require('electron')
const {ipcRenderer} = require('electron');
const {Menu, MenuItem} = remote;
const {Database, DatabaseOperation} = require('./libs/database.js');
const {IO} = require('./libs/io.js');
const menuRoot = new Menu();
const menuCollection = new Menu();
const menuFile = new Menu();
const contextMenuItems = {
    'root': {
        'addFile': new MenuItem({label: 'Dodaj Plik', click() { new File().add() }}),
        'addCollection': new MenuItem({label: 'Dodaj Kolekcje', click() { new Collection().add() }}),
    },
    'collection': {
        'addFile': new MenuItem({label: 'Dodaj Plik', click() { new File().add() }}),
        'addCollection': new MenuItem({label: 'Dodaj Kolekcje', click() { new Collection().add() }}),
        'edit': new MenuItem({label: 'Edytuj', click() { new Collection().edit() }}),
        'paste': new MenuItem({label: 'Wklej', enabled: false, click() { new Collection().paste() }}),
        'remove': {
            'collection': new MenuItem({label: 'Usuń z kolekcji', click() { new Collection().remove('collection') }}),
            'global': new MenuItem({label: 'Usuń z biblioteki', click() { new Collection().remove('global') }}),
        }
    },
    'file': {
        'edit': new MenuItem({label: 'Edytuj', click() { new File().edit() }}),
        'copy': new MenuItem({label: 'Kopiuj', click() { new File().copy() }}),
        'cut': new MenuItem({label: 'Wytnij', click() { new File().cut() }}),
        'remove': {
            'collection': new MenuItem({label: 'Usuń z kolekcji', click() { new File().remove('collection') }}),
            'global': new MenuItem({label: 'Usuń z biblioteki', click() { new File().remove('global') }}),
        }
    }
};
let clickedCollectionId
let clickedFileId
let copiedFile
let cuttedFile

function Tree() {
    var renderCollection = function (collection) {
        var link = document.querySelector('#link-partial-collection');
        var template = link.import.querySelector('#partial-collection');
        var clone = document.importNode(template.content, true);
        var el = document.createElement('div')

        $(el).append(clone)
        $(el).find('.c').first().attr('id', 'collection-' + collection.ID_Collection)
        $(el).find('text').first().text(collection.Name)

        return $(el).find('.c')
    }

    var renderFile = function (file) {
        var link = document.querySelector('#link-partial-file');
        var template = link.import.querySelector('#partial-file');
        var clone = document.importNode(template.content, true);
        var el = document.createElement('div')

        $(el).append(clone)
        $(el).find('.f').first().attr('id', 'file-' + file.ID_File)
        $(el).find('text').first().text(file.Filename)

        return $(el).find('.f')
    }

    var renderList = function () {
        var link = document.querySelector('#link-partial-list');
        var template = link.import.querySelector('#partial-list');
        var clone = document.importNode(template.content, true);

        clone = $(clone)

        return clone
    }

    var renderRoot = function (collection) {
        var clone = renderCollection(collection)
        clone.find('i').first().removeClass('fa-folder')
        clone.find('i').first().addClass('fa-folder-open')
        $('.collection-list-main').append(clone)
    }

    var renderSubTree = function (node, callback) {
        var ul
        var li

        if($('#collection-1').length === 0) {
            renderRoot(node)
        }

        li = $('#collection-' + node.ID_Collection)
        li.children('ul').remove()
        li.append(renderList())

        ul = li.children('ul').first()

        DatabaseOperation.Collection.GetAllCollections(null, node.ID_Collection, 'ID_Collection', 'ASC', function (err, collections) {
            collections.forEach(function (collection) {
                Database.serialize(function () {
                    DatabaseOperation.Collection.GetCollection(collection.ID_Collection, function (err, collection) {
                        ul.append(renderCollection(collection))
                    })
                })
            })
        })

        DatabaseOperation.File_Collection.GetAllFile_Collection(null, node.ID_Collection, 'ID_File', 'ASC', function (err, fileCollections) {
            var quantity = fileCollections.length
            var i = 0
            var id

            if(quantity === 0) {
                callback(ul)
            } else {
                fileCollections.forEach(function (fileCollection) {
                    Database.serialize(function () {
                        DatabaseOperation.File.GetFile(fileCollection.ID_File, function (err, file) {
                            ul.append(renderFile(file))

                            i++

                            if (i === quantity) {
                                callback(ul)
                            }
                        })
                    })
                })
            }
        })
    }

    var getParentCollection = function (parent, callback) {
        DatabaseOperation.Collection.GetCollection(parent, function (err, node) {
            renderSubTree(node, function (ul) {
                ul.slideDown(100)
                callback()
            })
        })
    }

    var build = function (parent, callback) {
        getParentCollection(parent, function () {
            if(callback) {
                callback()
            }
        })
    }

    var addCollection = function (data) {
        var collectionParentId = clickedCollectionId.attr('id').split('-')[1]
        var section = new Import().getTemplate('#link-section-default', '#section-default')
        var collectionIcon = clickedCollectionId.find('i').first()

        DatabaseOperation.Collection.CreateCollection(data.name, collectionParentId, function () {
            $('#side-right').empty().append(section)

            if(collectionIcon.hasClass('fa-folder')) {
                collectionIcon.removeClass('fa-folder');
                collectionIcon.addClass('fa-folder-open');
                clickedCollectionId.find('ul').first().slideDown(100);
            }

            DatabaseOperation.Collection.GetCollection(this.lastID, function (err, row) {
                var collection = renderCollection(row)

                if(clickedCollectionId.find('ul').length === 0) {
                    var list = renderList()

                    clickedCollectionId.append(list)
                }

                console.log(clickedCollectionId.children('ul').first().children('.c').length)

                if(clickedCollectionId.children('ul').first().children('.c').length === 0) {
                    console.log('Jestem tu')
                    clickedCollectionId.children('ul').first().prepend(collection)
                } else {
                    clickedCollectionId.find('ul').first().children('.c').last().after(collection)
                }
            })
        })
    }

    var editCollection = function (data) {
        var section = new Import().getTemplate('#link-section-default', '#section-default')
        $('#collection-' + data.id).children('text').first().text(data.name)
        ipcRenderer.sendSync('editCollection', {'data': data})
        $('#side-right').empty().append(section)
    }

    var removeCollection = function (mode) {
        var collectionID = clickedCollectionId.attr('id').split('-')[1]
        var files = clickedCollectionId.find('.f')

        if(mode === 'global') {
            var fileID

            files.each(function (i, file) {
                fileID = $(file).attr('id')
                $('*[id*=' + fileID + ']').closest('li').remove()
            })
        }

        clickedCollectionId.remove()
        ipcRenderer.sendSync('removeCollection', {'data' : {'collectionID': collectionID, 'mode': mode}})
    }

    var insertFile = function (fileItem, callback) {
        var files = clickedCollectionId.children('ul').first().children('.f')
        var first = parseInt(fileItem.attr('id').split('-')[1])
        var second

        for(var i = 0; i < files.length; i++) {
            second = parseInt($(files[i]).attr('id').split('-')[1])

            if(first <= second) {
                if(first !== second) {
                    $(files[i]).before(fileItem)
                }

                callback()
                break
            }
        }

        if(i === files.length) {
            clickedCollectionId.children('ul').first().append(fileItem)
            callback()
        }
    }

    var showBranch = function (callback) {
        var collectionIcon = clickedCollectionId.find('i').first()

        if (collectionIcon.hasClass('fa-folder')) {
            build(clickedCollectionId.attr('id').split('-')[1], function () {
                collectionIcon.removeClass('fa-folder')
                collectionIcon.addClass('fa-folder-open')
                callback()
            })
        } else {
            callback()
        }
    }

    var addFile = function (data) {
        var collectionParentId = clickedCollectionId.attr('id').split('-')[1]
        var section = new Import().getTemplate('#link-section-default', '#section-default')
        var pdfs = ['' + data.path]
        var tags

        console.log('collectionParenId: ' + collectionParentId)

        IO.addToLibAndDb(pdfs, collectionParentId, null, function(fileID) {
            if(fileID !== false) {
                $('#side-right').empty().append(section)
                showBranch()

                DatabaseOperation.File.GetFile(fileID, function (err, row) {
                    var file = renderFile(row)

                    if (clickedCollectionId.find('ul').length === 0) {
                        var list = renderList()

                        clickedCollectionId.append(list)
                    }

                    insertFile(file)
                })

                if(data.tag !== '') {
                    tags = data.tag.split(' ')

                    tags.forEach(function (tag) {
                        Database.serialize(function () {
                            DatabaseOperation.Tag.GetAllTags(null, tag, null, null, function (err, rows) {
                                Database.serialize(function () {
                                    console.log(tag)
                                    if (rows.length === 1) {
                                        DatabaseOperation.File_Tag.CreateFile_Tag(fileID, rows[0].ID_Tag)
                                    } else if (rows.length === 0) {
                                        console.log(tag)
                                        DatabaseOperation.Tag.CreateTag('Tag', tag, function () {
                                            DatabaseOperation.File_Tag.CreateFile_Tag(fileID, this.lastID)
                                        })
                                    }
                                })
                            })
                        })
                    })
                }
            }
        })
    }

    var editFile = function (data) {
        var section = new Import().getTemplate('#link-section-default', '#section-default')
        $('.f').find('#file-' + data.id).children('text').text(data.name)
        IO.editFile(data.id, data)
        $('#side-right').empty().append(section)
    }

    var removeFile = function (mode, fileID) {
        if(mode === 'collection') {
            clickedFileId.remove()
        } else {
            $('*[id*=file-' + fileID + ']').closest('li').remove()
        }
    }

    return {
        'build': build,
        'showBranch': showBranch,
        'insertFile': insertFile,
        'addCollection': addCollection,
        'editCollection': editCollection,
        'removeCollection': removeCollection,
        'addFile': addFile,
        'editFile': editFile,
        'removeFile': removeFile,
    }
}

function Collection () {
    var add = function () {
        var section = new Import().getTemplate('#link-section-add-collection', '#section-add-collection')

        $('#side-right').empty().append(section)
    }

    var edit = function () {
        var section = new Import().getTemplate('#link-section-edit-collection', '#section-edit-collection')
        var collectionID = clickedCollectionId.attr('id').split('-')[1]
        var data = ipcRenderer.sendSync('getCollection', {'collectionID': collectionID})

        section.find('#id_name').val(data.name)
        section.find('#id_id').val(data.id)
        $('#side-right').empty().append(section)
    }

    var remove = function (mode) {
        new Tree().removeCollection(mode)
    }

    var paste = function () {
        var collectionID = clickedCollectionId.attr('id').split('-')[1]

        new Tree().showBranch(function () {
            if(copiedFile !== null) {
                var fileID = copiedFile.attr('id').split('-')[1]

                new Tree().insertFile(copiedFile.clone(), function () {
                    ipcRenderer.send('copyFile', {'data': {'fileID': fileID, 'collectionID': collectionID}})
                })
            } else if (cuttedFile !== null) {
                var fileID = cuttedFile.attr('id').split('-')[1]
                var previousCollectionID = cuttedFile.parents('li').first().attr('id').split('-')[1]

                new Tree().insertFile(cuttedFile, function () {
                    console.log(fileID)
                    console.log(previousCollectionID)

                    ipcRenderer.send('cutFile', {'data': {'fileID': fileID, 'collectionID': collectionID, 'previousCollectionID': previousCollectionID}})
                })
            }
            $('.f').css('opacity', '1.0')
            contextMenuItems.collection.paste.enabled = false
        })
    }

    var handleCollectionClick = function (event) {
        console.log(event.which)
        if(event.which === 1) {
            console.log($(event.target))
            var collection = $(event.target).closest('li');
            var collectionId = collection.attr('id').split('-')[1]
            console.log(collectionId)
            var collectionIcon = collection.find('i').first();
            var collectionList = collection.find('ul').first();
            console.log(collectionIcon)

            if(collectionIcon.hasClass('fa-folder')) {
                new Tree().build(collectionId)
                collectionIcon.removeClass('fa-folder');
                collectionIcon.addClass('fa-folder-open');

                if(typeof(collectionList) !== 'undefined') {
                    collectionList.slideDown(100);
                }
            } else if(collectionIcon.hasClass('fa-folder-open')) {
                collection.find('ul').first().remove()
                collectionIcon.removeClass('fa-folder-open');
                collectionIcon.addClass('fa-folder');

                if(typeof(collectionList) !== 'undefined') {
                    collectionList.slideUp(100);
                }
            }
        } else if (event.which === 3) {
            console.log($(event.target))
            clickedCollectionId = $(event.target).closest('li')
            if($(event.target).closest('li').attr('id') === 'collection-1') {
                menuRoot.popup(remote.getCurrentWindow())
            } else {
                menuCollection.popup(remote.getCurrentWindow())
            }
        }
    }

    var init = function () {
        $(document).on('mousedown', '.collection', handleCollectionClick)
    }

    return {
        'init': init,
        'add': add,
        'edit': edit,
        'remove': remove,
        'paste': paste,
    }
}

function File () {
    var remove = function (mode) {
        var fileID = clickedFileId.attr('id').split('-')[1]
        var collectionID = clickedFileId.parents('li').attr('id').split('-')[1]

        new Tree().removeFile(mode, fileID)
        IO.removeFile(fileID, collectionID, mode)
    }

    var add = function () {
        var section = new Import().getTemplate('#link-section-add-file', '#section-add-file')

        $('#side-right').empty().append(section)
    }
    
    var edit = function (fileID) {
        var section = new Import().getTemplate('#link-section-edit-file', '#section-edit-file')
        var id = fileID
        var data

        if(typeof id === 'undefined') {
            id = clickedFileId.attr('id').split('-')[1]
        }

        data = ipcRenderer.sendSync('getFile', {'fileID': id})
        section.find('#id_name').val(data['name'])
        section.find('#id_tag').val(data['tag'].join(' '))
        section.find('#id_id').val(id)
        $('#side-right').empty().append(section)
    }

    var copy = function (event) {
        cuttedFile = null
        copiedFile = clickedFileId;
        contextMenuItems.collection.paste.enabled = true;
        copiedFile.css('opacity', '1.0')
    }
    
    var cut = function (event) {
        copiedFile = null
        cuttedFile = clickedFileId;
        contextMenuItems.collection.paste.enabled = true;
        cuttedFile.css('opacity', '0.5')
    }

    var handleFileClick = function (event) {
        console.log(event.which)
        clickedFileId = $(event.target).closest('li')

        if(event.which === 1) {
            var section = new Import().getTemplate('#link-section-info', '#section-info');
            var fileId = clickedFileId.attr('id').split('-')[1]

            section.find('#start-page').data('file-id', fileId)
            console.log(section.find('#start-page').data('file-id'))

            DatabaseOperation.File.GetFile(fileId, function (err, row) {
                var file = row

                console.log(file.ID_File)

                DatabaseOperation.File_Tag.GetAllFile_Tag(file.ID_File, null, 'ID_Tag', 'ASC', function (err, rows) {
                    var tags = rows
                    var i;

                    section.find('#info-name').first().append(file.Filename)
                    $('#side-right').empty().append(section)

                    for(i=0; i<tags.length; i++) {
                        console.log(tags[i])
                        Database.serialize(function () {
                            DatabaseOperation.Tag.GetTag(tags[i].ID_Tag, function (err, row) {
                                var tag = row

                                console.log(tag)

                                $('#side-right').find('#info-tag').first().append(tag.Value + ' ')
                            })
                        })
                    }
                })
            })
        } else if (event.which === 3) {
            menuFile.popup(remote.getCurrentWindow())
        }
    }

    var init = function () {
        $(document).on('mousedown', '.file', handleFileClick)
    }


    return {
        'init': init,
        'add': add,
        'edit': edit,
        'remove': remove,
        'copy': copy,
        'cut': cut,
    }
}

function ButtonBar() {
    var handleBackClick = function (event) {
        var section = new Import().getTemplate('#link-section-default', '#section-default');

        $('#side-right').empty().append(section);
    }

    var init = function () {
        $(document).on('click', '#back', handleBackClick);
    }
    init();
}

class ContextMenu {
    constructor() {
    }
}

function Start () {
    var handleScanClick = function (event) {
        console.log(1)
        ipcRenderer.send('proceed')

        // ipcRenderer.on('scanBegins', function () {
        //     console.log(1)
        //     $('#scan').children('span').text(' (0%)')
        // })

        // ipcRenderer.on('scanCompleted', function () {
        //     console.log(2)
        //     var parent = $('#root').attr('id')
        //     console.log(parent)
        //     new Tree().build(parent)
        //     // $('#scan').removeClass('scan-proceed')
        // })
    }

    var init = function (event) {
        var section = new Import().getTemplate('#link-section-default', '#section-default');
        $('#side-right').empty().append(section);
        cuttedFile = null
        copiedFile = null

        menuCollection.append(contextMenuItems.collection.addFile)
        menuCollection.append(contextMenuItems.collection.addCollection)
        menuCollection.append(contextMenuItems.collection.edit)
        menuCollection.append(contextMenuItems.collection.paste)
        menuCollection.append(contextMenuItems.collection.remove.collection)
        menuCollection.append(contextMenuItems.collection.remove.global)
        menuFile.append(contextMenuItems.file.edit)
        menuFile.append(contextMenuItems.file.copy)
        menuFile.append(contextMenuItems.file.cut)
        menuFile.append(contextMenuItems.file.remove.collection)
        menuFile.append(contextMenuItems.file.remove.global)
        menuRoot.append(contextMenuItems.root.addFile)
        menuRoot.append(contextMenuItems.root.addCollection)

        new Tree().build(1)

        $(document).on('click', '#scan', handleScanClick)
    }
    init()
}

new Collection().init()
new File().init()
new ButtonBar();
new Start()

exports.Tree = Tree
exports.File = File

