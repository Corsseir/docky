// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const scan = require('electron').remote.require('./components/scanPDF.js').Scan
const {remote} = require('electron')
const {Menu, MenuItem} = remote
const menuRoot = new Menu()
const menuFolder = new Menu()
const menuFile = new Menu()
const DatabaseOperation = require('./libs/database.js').DatabaseOperation
const IO = require('./libs/io.js').IO
const CollectionHelper = require('./helpers/collection.js').CollectionHelper
const FileHelper = require('./helpers/file.js').FileHelper

var clickedCollectionId;
var clickedFileId;

function Tree() {
    var renderCollection = function (collection) {
        var link = document.querySelector('#link-partial-folder');
        var template = link.import.querySelector('#partial-folder');
        var clone = document.importNode(template.content, true);

        clone = $(clone)
        clone.find('span').first().attr('id', 'folder-' + collection.ID_Collection)
        clone.find('span').first().data('parent-folder', collection.ID_ParentCollection)
        clone.find('span').first().append(collection.Name)

        return clone
    }

    var renderFile = function (file) {
        var link = document.querySelector('#link-partial-file');
        var template = link.import.querySelector('#partial-file');
        var clone = document.importNode(template.content, true);

        clone = $(clone)
        clone.find('span').first().attr('id', 'file-' + file.ID_File)
        clone.find('span').first().append(file.Filename)

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

        DatabaseOperation.Collection.GetChildrenCollection(root.ID_Collection, function (err, collections) {
            for (var i = 0; i < collections.length; i++) {
                console.log(collections[i])
                DatabaseOperation.Collection.GetCollection(collections[i].ID_Collection, function (err, row) {
                    console.log(row)
                    ul.append(renderCollection(row))
                })
            }
        })

        DatabaseOperation.File_Collection.GetAllFile_Collection(null, root.ID_Collection, function (err, file_collections) {
            console.log(file_collections)
            for (var i = 0; i < file_collections.length; i++) {
                console.log(file_collections[i])
                DatabaseOperation.File.GetFile(file_collections[i].ID_File, function (err, row) {
                    ul.append(renderFile(row))
                })
            }
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
        if(typeof parent === 'undefined') {
            DatabaseOperation.Collection.GetCollection(1, function (err, row) {
                var root = row;

                console.log(root)
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

        DatabaseOperation.Collection.CreateCollection(data.name, collectionParentId, function () {
            $('#side-right').empty().append(section)
            build(clickedCollectionId.find('span').first().attr('id'))
        })
    }

    var addFile = function (data) {
        var collectionParentId = clickedCollectionId.find('span').first().attr('id').split('-')[1]
        var section = new Import().getTemplate('#link-section-default', '#section-default')
        var pdfs = ['' + data.path]
        var collectionIcon = clickedCollectionId.find('i').first()

        console.log('collectionParenId: ' + collectionParentId)

        IO.addToLibAndDb(pdfs, collectionParentId, data.filename, function() {
            $('#side-right').empty().append(section)
            build(clickedCollectionId.find('span').first().attr('id'))

            if(collectionIcon.hasClass('fa-folder')) {
                collectionIcon.removeClass('fa-folder');
                collectionIcon.addClass('fa-folder-open');
            }
        })
    }

    return {
        'build': build,
        'addCollection': addCollection,
        'addFile': addFile,
    }
}

function Folder () {
    var add = function () {
        var section = new Import().getTemplate('#link-section-add-folder', '#section-add-folder')

        $('#side-right').empty().append(section)
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
    }
}

function File () {
    var add = function () {
        var section = new Import().getTemplate('#link-section-add-file', '#section-add-file')

        $('#side-right').empty().append(section)
    }

    var handleFileClick = function (event) {
        console.log(event.which)
        clickedFileId = $(event.target).closest('li')

        if(event.which === 1) {
            var section = new Import().getTemplate('#link-section-info', '#section-info');
            var fileId = clickedFileId.find('span').first().attr('id').split('-')[1]

            console.log(fileId)

            DatabaseOperation.File.GetFile(fileId, function (err, row) {
                console.log(row)
                section.find('#info-name').first().append(row.Filename)
                console.log(section)

                $('#side-right').empty().append(section);
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

function Start () {
    var handleScanClick = function (event) {
        var response = scan.proceed()

        console.log(response.status)
    }

    var handleAddClick = function (event) {
        $(document).find('#side-right').first().empty();
        new Import().getTemplate('#link-section-add-file', '#section-add-file', '#side-right');
    }

    var init = function (event) {
        var section = new Import().getTemplate('#link-section-default', '#section-default');
        $('#side-right').empty().append(section);

        menuFolder.append(new MenuItem({label: 'Dodaj Folder', click() { new Folder().add() }}))
        menuFolder.append(new MenuItem({label: 'Dodaj Plik', click() { new File().add() }}))
        menuFolder.append(new MenuItem({label: 'Zmień nazwę', click() { console.log('item 1 clicked') }}))
        menuFolder.append(new MenuItem({label: 'Usuń', click() { console.log('item 1 clicked') }}))
        menuFile.append(new MenuItem({label: 'Usuń', click() { console.log('item 1 clicked') }}))
        menuRoot.append(new MenuItem({label: 'Dodaj Folder', click() { new Folder().add() }}))
        menuRoot.append(new MenuItem({label: 'Dodaj Plik', click() { new File().add() }}))

        new Tree().build()

        $(document).on('click', '#scan', handleScanClick)
        $(document).on('click', '#add', handleAddClick)
    }
    init()
}

new Folder().init()
new File().init()
new ButtonBar();
new Start()

exports.Tree = Tree

