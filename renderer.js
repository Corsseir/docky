// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {remote} = require('electron')
const {ipcRenderer} = require('electron');
const {Menu, MenuItem} = remote;
const {Database, DatabaseOperation} = require('./libs/database.js');
const {IO} = require('./libs/io.js');
const menuRoot = new Menu();
const menuFolder = new Menu();
const menuFile = new Menu();
const contextMenuItems = {
    'root': {
        'addFile': new MenuItem({label: 'Dodaj Plik', click() { new File().add() }}),
        'addCollection': new MenuItem({label: 'Dodaj Kolekcje', click() { new Folder().add() }}),
    },
    'collection': {
        'addFile': new MenuItem({label: 'Dodaj Plik', click() { new File().add() }}),
        'addCollection': new MenuItem({label: 'Dodaj Kolekcje', click() { new Folder().add() }}),
        'edit': new MenuItem({label: 'Edytuj', click() { new Folder().edit() }}),
        'paste': new MenuItem({label: 'Wklej', enabled: false, click() { new Folder().paste() }}),
        'remove': {
            'collection': new MenuItem({label: 'Usuń z kolekcji', click() { new Folder().remove('collection') }}),
            'global': new MenuItem({label: 'Usuń z biblioteki', click() { new Folder().remove('global') }}),
        }
    },
    'file': {
        'edit': new MenuItem({label: 'Edytuj', click() { new File().edit() }}),
        'copy': new MenuItem({label: 'Kopiuj', click() { new File().copy() }}),
        'remove': {
            'collection': new MenuItem({label: 'Usuń z kolekcji', click() { new File().remove('collection') }}),
            'global': new MenuItem({label: 'Usuń z biblioteki', click() { new File().remove('global') }}),
        }
    }
};
let clickedCollectionId;
let clickedFileId;
let copiedFile;

function Tree() {
    var renderCollection = function (collection) {
        var link = document.querySelector('#link-partial-folder');
        var template = link.import.querySelector('#partial-folder');
        var clone = document.importNode(template.content, true);

        clone = $(clone)
        clone.find('span').first().attr('id', 'folder-' + collection.ID_Collection)
        clone.find('span').first().data('parent-folder', collection.ID_ParentCollection)
        clone.find('text').first().text(collection.Name)

        return clone
    }

    var renderFile = function (file) {
        var link = document.querySelector('#link-partial-file');
        var template = link.import.querySelector('#partial-file');
        var clone = document.importNode(template.content, true);

        clone = $(clone)
        clone.find('span').first().attr('id', 'file-' + file.ID_File)
        clone.find('text').first().text(file.Filename)

        return clone
    }

    var renderList = function () {
        var link = document.querySelector('#link-partial-list');
        var template = link.import.querySelector('#partial-list');
        var clone = document.importNode(template.content, true);

        clone = $(clone)

        return clone
    }

    var renderSubTree = function (root) {
        var li = $('#folder-' + root.ID_Collection).closest('li')

        li.find('ul').first().remove()
        li.append(renderList())

        var ul = li.find('ul').first()

        Database.serialize(function () {
            DatabaseOperation.Collection.GetAllCollections(null, root.ID_Collection, 'ID_Collection', 'ASC', function (err, collections) {
                for (var i = 0; i < collections.length; i++) {
                    console.log(collections[i])
                    Database.serialize(function () {
                        DatabaseOperation.Collection.GetCollection(collections[i].ID_Collection, function (err, row) {
                            console.log(row)
                            ul.append(renderCollection(row))
                        })
                    })
                }
            })
        })

        Database.serialize(function () {
            DatabaseOperation.File_Collection.GetAllFile_Collection(null, root.ID_Collection, 'ID_File', 'ASC', function (err, file_collections) {
                console.log(file_collections.length)
                for (var i = 0; i < file_collections.length; i++) {
                    console.log(file_collections[i])
                    Database.serialize(function () {
                        DatabaseOperation.File.GetFile(file_collections[i].ID_File, function (err, row) {
                            ul.append(renderFile(row))
                        })
                    })
                }
            })
        })
    }

    var renderRoot = function (collection) {
        var clone = renderCollection(collection)

        clone.find('li').first().attr('id', 'root')
        clone.find('i').first().removeClass('fa-folder')
        clone.find('i').first().addClass('fa-folder-open')
        $('.folder-list-main').append(clone)
    }

    var getParentCollection = function (callback, parent) {
        console.log(parent)
        if(typeof parent === 'undefined') {
            DatabaseOperation.Collection.GetCollection(1, function (err, row) {
                var root = row;

                renderRoot(root, null)
                callback(root)
            })
        } else {
            DatabaseOperation.Collection.GetCollection(parseInt(parent.split('-')[1]), function (err, row) {
                var root = row;

                callback(root)
            })
        }
    }

    var build = function (parent) {
        getParentCollection(renderSubTree, parent)
    }

    var addCollection = function (data) {
        var collectionParentId = clickedCollectionId.find('span').first().attr('id').split('-')[1]
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
        $('#folder-' + data.id).children('text').first().text(data.name)
        ipcRenderer.sendSync('editCollection', {'data': data})
    }

    var removeCollection = function (mode) {
        var collectionID = clickedCollectionId.children('span').attr('id').split('-')[1]
        var files = clickedCollectionId.find('.f')

        if(mode === 'global') {
            var fileID

            files.each(function (i, file) {
                fileID = $(file).children('span').attr('id')
                $('*[id*=' + fileID + ']').closest('li').remove()
            })
        }

        clickedCollectionId.remove()
        ipcRenderer.sendSync('removeCollection', {'data' : {'collectionID': collectionID, 'mode': mode}})
    }

    var appendFile = function (file) {
        if (clickedCollectionId.children('ul').first().children('.f').length === 0) {
            clickedCollectionId.children('ul').first().append(file)
        } else {
            clickedCollectionId.children('ul').first().children('.f').last().after(file)
        }
    }

    var addFile = function (data) {
        var collectionParentId = clickedCollectionId.find('span').first().attr('id').split('-')[1]
        var section = new Import().getTemplate('#link-section-default', '#section-default')
        var pdfs = ['' + data.path]
        var tags
        var collectionIcon = clickedCollectionId.find('i').first()

        console.log('collectionParenId: ' + collectionParentId)

        IO.addToLibAndDb(pdfs, collectionParentId, null, function(fileID) {
            if(fileID !== false) {
                $('#side-right').empty().append(section)

                if (collectionIcon.hasClass('fa-folder')) {
                    collectionIcon.removeClass('fa-folder');
                    collectionIcon.addClass('fa-folder-open');
                    clickedCollectionId.find('ul').first().slideDown(100);

                }

                DatabaseOperation.File.GetFile(fileID, function (err, row) {
                    var file = renderFile(row)

                    if (clickedCollectionId.find('ul').length === 0) {
                        var list = renderList()

                        clickedCollectionId.append(list)
                    }

                    appendFile(file)
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
        $('.f').find('#file-' + data.id).text(data.name)
        IO.editFile(data.id, data)
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
        'appendFile': appendFile,
        'addCollection': addCollection,
        'editCollection': editCollection,
        'removeCollection': removeCollection,
        'addFile': addFile,
        'editFile': editFile,
        'removeFile': removeFile,
    }
}

function Folder () {
    var add = function () {
        var section = new Import().getTemplate('#link-section-add-folder', '#section-add-folder')

        $('#side-right').empty().append(section)
    }

    var edit = function () {
        var section = new Import().getTemplate('#link-section-edit-collection', '#section-edit-collection')
        var collectionID = clickedCollectionId.find('span').first().attr('id').split('-')[1]
        var data = ipcRenderer.sendSync('getCollection', {'collectionID': collectionID})

        section.find('#id_name').val(data.name)
        section.find('#id_id').val(data.id)
        $('#side-right').empty().append(section)
    }

    var remove = function (mode) {
        new Tree().removeCollection(mode)
    }

    var paste = function () {
        var collectionID = clickedCollectionId.children('span').first().attr('id').split('-')[1]
        var fileID = copiedFile.children('span').first().attr('id').split('-')[1]
        var result

        new Tree().appendFile(copiedFile[0])
        contextMenuItems.collection.paste.enabled = false
        result = ipcRenderer.sendSync('copyFile', {'data': {'fileID': fileID, 'collectionID': collectionID}})

        console.log(result)
    }

    var handleFolderClick = function (event) {
        console.log(event.which)
        if(event.which === 1) {
            console.log($(event.target))
            var folder = $(event.target).closest('li');
            var folderId = folder.find('span').first().attr('id')
            console.log(folderId)
            var folderIcon = folder.find('i').first();
            var folderList = folder.find('ul').first();
            console.log(folderIcon)

            if(folderIcon.hasClass('fa-folder')) {
                new Tree().build(folderId)
                folderIcon.removeClass('fa-folder');
                folderIcon.addClass('fa-folder-open');

                if(typeof(folderList) !== 'undefined') {
                    folderList.show();
                }
            } else if(folderIcon.hasClass('fa-folder-open')) {
                folder.find('ul').first().remove()
                folderIcon.removeClass('fa-folder-open');
                folderIcon.addClass('fa-folder');

                if(typeof(folderList) !== 'undefined') {
                    folderList.hide();
                }
            }
        } else if (event.which === 3) {
            console.log($(event.target))
            clickedCollectionId = $(event.target).closest('li')
            if($(event.target).closest('li').attr('id') === 'root') {
                menuRoot.popup(remote.getCurrentWindow())
            } else {
                menuFolder.popup(remote.getCurrentWindow())
            }
        }
    }

    var init = function () {
        $(document).on('mousedown', '.folder', handleFolderClick)
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
        var fileID = clickedFileId.children('span').attr('id').split('-')[1]
        var collectionID = clickedFileId.parents('li').children('span').attr('id').split('-')[1]

        new Tree().removeFile(mode, fileID)
        IO.removeFile(fileID, collectionID, mode)
    }

    var add = function () {
        var section = new Import().getTemplate('#link-section-add-file', '#section-add-file')

        $('#side-right').empty().append(section)
    }
    
    var edit = function () {
        var section = new Import().getTemplate('#link-section-edit-file', '#section-edit-file')
        var id = clickedFileId.find('span').first().attr('id').split('-')[1]
        var data = {}
        var fileData = ipcRenderer.sendSync('getFileData', {'fileID': id})
        console.log(fileData)
        var quantity = fileData.data.tagIDs.length
        var i = 0

        data['name'] = fileData.data.name
        data['tags'] = ''

        fileData.data.tagIDs.forEach(function (tagID) {
            var tag = ipcRenderer.sendSync('getTag', {'tagID': tagID})

            if(i === quantity) {
                data['tags'] += tag.data.tag
            } else {
                data['tags'] += tag.data.tag + ' '
            }
            i++
        })

        section.find('#id_name').val(data['name'])
        section.find('#id_tag').val(data['tags'])
        section.find('#id_id').val(id)
        $('#side-right').empty().append(section)
    }

    var copy = function (event) {
        copiedFile = clickedFileId.clone();
        contextMenuItems.collection.paste.enabled = true;
    }

    var handleFileClick = function (event) {
        console.log(event.which)
        clickedFileId = $(event.target).closest('li')

        if(event.which === 1) {
            var section = new Import().getTemplate('#link-section-info', '#section-info');
            var fileId = clickedFileId.find('span').first().attr('id').split('-')[1]

            console.log(fileId)

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

        ipcRenderer.on('scanCompleted', function () {
            console.log(2)
            var parent = $('#root').children('span').attr('id')
            console.log(parent)
            new Tree().build(parent)
            // $('#scan').removeClass('scan-proceed')
        })
    }

    var init = function (event) {
        var section = new Import().getTemplate('#link-section-default', '#section-default');
        $('#side-right').empty().append(section);

        menuFolder.append(contextMenuItems.collection.addFile)
        menuFolder.append(contextMenuItems.collection.addCollection)
        menuFolder.append(contextMenuItems.collection.edit)
        menuFolder.append(contextMenuItems.collection.paste)
        menuFolder.append(contextMenuItems.collection.remove.collection)
        menuFolder.append(contextMenuItems.collection.remove.global)
        menuFile.append(contextMenuItems.file.edit)
        menuFile.append(contextMenuItems.file.copy)
        menuFile.append(contextMenuItems.file.remove.collection)
        menuFile.append(contextMenuItems.file.remove.global)
        menuRoot.append(contextMenuItems.root.addFile)
        menuRoot.append(contextMenuItems.root.addCollection)

        new Tree().build()

        $(document).on('click', '#scan', handleScanClick)
    }
    init()
}

new Folder().init()
new File().init()
new ButtonBar();
new Start()

exports.Tree = Tree

