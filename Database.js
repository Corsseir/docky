/**
 * Created by Daniel on 2016-10-21.
 */
const sqlite3 = require('sqlite3').verbose()
const Database = new sqlite3.Database('Database.sqlite3').run('PRAGMA foreign_keys = ON')

class DatabaseOperation
{
    static CreateTables()
    {
        Database.serialize(function ()
        {
            Database.run('create table if not exists Tag(ID_Tag INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, Value TEXT)', ErrorCallback)
            Database.run('create table if not exists BLOB(ID_BLOB INTEGER PRIMARY KEY AUTOINCREMENT, BLOB BLOB)', ErrorCallback)
            Database.run('create table if not exists Location(ID_Location INTEGER PRIMARY KEY AUTOINCREMENT, Type TEXT, Location TEXT)', ErrorCallback)
            Database.run('create table if not exists File(ID_File INTEGER PRIMARY KEY AUTOINCREMENT, Filename TEXT, ID_BLOB INTEGER, Checksum TEXT, FOREIGN KEY(ID_BLOB) REFERENCES BLOB(ID_BLOB))', ErrorCallback)
            Database.run('create table if not exists Collection(ID_Collection INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, ID_ParentCollection INTEGER, FOREIGN KEY(ID_ParentCollection) REFERENCES Collection(ID_Collection))', ErrorCallback)
            Database.run('create table if not exists File_Collection(ID_File INTEGER NOT NULL, ID_Collection INTEGER NOT NULL, FOREIGN KEY(ID_File) REFERENCES File(ID_File), FOREIGN KEY(ID_Collection) REFERENCES Collection(ID_Collection), PRIMARY KEY(ID_File, ID_Collection))', ErrorCallback)
            Database.run('create table if not exists File_Location(ID_File INTEGER NOT NULL, ID_Location INTEGER NOT NULL, FOREIGN KEY(ID_File) REFERENCES File(ID_File), FOREIGN KEY(ID_Location) REFERENCES Location(ID_Location), PRIMARY KEY(ID_File, ID_Location))', ErrorCallback)
            Database.run('create table if not exists File_Tag(ID_File INTEGER NOT NULL, ID_Tag INTEGER NOT NULL, FOREIGN KEY(ID_File) REFERENCES File(ID_File), FOREIGN KEY(ID_Tag) REFERENCES Tag(ID_Tag), PRIMARY KEY(ID_File, ID_Tag))', ErrorCallback)
        })
    }

    static DropTables()
    {
        Database.serialize(function ()
        {
            Database.run('drop table if exists File_Tag', ErrorCallback)
            Database.run('drop table if exists File_Location', ErrorCallback)
            Database.run('drop table if exists File_Collection', ErrorCallback)
            Database.run('drop table if exists Collection', ErrorCallback)
            Database.run('drop table if exists File', ErrorCallback)
            Database.run('drop table if exists Location', ErrorCallback)
            Database.run('drop table if exists BLOB', ErrorCallback)
            Database.run('drop table if exists Tag', ErrorCallback)
        })
    }

    static  ShowTables()
    {
        Database.all("select name from sqlite_master where type='table'", function (err, tables)
        {
            console.log(tables)
        })
    }
}

DatabaseOperation.Tag = class Tag
{
    // The signature of the callback is function(err) {}
    // If execution was successful, the this object will contain property named lastID
    static CreateTag(Name, Value, Callback)
    {
        Database.run('INSERT INTO Tag (Name, Value) VALUES ($Name, $Value)', {$Name: Name, $Value: Value}, Callback)
    }

    // The signature of the callback is function(err, row) {}
    static GetTag(Id, Callback)
    {
        Database.get('SELECT * FROM Tag WHERE ID_Tag = $ID', {$ID: Id}, Callback)
    }

    // The signature of the callback is function(err, rows) {}
    static GetAllTags(Callback)
    {
        Database.all('SELECT * FROM Tag', Callback)
    }

    static UpdateTag(Id, Name, Value)
    {
        Database.run('UPDATE Tag SET Name = $Name, Value = $Value WHERE ID_Tag = $ID', {$Name: Name, $Value: Value, $ID: Id}, ErrorCallback)
    }

    static DeleteTag(Id)
    {
        Database.run('DELETE FROM Tag WHERE ID_Tag = $ID',{$ID: Id}, ErrorCallback)
    }
}

DatabaseOperation.Location = class Location
{
    // The signature of the callback is function(err) {}
    // If execution was successful, the this object will contain property named lastID
    static CreateLocation(Type, Location, Callback)
    {
        Database.run('INSERT INTO Location (Type, Location) VALUES ($Type, $Location)', {$Type: Type, $Location: Location}, Callback);
    }

    // The signature of the callback is function(err, row) {}
    static GetLocation(Id, Callback)
    {
        Database.get('SELECT * FROM Location WHERE ID_Location = $ID', {$ID: Id}, Callback)
    }

    // The signature of the callback is function(err, rows) {}
    static GetAllLocations(Callback)
    {
        Database.all('SELECT * FROM Location', Callback)
    }

    static UpdateLocation(Id, Type, Location)
    {
        Database.run('UPDATE Location SET Type = $Type, Location = $Location WHERE ID_Location = $ID', {$Type: Type, $Location: Location, $ID: Id}, ErrorCallback)
    }

    static DeleteLocation(Id)
    {
        Database.run('DELETE FROM Location WHERE ID_Location = $ID',{$ID: Id}, ErrorCallback)
    }
}

DatabaseOperation.Collection = class Collection
{
    // The signature of the callback is function(err) {}
    // If execution was successful, the this object will contain property named lastID
    static CreateCollection(Name, ID_ParentCollection, Callback)
    {
        Database.run('INSERT INTO Collection (Name, ID_ParentCollection) VALUES ($Name, $ID_ParentCollection)', {$Name: Name, $ID_ParentCollection: ID_ParentCollection}, Callback)
    }

    // The signature of the callback is function(err, row) {}
    static GetCollection(Id, Callback)
    {
        Database.get('SELECT * FROM Collection WHERE ID_Collection = $ID', {$ID: Id}, Callback)
    }

    // The signature of the callback is function(err, rows) {}
    static GetAllCollections(Callback)
    {
        Database.all('SELECT * FROM Collection', Callback)
    }

    static UpdateCollection(Id, Name, ID_ParentCollection)
    {
        Database.run('UPDATE Collection SET Name = $Name, ID_ParentCollection = $ID_ParentCollection WHERE ID_Collection = $ID', {$Name: Name, $ID_ParentCollection: ID_ParentCollection, $ID: Id}, ErrorCallback)
    }

    static DeleteCollection(Id)
    {
        Database.run('DELETE FROM Collection WHERE ID_Collection = $ID',{$ID: Id}, ErrorCallback)
    }
}

DatabaseOperation.BLOB = class BLOB
{
    // The signature of the callback is function(err) {}
    // If execution was successful, the this object will contain property named lastID
    static CreateBLOB(BLOB, Callback)
    {
        Database.run('INSERT INTO BLOB (BLOB) VALUES ($BLOB)', {$BLOB: BLOB}, Callback)
    }

    // The signature of the callback is function(err, row) {}
    static GetBLOB(Id, Callback)
    {
        Database.get('SELECT * FROM BLOB WHERE ID_BLOB = $ID', {$ID: Id}, Callback)
    }

    // The signature of the callback is function(err, rows) {}
    static GetAllBLOBS(Callback)
    {
        Database.all('SELECT * FROM BLOB', Callback)
    }

    static UpdateBLOB(Id, BLOB)
    {
        Database.run('UPDATE BLOB SET BLOB = $BLOB WHERE ID_BLOB = $ID', {$BLOB: BLOB, $ID: Id}, ErrorCallback)
    }

    static DeleteBLOB(Id)
    {
        Database.run('DELETE FROM BLOB WHERE ID_BLOB = $ID',{$ID: Id}, ErrorCallback)
    }
}

DatabaseOperation.File = class File
{
    // The signature of the callback is function(err) {}
    // If execution was successful, the this object will contain property named lastID
    static CreateFile(ID_BLOB, Filename, Checksum, Callback)
    {
        Database.run('INSERT INTO File (ID_BLOB, Filename, Checksum) VALUES ($ID_BLOB, $Filename, $Checksum)', {$ID_BLOB: ID_BLOB, $Filename: Filename, $Checksum: Checksum}, Callback)
    }

    // The signature of the callback is function(err, row) {}
    static GetFile(Id, Callback)
    {
        Database.get('SELECT * FROM File WHERE ID_File = $ID', {$ID: Id}, Callback)
    }

    // The signature of the callback is function(err, rows) {}
    static GetAllFiles(Callback)
    {
        Database.all('SELECT * FROM File', Callback)
    }

    static UpdateFile(Id, ID_BLOB, Filename, Checksum)
    {
        Database.run('UPDATE File SET ID_BLOB = $ID_BLOB, Filename = $Filename, Checksum = $Checksum WHERE ID_File = $ID', {$ID_BLOB: ID_BLOB, $Filename: Filename, $Checksum: Checksum, $ID: Id}, ErrorCallback)
    }

    static DeleteFile(Id)
    {
        Database.run('DELETE FROM File WHERE ID_File = $ID',{$ID: Id}, ErrorCallback)
    }
}

DatabaseOperation.File_Tag = class File_Tag
{
    static CreateFile_Tag(ID_File, ID_Tag)
    {
        Database.run('INSERT INTO File_Tag (ID_File, ID_Tag) VALUES ($ID_File, $ID_Tag)', {$ID_File: ID_File, $ID_Tag: ID_Tag}, ErrorCallback)
    }

    // The signature of the callback is function(err, rows) {}
    static GetAllFile_Tag(ID_File, ID_Tag, Callback)
    {
        if(ID_File == null && ID_Tag == null)
        {
            Database.all('SELECT * FROM File_Tag', Callback)
        }
        else if(ID_File == null)
        {
            Database.all('SELECT * FROM File_Tag WHERE ID_Tag = $ID_Tag', {$ID_Tag: ID_Tag}, Callback)
        }
        else if(ID_Tag == null)
        {
            Database.all('SELECT * FROM File_Tag WHERE ID_File = $ID_File', {$ID_File: ID_File}, Callback)
        }
        else
        {
            Database.all('SELECT * FROM File_Tag WHERE ID_File = $ID_File and ID_Tag = $ID_Tag', {$ID_File: ID_File, $ID_Tag: ID_Tag}, Callback)
        }
    }

    static UpdateFile_Tag(ID_File, ID_Tag, New_ID_File, New_ID_Tag)
    {
        Database.run('UPDATE File_Tag SET ID_File = $New_ID_File, ID_Tag = $New_ID_Tag WHERE ID_File = $ID_File and ID_Tag = $ID_Tag', {$ID_File: ID_File, $ID_Tag: ID_Tag, $New_ID_File: New_ID_File, $New_ID_Tag: New_ID_Tag}, ErrorCallback)
    }

    static DeleteFile_Tag(ID_File, ID_Tag)
    {
        Database.run('DELETE FROM File_Tag WHERE ID_File = $ID_File and ID_Tag = $ID_Tag',{$ID_File: ID_File, $ID_Tag: ID_Tag}, ErrorCallback)
    }
}

DatabaseOperation.File_Location = class File_Location
{
    static CreateFile_Location(ID_File, ID_Location)
    {
        Database.run('INSERT INTO File_Location (ID_File, ID_Location) VALUES ($ID_File, $ID_Location)', {$ID_File: ID_File, $ID_Location: ID_Location}, ErrorCallback)
    }

    // The signature of the callback is function(err, rows) {}
    static GetAllFile_Location(ID_File, ID_Location, Callback)
    {
        if(ID_File == null && ID_Location == null)
        {
            Database.all('SELECT * FROM File_Location', Callback)
        }
        else if(ID_File == null)
        {
            Database.all('SELECT * FROM File_Location WHERE ID_Location = $ID_Location', {$ID_Location: ID_Location}, Callback)
        }
        else if(ID_Location == null)
        {
            Database.all('SELECT * FROM File_Location WHERE ID_File = $ID_File', {$ID_File: ID_File}, Callback)
        }
        else
        {
            Database.all('SELECT * FROM File_Location WHERE ID_File = $ID_File and ID_Location = $ID_Location', {$ID_File: ID_File, $ID_Location: ID_Location}, Callback)
        }
    }

    static UpdateFile_Location(ID_File, ID_Location, New_ID_File, New_ID_Location)
    {
        Database.run('UPDATE File_Location SET ID_File = $New_ID_File, ID_Location = $New_ID_Location WHERE ID_File = $ID_File and ID_Location = $ID_Location', {$ID_File: ID_File, $ID_Location: ID_Location, $New_ID_File: New_ID_File, $New_ID_Location: New_ID_Location}, ErrorCallback)
    }

    static DeleteFile_Location(ID_File, ID_Location)
    {
        Database.run('DELETE FROM File_Location WHERE ID_File = $ID_File and ID_Location = $ID_Location',{$ID_File: ID_File, $ID_Location: ID_Location}, ErrorCallback)
    }
}

DatabaseOperation.File_Collection = class File_Collection
{
    static CreateFile_Collection(ID_File, ID_Collection)
    {
        Database.run('INSERT INTO File_Collection (ID_File, ID_Collection) VALUES ($ID_File, $ID_Collection)', {$ID_File: ID_File, $ID_Collection: ID_Collection}, ErrorCallback)
    }

    // The signature of the callback is function(err, rows) {}
    static GetAllFile_Collection(ID_File, ID_Collection, Callback)
    {
        if(ID_File == null && ID_Collection == null)
        {
            Database.all('SELECT * FROM File_Collection', Callback)
        }
        else if(ID_File == null)
        {
            Database.all('SELECT * FROM File_Collection WHERE ID_Collection = $ID_Collection', {$ID_Collection: ID_Collection}, Callback)
        }
        else if(ID_Collection == null)
        {
            Database.all('SELECT * FROM File_Collection WHERE ID_File = $ID_File', {$ID_File: ID_File}, Callback)
        }
        else
        {
            Database.all('SELECT * FROM File_Collection WHERE ID_File = $ID_File and ID_Collection = $ID_Collection', {$ID_File: ID_File, $ID_Collection: ID_Collection}, Callback)
        }
    }

    static UpdateFile_Collection(ID_File, ID_Collection, New_ID_File, New_ID_Collection)
    {
        Database.run('UPDATE File_Collection SET ID_File = $New_ID_File, ID_Collection = $New_ID_Collection WHERE ID_File = $ID_File and ID_Collection = $ID_Collection', {$ID_File: ID_File, $ID_Collection: ID_Collection, $New_ID_File: New_ID_File, $New_ID_Collection: New_ID_Collection}, ErrorCallback)
    }

    static DeleteFile_Collection(ID_File, ID_Collection)
    {
        Database.run('DELETE FROM File_Collection WHERE ID_File = $ID_File and ID_Collection = $ID_Collection',{$ID_File: ID_File, $ID_Collection: ID_Collection}, ErrorCallback)
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