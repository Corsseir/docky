process.chdir('../../../../');
var IOTrick = '../../../../libs/io.js'
const IO = global.require(IOTrick).IO
const fs = require('fs')
const os = require('os')
var length = null
var message = null

process.stdin.on('readable', getMessageFromAddon);

function executeCommand(message)
{
    let command = message.split(' ')[0].toLowerCase()
    let argument = message.split(' ')[1]
    if(command === "add")
    {
        IO.addToLibAndDbFromUrl([argument], function (result)
        {
            sendMessageToAddon(result)
        })
    }
}

function getMessageFromAddon()
{
    if(length === null)
    {
        let rawLength = process.stdin.read(4)
        if(rawLength !== null && rawLength.length === 4)
        {
            if(os.endianness() == 'LE')
            {
                length = rawLength.readUInt32LE(0)
            }
            else
            {
                length = rawLength.readUInt32BE(0)
            }
            if(typeof length === 'number')
            {
                let rawMessage = process.stdin.read(length)
                if(rawMessage !== null && rawMessage.length === length)
                {
                    message = JSON.parse(rawMessage.toString())
                    executeCommand(message)
                    length = null
                }
            }
            else
            {
                length = null
            }
        }
    }
    else
    {
        let rawMessage = process.stdin.read(length)
        if(rawMessage !== null && rawMessage.length === length)
        {
            message = JSON.parse(rawMessage.toString())
            executeCommand(message)
            length = null
        }
    }
}

function sendMessageToAddon(message)
{
    let encodedMessage = JSON.stringify(message)
    let encodedLength = Buffer.allocUnsafe(4);
    if(os.endianness() == 'LE')
    {
        encodedLength.writeUInt32LE(Buffer.byteLength(encodedMessage, 'utf8'), 0);
    }
    else
    {
        encodedLength.writeUInt32BE(Buffer.byteLength(encodedMessage, 'utf8'), 0);
    }
    process.stdout.write(encodedLength,"utf8",function ()
    {
        process.stdout.write(encodedMessage)
    })
}