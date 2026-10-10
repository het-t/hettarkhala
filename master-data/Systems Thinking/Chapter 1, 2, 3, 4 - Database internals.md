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
transport subsystem
query processor parses interprets validates the query, access control checks
query optimizer eliminates impossible and redundant parts of the query,
uses internal statistics and data plcement to find the most efficient way to 
execute query
execution plan
handled by execution engine
remote execution and local execution

local execution by storage engine
transactional manager logical consistency of database
lock manager data integrity
access methods storage structures
buffer management caching
recover manager logging and restoration in case of failure

transactional manager + lock manager = concurrency control

# Memory versus Disk based DBMS
volatility durability pricing operational cost

## Durability in memory-based stores
write ahead logs 
backup copy created from asynchronous batch log updates
backup + logs can be used for recovery
snapshots and checkpointing

## Column vs Row-oriented DBMS

data records consisting of columns and rows in tables
field intersection of row and column
tables can be partitioned either horizontally values of same row together
or vertically values of same column together
spatial locality
virtual id

## Wide column stores

column families group of columns and data inside stored row wise

# Data files and index files

instead of relying on filesystem hierarchies of directories and flat files 
for locating records dbms composes files using implementation specific 
formats

advantages of flat files 
storage efficiency access efficiency update efficiency 

dbms stores data records consisting of multiple fields in tables where each
table if represented as a separate file, each record in table can be looked 
up using search key, to locate a record dbms uses indexes - auxiliary data
structures that allow to efficiently locate data records without scanning 
entire table every time

data files store data records
index files store record metadata and use it to locate records in data files 

index files are smaller than data files

files are partitioned into pages, each of size of single of multiple disk
blocks, pages can be organized as a sequence of records or as a slotted pages
 
no explicit deletion but deletion marker - tombstones are used

space shadowed by such tombstones is reclaimed at the time of garbage 
collection

## Data files

primary files implemented as index organized tables iot, heap organized tables heap files, hash organized tables hashed files

when records are stored in a separate file, index files hold data entries
uniquely identifying data records and containing enough information to 
locate them in the data file for example row locators - offsets of data in 
data file

in hash file data is stored in buckets 

heap has no ordering and requires additional index structures to make it 
searchable 

## Index files

index on primary (data) file is called primary index
We can assume primary index is built over a primary key or a set of keys 
identified as primary, all other indexes are secondary 

secondary index can point directly to data or to primary key 

if order of data records follows the search key order - clustered index
in this case data is stored in same file or clustered file

if data is stored in a separate file and its order does not follow the key 
order, index is called non clustered 

implicit primary key

# Buffering immutability and ordering

Storage structures have 3 common variables: buffering immutable files and store
values in order or out of order

### Buffering 

Defines whether or not the storage structure chooses to collect certain
amount of data in memory before putting it on disk

smallest unit of data transfer to and from the disk is a block and it is 
desirable to write full blocks

### Mutability or immutability

defines whether or not storage structure reads parts of the file, update them
and writes the updated results at the same location in the file.

Immutable structures are append-only: once written file contents are not 
modified instead modifications are appended to the end of the file

### Ordering

whether or not the data records are stored in the key order in the pages on disk

it often defines whether or not we can efficiently scan the range of records
not only locate the individual data records.








