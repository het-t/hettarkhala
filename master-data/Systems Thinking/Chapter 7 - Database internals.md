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

Compaction opens up multiple opportunities for 
optimizations and different strategies can be used for 
compaction.

In leveled compaction disk-resident tables are separated 
into tables. Tables on each level have target sizes, and 
each level have corresponding index. 

Level with highest index is called the bottommost level. 

Level0 tables are created by flushing memtable contents, 
and may contain overlapping key ranges. As soon as number
of tables in level 0 reaches a threshold their contents 
are merged, creating new tables for level 1.

Key ranges for the table on level 1 and higher levels do 
not overlap, so tables on level 0 have to be partitioned 
during compaction, split into non-overlapping ranges and 
merged with tables holding corresponding key ranges at 
higher levels. Alternatively compaction can include all 
level0 and level1 tables and output partitioned level1 
tables.

Compaction on higher indexes pick tables from two
consecutive levels with overlapping ranges and produce a 
new table on a higher level.

There is a threshold of number and size of tables on each
level, once reached tables are merged with corresponding
tables of higher level.

Sizes grows exponentially at each level. Older data gradually
migrates to higher level whereas freshest data is always 
on the level with the lowest index.

### Size-tiered compaction

Rather than grouping disk-resident tables based on their 
levels, they're grouped by size: smaller tables are
grouped with smaller ones, and bigger table are grouped 
with bigger ones.

Level 0 holds the smallest tables that were either 
flushed from memtables or created by the compaction 
process. 

When tables are compacted the resulting merged table is 
written to the level holding tables with corresponding 
size. Bigger tables are promoted to higher levels whereas
smaller ones are demoted to lower levels.

**Table starvation** - If compacted tables are still 
small enough after compaction, higher levels may get 
starved of compaction and their tombstones will not be
taken into consideration increasing overall read costs,
in such cases, compaction has to be forced for a level.

**Time window compaction strategy** - takes write 
timestamps into consideration and allows dropping entire 
files that hold data for an already expired time range
without going through any compaction process.

# Read, write and space amplification 

**Read amplification** - need to address multiple tables 
to retrieve data.

**Write amplification** - caused by continuous rewrites 
by compaction process.

**Space amplification** - arise from storing multiple 
copies associated with same key.

Reclaiming space occupied by duplicate records and reduce
space overhead, increases write amplification. Avoiding 
write amplification increases read amplification - due to
overhead from reconciling data records associated with 
the same key during the read.

In B-Trees write amplification is due to repeated writes
to the same node, whereas in LSM-Trees write amplification
is caused by migrating data from one file to another 
during compaction process.

## RUM conjecture

It states that reducing two of these overheads inevitably
leads to change for the worse in the third one.

# Sorted string tables 

