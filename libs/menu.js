/**
 * Created by micha on 08.12.2016.
 */
const {Menu} = require('electron')

const template = [

    {
        label:'Plik',
        role: 'Okno',
        submenu: [
            {
                label: 'Minimalizuj',
                role: 'minimize'
            },
            {
                label: 'Zamknij',
                role: 'close'
            }
        ]
    },

    {
        label: 'Widok',
        submenu: [
            {
                label: 'Odśwież',
                role: 'reload'
            },
            {
                label: 'Opcje deweloperskie',
                role: 'toggledevtools'
            },
            {
                type: 'separator'
            },
            {
                label: 'Domyślny zoom',
                role: 'resetzoom'
            },
            {
                label: 'Przybliż',
                role: 'zoomin'
            },
            {
                label: 'Oddal',
                role: 'zoomout'
            },
            {
                type: 'separator'
            },
            {
                label: 'Tryp pełnoekranowy',
                role: 'togglefullscreen'
            }
        ]
    }
//,
    /*    {
     role: 'help',
     submenu: [
     {
     label: 'Learn More',
     click () { require('electron').shell.openExternal('http://electron.atom.io') }
     }
     ]
     }*/
]

if (process.platform === 'darwin') {
    template.unshift({
        label: app.getName(),
        submenu: [
            {
                role: 'about'
            },
            {
                type: 'separator'
            },
            {
                role: 'services',
                submenu: []
            },
            {
                type: 'separator'
            },
            {
                role: 'hide'
            },
            {
                role: 'hideothers'
            },
            {
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                role: 'quit'
            }
        ]
    })
    // Edit menu.
    template[1].submenu.push(
        {
            type: 'separator'
        },
        {
            label: 'Speech',
            submenu: [
                {
                    role: 'startspeaking'
                },
                {
                    role: 'stopspeaking'
                }
            ]
        }
    )
    // Window menu.
    template[3].submenu = [
        {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
        },
        {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        },
        {
            label: 'Zoom',
            role: 'zoom'
        },
        {
            type: 'separator'
        },
        {
            label: 'Bring All to Front',
            role: 'front'
        }
    ]
}


const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
