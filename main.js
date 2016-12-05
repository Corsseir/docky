const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const {File} = require('./components/file.js')
const {Collection} = require('./components/collection.js')
const {Location} = require('./components/location.js')
const {Dialog} = require('./helpers/dialog.js')
const {Search} = require('./libs/search.js')
const {IO} = require('./libs/io.js')
const {Database, DatabaseOperation} = require('./libs/database.js')

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
    DatabaseOperation.Collection.GetAllCollections('/', null, null, null, function (err, collections) {
        if (collections.length === 0) {
            DatabaseOperation.Collection.CreateCollection('/', null)
        }
    })
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

