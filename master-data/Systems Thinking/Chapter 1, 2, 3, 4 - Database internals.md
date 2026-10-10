---
title: Introduction to storage engines.
author: Antti Laaksonen
date: 2026-10-01
status: inprogress
description: Notes inspired from chapters 1 to 4 of database internals book.
---

The main objective of database management system is to provide efficient
storage and retrieval of data.

Database systems are categorized in various ways:

1. Where they store data: in-memory databases, disk oriented databases
2. Storage layout: row-oriented, column-oriented, wide-column based
   etc. This does not provide complete categorization.
   
# Database architecture 

Most database management systems are composed of smaller specialized subsystems, 
this allows to use pluggable componenets.

DBMS uses client/server architecture where database system instance take the role
of servers and application instances take role of clients.

Requests arrives through transport subsystem. Request come in the form of queries,
often expressed in some query language. In multi-node systems transport subsystem is
responsible for communication with other nodes too.

Upon receipt query is parsed by query processor, it parses interprets and validates it.

Later access control checks are performed as they can only be done fully only after the query is
interpreted.

Parsed query is passed to query optimizer, it eliminates redundant and impossible parts of the query, and then attempts to find most efficient way to execute the query based on internal 
statistics and data placement.

Query optimizer handles both relational operations (mostly represented as dependency tree) and 
optimizations such as index ordering, cardinality estimation and choosing access methods.

Query is represented by execution plan, there can be multiple possible ways to execute the query, 
hence the execution plan is not unique to the query.

Execution plan is handled by execution engine it collects results of the execution of local 
and remote operations. Local queries are executed by the storage engine.

Components of storage engine used to execute the query:

### Transactional manager
Schedules transactions and ensures they cannot leave the database in logically inconsistent state.

### Lock manager
Manages locks on the database objects for the running transactions, ensuring the concurrent
operations do not violate physical data integrity.

### Access methods
This manages access and organizing data on disk. Access methods include heap files and storage
structures such as B-trees or LSM trees.

### Buffer manager
Caches data pages in memory.

### Recovery manager
Maintains operation log and restores system in case of failure.

Transactional manager and lock manager together are responsible for concurrent control.

# Memory versus Disk based DBMS

All types of DBMS uses both memory and disk. In-memory databases uses disk for checkpointing, 
backups, logging etc. Disk based databases uses memory for caching, buffering etc. The comparison is about what is the primary data storage.

Using memory as primary data storage, allows to use various sorts of databases that will be very 
complex to represent, manage and store on disk, gives better performance as referring to memory
is magnitude more faster than referring to disk. In addition we dont have to worry about problems
like fragmentation, space allocation and deallocation, as these are managed by operating system 
itself. These all together makes programming for memory much simpler than for disk.

In turns memory is costlier than disk, its volatile hence power cuts, failures can cause data loss.
Various alternatives exists that can make in-memory datastores more robust must it requires 
complex infrastructure and operational expertise.

## Durability in memory-based stores

Some in-memory database systems maintain backups on disk to provide durability and prevent loss of 
volatile data.

Before any operation is considered complete, its results have to be recorded to a sequential 
log file. These logs are called write ahead logs.

To avoid replaying complete logs for recovery, database systems keeps a backup copy on disk.
Logs are applied asynchronously to this backup copy in batches to reduce I/O operations. During
recovery backup copy and logs can be used to restore the database.

After the batch of logs is applied to backup copy, it holds a database **snapshot** for a specific 
point in time, and logs content up to that particular point can be discarded. This is called 
**checkpointing**. It reduced recovery time by keeping backup copy most up-to-date with log 
entries, without blocking the client until the backup is updated.

## Column vs Row-oriented DBMS

Most dbms store a set of data records consisting of columns and rows in tables.
Field is an intersection of row and column - single value of some type. Fields belonging to 
same column usually have the same data type.

Databases can be classified by how the data is stored on disk - row or column wise.

Tables can be partitioned either horizontally values of same row together or vertically values 
of same column together.

Row oriented stores are most useful in scenarios when we have to access data by row, storing 
entire row together improves spatial locality.

In column-oriented database management systems instead of storing rows together, values of same columns are stored together. These are good fit for analytical workloads that compute aggregates.

We have to store some metadata on the column level to identify which data points from other columns
it is associated with. If done explicitly each value will have to hold a key, this introduces 
redundancy and increases the amount od stored data.

Some column stores use implicit identifiers - virtual IDs instead and use the position of the 
value to map it back to the related values.

## Wide column stores

In wide column stores columns are grouped together called column family group. Data is stored row-
wise in each column family.

# Data files and index files

Primary goal of DBMS is to store data and allow quick access to it.

Instead of relying on filesystem hierarchies of directories and flat files 
for locating records DBMS composes files using implementation specific 
formats.

Advantages of using implementation specific formats over flat files:
### Storage efficiency
Files are organized in a way that minimizes storage overhead per stored data record.
### Access efficiency
Records can be located in minimal possible operations.
### Update efficiency
Record updates are performed in a way that minimizes the number of changes in disk.
storage efficiency access efficiency update efficiency .

DBMS stores data records consisting of multiple fields in tables where each
table if represented as a separate file, each record in table can be looked 
up using search key, to locate a record it uses indexes - auxiliary data
structures that allow to efficiently locate data records without scanning 
entire table every time

Data files and index files are usually separated to store data and record metadata used to locate
the records respectively. Index files are smaller than data files.

Files are partitioned into pages, each of size of single of multiple disk blocks, 
pages can be organized as a sequence of records or as a slotted pages.
 
Most systems do no explicitly deletion but deletion marker - tombstones are used to indicate 
deletion. Space shadowed by such tombstones is reclaimed at the time of garbage collection.

## Data files

Data files also called primary files can be implemented as index organized tables (IOT), 
heap organized tables (heap files), hash organized tables (hashed files).

When records are stored in a separate file, index files hold data entries
uniquely identifying data records and containing enough information to 
locate them in the data file for example row locators - offsets of data in data file.

Records in heap files are not required to follow any particular order, most of the time 
they are placed in a write order. Heap files requires some index strucltures pointing to the 
locations where data records are stored, to make them searchable.
In hashed files data is stored in buckets and the hash values of the key determines which bucket a
record belongs to. Records in each bucket is stored in append order or sorted by key to improve
look up speed. 

When records are stored in a separate file, index file holds data entries uniquely indetifying 
data records and containing enough information to locate them in the data file.

Index organized tables always store data records in index itself. Records are stored in key order, 
this makes range scans in IOTs possible by sequentially scanning its contents.

## Index files

Index file is a structure that organize data records on a disk in a way that makes retrieval
efficient. These are specialized structures that map keys to locations in data files where the 
records identified by these keys or primary keys are stored.

Index on primary (data) file is called primary index, we can assume primary index is built over a 
primary key or a set of keys identified as primary, all other indexes are called secondary.

Secondary index can point directly to data or can simply store primary key.

If order of data records follows the search key order - clustered index. In this case data is 
stored in same file or clustered file where key order is preserved.

If data is stored in a separate file and its order does not follow the key order, index is called 
non clustered.

Many database have an inherent and explicit primary key, a set of columns that uniquely identify
the database record. In cases when the primary key is not specified storage engine can create an
implicit primary key.

# Buffering immutability and ordering

Storage structures have 3 common variables: buffering, immutability and whether values are 
stored in some order or not.

### Buffering 

Defines whether or not the storage structure chooses to collect certain
amount of data in memory before putting it on disk.

Smallest unit of data transfer to and from the disk is a block and it is 
desirable to write full blocks so there is always some amount of buffering that can not be 
eliminated.

### Mutability or immutability

Defines whether or not storage structure reads parts of the file, update them
and writes the updated results at the same location in the file.

Immutable structures are append-only: once written file contents are not 
modified instead modifications are appended to the end of the file.

### Ordering

Whether or not the data records are stored in the key order in the pages on disk.

It often defines whether or not we can efficiently scan the range of records
not only locate the individual data records.
