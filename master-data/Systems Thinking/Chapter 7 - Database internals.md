---
title: Log-structure storage.
author: Alex Petrov
date: 2026-10-10
status: inprogress
description: 
---

In-place update storage structures are optimized for read performance, the record has to be 
located first and then modified. This makes writes expensive.

Immutable data structures are append-only, once written the record is never modified.
These are write optimized, there might be multiple copied of the record available 
while reading these records are traversed and reconciled.

# LSM trees

In B-Trees space overhead and write amplification can be improved by using buffering.
Buffering can be used in two ways: to postpone propagating writes to disk-resident pages and 
to make write operation sequential. 

LSM trees use buffering to achieve sequential writes. 

Number of allocated files steadily grows, LSM trees have to merge and rewrite files to make 
sure, that the smallest possible number of files is accessed during the read, as requested 
data records might be spread across multiple files.

## LSM tree structure 

Ordered LSM trees consist of small memory resident and larger disk resident components. To 
write out immutable data on disk, contents are first buffered and sorted in memory and then 
flushed out on disk.

Memory resident component - **memtable** is mutable - it buffers data records and serves as 
a target for read and write operations. When its size grow up to a configured threshold, it 
is persisted on disk.

Separate write-ahead log file is required to ensure durability of data records. Data records
are appended to logs and committed in memory before the operation is acknowledged to the 
client.

We can think in terms of simple operations: write against an in-memory table, reads against 
disk and memory-based tables, merges and removals.


