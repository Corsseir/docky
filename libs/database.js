/**
 * Created by Daniel on 2016-10-21.
 */
const sqlite3 = require('sqlite3')
const Database = new sqlite3.Database('Database.sqlite3').run('PRAGMA foreign_keys = ON')

class DatabaseOperation
{
    static CreateTables()
    {
        Database.serialize(function ()
        {
            Database.run('create table if not exists Tag(ID_Tag INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, Value TEXT)', ErrorCallback)
            Database.run('create table if not exists File(ID_File INTEGER PRIMARY KEY AUTOINCREMENT, Filename TEXT, Path TEXT, Url TEXT, Date TEXT, Checksum TEXT)', ErrorCallback)
            Database.run('create table if not exists Collection(ID_Collection INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, ID_ParentCollection INTEGER, FOREIGN KEY(ID_ParentCollection) REFERENCES Collection(ID_Collection) ON DELETE CASCADE)', ErrorCallback)
            Database.run('create table if not exists File_Collection(ID_File INTEGER NOT NULL, ID_Collection INTEGER NOT NULL, FOREIGN KEY(ID_File) REFERENCES File(ID_File) ON DELETE CASCADE, FOREIGN KEY(ID_Collection) REFERENCES Collection(ID_Collection) ON DELETE CASCADE, PRIMARY KEY(ID_File, ID_Collection))', ErrorCallback)
            Database.run('create table if not exists File_Tag(ID_File INTEGER NOT NULL, ID_Tag INTEGER NOT NULL, FOREIGN KEY(ID_File) REFERENCES File(ID_File) ON DELETE CASCADE, FOREIGN KEY(ID_Tag) REFERENCES Tag(ID_Tag) ON DELETE CASCADE, PRIMARY KEY(ID_File, ID_Tag))', ErrorCallback)
        })
    }

    static DropTables()
    {
        Database.serialize(function ()
        {
            Database.run('drop table if exists File_Tag', ErrorCallback)
            Database.run('drop table if exists File_Collection', ErrorCallback)
            Database.run('drop table if exists Collection', ErrorCallback)
            Database.run('drop table if exists File', ErrorCallback)
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

DatabaseOperation.CreateTables();

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
    static GetAllTags(Name, Value, OrderBy, OrderDirection, Callback)
    {
        if(Name == null && Value == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM Tag', Callback)
            }
            else
            {
                Database.all('SELECT * FROM Tag ORDER BY ' + OrderBy + ' ' + OrderDirection, Callback)
            }
        }
        else if(Name == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM Tag WHERE Value = $Value', {$Value: Value}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM Tag WHERE Value = $Value ORDER BY ' + OrderBy + ' ' + OrderDirection, {$Value: Value}, Callback)
            }
        }
        else if(Value == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM Tag WHERE Name = $Name', {$Name: Name}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM Tag WHERE N-ame = $Name ORDER BY ' + OrderBy + ' ' + OrderDirection, {$Name: Name}, Callback)
            }
        }
        else
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM Tag WHERE Name = $Name and Value = $Value', {$Name: Name, $Value: Value}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM Tag WHERE Name = $Name and Value = $Value ORDER BY ' + OrderBy + ' ' + OrderDirection, {$Name: Name, $Value: Value}, Callback)
            }
        }
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
    static GetAllCollections(Name, ID_ParentCollection, OrderBy, OrderDirection, Callback)
    {
        if(Name == null && ID_ParentCollection == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM Collection', Callback)
            }
            else
            {
                Database.all('SELECT * FROM Collection ORDER BY ' + OrderBy + ' ' + OrderDirection, Callback)
            }
        }
        else if(Name == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM Collection WHERE ID_ParentCollection = $ID_ParentCollection', {$ID_ParentCollection: ID_ParentCollection}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM Collection WHERE ID_ParentCollection = $ID_ParentCollection ORDER BY ' + OrderBy + ' ' + OrderDirection, {$ID_ParentCollection: ID_ParentCollection}, Callback)
            }
        }
        else if(ID_ParentCollection == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM Collection WHERE Name = $Name', {$Name: Name}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM Collection WHERE Name = $Name ORDER BY ' + OrderBy + ' ' + OrderDirection, {$Name: Name}, Callback)
            }
        }
        else
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM Collection WHERE ID_ParentCollection = $ID_ParentCollection and Name = $Name', {$ID_ParentCollection: ID_ParentCollection, $Name: Name}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM Collection WHERE ID_ParentCollection = $ID_ParentCollection and Name = $Name ORDER BY ' + OrderBy + ' ' + OrderDirection, {$ID_ParentCollection: ID_ParentCollection, $Name: Name}, Callback)
            }
        }
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

DatabaseOperation.File = class File
{
    // The signature of the callback is function(err) {}
    // If execution was successful, the this object will contain property named lastID
    //Filename, Path, Url, Date, Checksum,
    static CreateFile(Filename, Path, Url, Date, Checksum, Callback)
    {
        Database.run('INSERT INTO File (Filename, Path, Url, Date, Checksum) VALUES ($Filename, $Path, $Url, $Date, $Checksum)',
            {$Filename: Filename, $Path: Path, $Url: Url, $Date: Date, $Checksum: Checksum}, Callback)
    }

    // The signature of the callback is function(err, row) {}
    static GetFile(Id, Callback)
    {
        Database.get('SELECT * FROM File WHERE ID_File = $ID', {$ID: Id}, Callback)
    }

    // The signature of the callback is function(err, rows) {}
    static GetAllFiles(Filename, OrderBy, OrderDirection, Callback)
    {
        if(Filename == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM File', Callback)
            }
            else
            {
                Database.all('SELECT * FROM File ORDER BY ' + OrderBy + ' ' + OrderDirection, Callback)
            }
        }
        else
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM File WHERE Filename = $Filename', {$Filename: Filename}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM File WHERE Filename = $Filename ORDER BY ' + OrderBy + ' ' + OrderDirection, {$Filename: Filename}, Callback)
            }
        }
    }

    static UpdateFile(Id, Filename, Path, Url, Date, Checksum)
    {
        Database.run('UPDATE File SET Filename = $Filename, Path = $Path, Url = $Url, Date = $Date, Checksum = $Checksum WHERE ID_File = $ID', {$Filename: Filename, $Path: Path, $Url: Url, $Date: Date, $Checksum: Checksum, $ID: Id}, ErrorCallback)
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
    static GetAllFile_Tag(ID_File, ID_Tag, OrderBy, OrderDirection, Callback)
    {
        if(ID_File == null && ID_Tag == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM File_Tag', Callback)
            }
            else
            {
                Database.all('SELECT * FROM File_Tag ORDER BY ' + OrderBy + ' ' + OrderDirection, Callback)
            }
        }
        else if(ID_File == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM File_Tag WHERE ID_Tag = $ID_Tag', {$ID_Tag: ID_Tag}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM File_Tag WHERE ID_Tag = $ID_Tag ORDER BY ' + OrderBy + ' ' + OrderDirection, {$ID_Tag: ID_Tag}, Callback)
            }
        }
        else if(ID_Tag == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM File_Tag WHERE ID_File = $ID_File', {$ID_File: ID_File}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM File_Tag WHERE ID_File = $ID_File ORDER BY ' + OrderBy + ' ' + OrderDirection, {$ID_File: ID_File}, Callback)
            }
        }
        else
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM File_Tag WHERE ID_File = $ID_File and ID_Tag = $ID_Tag', {$ID_File: ID_File, $ID_Tag: ID_Tag}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM File_Tag WHERE ID_File = $ID_File and ID_Tag = $ID_Tag ORDER BY ' + OrderBy + ' ' + OrderDirection, {$ID_File: ID_File, $ID_Tag: ID_Tag}, Callback)
            }
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

DatabaseOperation.File_Collection = class File_Collection
{
    static CreateFile_Collection(ID_File, ID_Collection)
    {
        Database.run('INSERT INTO File_Collection (ID_File, ID_Collection) VALUES ($ID_File, $ID_Collection)', {$ID_File: ID_File, $ID_Collection: ID_Collection}, ErrorCallback)
    }

    // The signature of the callback is function(err, rows) {}
    static GetAllFile_Collection(ID_File, ID_Collection, OrderBy, OrderDirection, Callback)
    {
        if(ID_File == null && ID_Collection == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM File_Collection', Callback)
            }
            else
            {
                Database.all('SELECT * FROM File_Collection ORDER BY ' + OrderBy + ' ' + OrderDirection, Callback)
            }
        }
        else if(ID_File == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM File_Collection WHERE ID_Collection = $ID_Collection', {$ID_Collection: ID_Collection}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM File_Collection WHERE ID_Collection = $ID_Collection ORDER BY ' + OrderBy + ' ' + OrderDirection, {$ID_Collection: ID_Collection}, Callback)
            }
        }
        else if(ID_Collection == null)
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM File_Collection WHERE ID_File = $ID_File', {$ID_File: ID_File}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM File_Collection WHERE ID_File = $ID_File ORDER BY ' + OrderBy + ' ' + OrderDirection, {$ID_File: ID_File}, Callback)
            }
        }
        else
        {
            if(OrderBy == null || OrderDirection == null)
            {
                Database.all('SELECT * FROM File_Collection WHERE ID_File = $ID_File and ID_Collection = $ID_Collection', {$ID_File: ID_File, $ID_Collection: ID_Collection}, Callback)
            }
            else
            {
                Database.all('SELECT * FROM File_Collection WHERE ID_File = $ID_File and ID_Collection = $ID_Collection ORDER BY ' + OrderBy + ' ' + OrderDirection, {$ID_File: ID_File, $ID_Collection: ID_Collection}, Callback)
            }
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

DatabaseOperation.MultiInsert = class MultiInsert {
    static InsertAllInfo (ID_Collection, fileInfo, tags, callback) {
        Database.serialize(()=> {
            Database.exec(
                'BEGIN;' +
                'INSERT INTO File (Filename, Path, Url, Date, Checksum) VALUES (' + '"' +  fileInfo.Filename.toString() + '","' + fileInfo.Path.toString() + '","' + fileInfo.Url.toString() + '","' + fileInfo.Date.toString() + '","' + fileInfo.Checksum.toString() + '");'+
                'INSERT INTO File_Collection (ID_File, ID_Collection) VALUES ((SELECT seq FROM sqlite_sequence WHERE name="File"),' +  ID_Collection  + ');'+
                'INSERT INTO Tag (Name, Value) VALUES ("Autor", '+ '"' +tags.Autor.toString()+ '"' + ");"+
                'INSERT INTO File_Tag (ID_File, ID_Tag) VALUES ((SELECT seq FROM sqlite_sequence WHERE name="File"), (SELECT seq FROM sqlite_sequence where name="Tag"));' +
                'INSERT INTO Tag (Name, Value) VALUES ("Tytuł",'+ '"' +tags.Tytul.toString()+ '"' + ');'+
                'INSERT INTO File_Tag (ID_File, ID_Tag) VALUES ((SELECT seq FROM sqlite_sequence WHERE name="File"), (SELECT seq FROM sqlite_sequence where name="Tag"));' +
                'COMMIT;'
                , (err)=> {
                    if (err){
                        callback(err)
                    } else {
                        Database.get('select seq from sqlite_sequence where name="File"', (err, row)=> {
                            if (err) {
                                callback(err, row.seq)
                            } else {
                                callback(null, row.seq)
                            }

                        })
                    }
                })
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

