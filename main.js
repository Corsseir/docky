const electron = require('electron')
// Module to control application life.
const app = electron.app
const dialog = electron.dialog
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// Database Imports
const Database = require('./libs/database.js').Database
const DatabaseOperation = require('./libs/database.js').DatabaseOperation
const IO = require('./libs/io.js').IO

const scanPDF = require('./components/scanPDF.js')
const File = require('./components/file.js')
const Collection = require('./components/collection.js')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 1000, height: 562})

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`)

    // Open the DevTools.
    mainWindow.webContents.openDevTools({detach: true})

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    // DatabaseOperation.DropTables()
    // DatabaseOperation.CreateTables()
}

function createFolders() {
    IO.createLocalLib()
}

function createRoot() {
    DatabaseOperation.Collection.GetAllCollections(null, null, null, null, function (err, rows) {
        var exist = false;
        console.log(rows.length)
        for (var i = 0; i < rows.length; i++) {
            console.log(rows[i].ID_ParentCollection)
            if (rows[i].ID_ParentCollection === null) {
                exist = true;
                break;
            }
        }

        if (!exist) {
            DatabaseOperation.Collection.CreateCollection('/', null)
        }
    })
}

function getFilePath() {
    return dialog.showOpenDialog({properties: ['openFile']})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)
app.on('ready', createFolders)
app.on('ready', createRoot)
// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

exports.getFilePath = getFilePath
