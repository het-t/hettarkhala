---
title: Log-structure storage.
author: Alex Petrov
date: 2026-10-10
status: inprogress
description: 
---

Immutable structures do not allow modifications to the existing files.

Whenever there is any update in existing record or new data has to be added, a new record is 
appended to the file.

In-place update storage structures are optimized for read performance there exists just one copy of 
the data. To update this copy is located and overwritten in-place.

Append only storage structures are optimized for write performance, new record is simply appended to
the file, there is no need to locate the actual record. There might be multiple copies of the data 
in the structure, while reading these copies have to be reconciled into a single object.

# LSM Trees

There are two reasons to implement buffering: to postpone propagating writes and to achieve sequential 
writes.

LSM-Trees uses buffering and append-only writes to achieve sequential writes, nodes are fully occupied
and optimized for sequential disk-accesses.

LSM-Trees defer data file writes and updates in memory resident table, these changes are then propagated 
by writing out their contents as on-disk immutable files.

Immutable files have **higher density** - there is no need to reserve extra space for future writes.

Reads and writes do not intersect here so there is no need for mechanism to 
manage concurrent 
operations. Immutable storage structures maintains linearizable views of data and index files,
and only have to guard concurrent access to the structures managing them.

Both B-Trees and LSM-Trees require some housekeeping to optimize performance,
but for different reasons. B-Trees requires defragmentation to reclaim the 
unused free space, node splits and merges are performed to make sure that 
height is balanced. Whereas LSM-Trees require reconciliation to remove 
too many copied of the data.

# LSM Tree Structure

Ordered LSM trees store data in insertion order, which has obvious advantages 
on the write path.

LSM-Trees consists of smaller memory resident and larger disk-resident 
components. Content is first buffered and sorted in memory and 
then written on disk-resident files.

In-memory component memtable is mutable and allows concurrent 
read-write operations to be performed.

Disk-resident components are used only for reads and are immutable.

Thus LSM Trees can be think of in terms of simple operations: 

writes against in-memory table

reads against disk and memory based tables 

merges 

file removals

### Two component LSM-Trees

Two component LSM-Trees have only one disk component, comprised of 
immutable segments, implemented as B-Tree, with 100% node occupancy 
and read-only pages.

Memory-resident tree contents are flushed on disk in parts, 
during a flush for each flashed in-memory subtree, we find a 
corresponding subtree on disk and write out the merged contents 
of a memory resident segment and disk-resident subtree into 
the new segment on disk.

After the subtree is flushed, superseded memory resident and disk-resident 
subtrees are discarded and replaced with the result of their merge.

Things to take care of -

1. As soon as the flush process starts, all new writes have to go to the new memtable.
2. During a subtree flush both the disk-resident and flushing memory-resident subtree have to remain accessible for reads.
3. After the flush, publishing merged contents and discarding unmerged disk and memory resident contents have to be performed atomically.

### Multi-component LSM Trees

Multi-component LSM-Trees have more than just one disk-resident tables. 

Entire memtable contents are flushed in a single run, with multiple 
such flushes we will end up with multiple disk resident tables, and their
number will keep growing over time, and we have to access multiple 
files to locate the searched data.

To keep the number of disk-tables to minimum periodic 
process called compaction is triggered. Old tables are 
discarded simultaneously with the appearance of the new 
merged table.

Until the memtable is fully flushed, the only disk-resident version 
of its contents is stored in the write-ahead log. 

When memtable contents are fully flushed on disk, the 
log can be trimmed, and the log section, holding 
operations applied to the flushed memtable, can be 
discarded.

### Updates are deletes

Removing data records from the memtable is not enough, since other disk
or memory resident tables may hold data records for the same key.

If we were to implement deletes just by removing items from the memtable,
we would end up resurrecting the previous value stored somewhere on disk-resident tables.

Special **dormant record**/**tombstone** has to be stored indicating that the record is deleted.

Reconciliation process picks up the tombstone, and filters out the shadowed values.

To remove a consecutive range of keys rather than just a single key, **predicate deletes** can be used.

This appends predicate to the table, during reconciliation data records 
matching the predicate are skipped and not returned. 

## Maintenance in LSM-Trees

In B-Trees maintenance is needed to reclaim unused cells, defragmentation of pages.

In case of LSM-Trees disk resident tables keep increasing, this can be reduced by periodic merge process.

Compaction process picks multiple disk resident tables, and merge their contents using existing merge and 
reconciliation algorithms, and writes out merged contents into new table - this reduces number of copies 
and eventually total number of tables.

Multiple compaction processes can be carried out at the same time but only on non-intersecting table sets.

### Leveled compaction


