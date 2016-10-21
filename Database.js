/**
 * Created by Daniel on 2016-10-21.
 */
const sqlite3 = require('sqlite3').verbose();
const Database = new sqlite3.Database('Database.sqlite3');

class DatabaseOperation
{
    static CreateTables()
    {
        Database.serialize(function ()
        {
            Database.run('create table if not exists Tag(ID_Tag INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, Value TEXT)', ErrorCallback);
            Database.run('create table if not exists BLOB(ID_BLOB INTEGER PRIMARY KEY AUTOINCREMENT, BLOB BLOB, Checksum TEXT)', ErrorCallback);
            Database.run('create table if not exists Location(ID_Location INTEGER PRIMARY KEY AUTOINCREMENT, Type TEXT, Location TEXT)', ErrorCallback);
            Database.run('create table if not exists File(ID_File INTEGER PRIMARY KEY AUTOINCREMENT, Filename TEXT, ID_BLOB INTEGER, FOREIGN KEY(ID_BLOB) REFERENCES BLOB(ID_BLOB))', ErrorCallback);
            Database.run('create table if not exists Collection(ID_Collection INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, ID_ParentCollection INTEGER, FOREIGN KEY(ID_ParentCollection) REFERENCES Collection(ID_Collection))', ErrorCallback);
            Database.run('create table if not exists File_Collection(ID_File INTEGER, ID_Collection INTEGER, FOREIGN KEY(ID_File) REFERENCES File(ID_File), FOREIGN KEY(ID_Collection) REFERENCES Collection(ID_Collection), PRIMARY KEY(ID_File, ID_Collection))', ErrorCallback);
            Database.run('create table if not exists File_Location(ID_File INTEGER, ID_Location INTEGER, FOREIGN KEY(ID_File) REFERENCES File(ID_File), FOREIGN KEY(ID_Location) REFERENCES Location(ID_Location), PRIMARY KEY(ID_File, ID_Location))', ErrorCallback);
            Database.run('create table if not exists File_Tag(ID_File INTEGER, ID_Tag INTEGER, FOREIGN KEY(ID_File) REFERENCES File(ID_File), FOREIGN KEY(ID_Tag) REFERENCES Tag(ID_Tag), PRIMARY KEY(ID_File, ID_Tag))', ErrorCallback);
        })
    }

    static DropTables()
    {
        Database.serialize(function ()
        {
            Database.run('drop table if exists File_Tag', ErrorCallback);
            Database.run('drop table if exists File_Location', ErrorCallback);
            Database.run('drop table if exists File_Collection', ErrorCallback);
            Database.run('drop table if exists Collection', ErrorCallback);
            Database.run('drop table if exists File', ErrorCallback);
            Database.run('drop table if exists Location', ErrorCallback);
            Database.run('drop table if exists BLOB', ErrorCallback);
            Database.run('drop table if exists Tag', ErrorCallback);
        })
    }

    static  ShowTables()
    {
        Database.serialize(function ()
        {
            Database.all("select name from sqlite_master where type='table'", function (err, tables) {
                console.log(tables);
            });
        })
    }
}

exports.Database = Database;
exports.DatabaseOperation = DatabaseOperation;

function ErrorCallback(err)
{
    if(err != null)
    {
        console.log(err.message);
    }
}