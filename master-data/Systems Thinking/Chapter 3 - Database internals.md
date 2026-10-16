---
title: File formats.
author: Alex Petrov
date: 2026-10-03
status: finished
description: Layout designing techniques for cells and pages.
---

In-memory following pointer is simple as OS abstracts the underlying details,
by in-memory data structures and virtual memory.

But for on-disk data structure memory offsets have to be computed to follow
pointers, in addition this pointers have to be updated when pointed block
is moved to some other location. This makes pointer management complex
for on-disk data structures.

In case of B-Trees most of the complexity is due to pointer management operations like
node split, merge and pointer iterations like lookup and scans.

Whereas LSM trees complexity is due to sorting, insertions and compaction.

# Binary encoding

## Primitive types 

We can store many primitives and complex data types like strings, numbers, dates etc.
These values are stored in their byte representation while storing it on-disk and 
transmitting information over networks. 

Records consists of combinations of primitive values.

Thus, efficient procedures to serialize and deserialize this data has to be developed.

In-case of multibyte data, byte order matters. There are two byte orders: 
1. Little endianness - LSB of the data gets the smallest memory location
2. Big endianness - MSB of the data gets the smallest memory location

In addition variable size data like strings exists too.
There are two ways to store strings:
1. UCSD string or Pascal string - length followed by string value's binary form
2. null terminated string - end of the string is represented by null \0

## Bit-packed data: Booleans, Enums and Flags

Booleans can have one of two values true or false, and can be stored in single bit,
where set bit indicates true and unset bit indicates false.

Using bigger datatypes using multiple bytes wastes memory.

We can pack many boolean value inside a single byte, and then use 
masking and bit operations to fetch the value of respective boolean.

Enums used to represent low-cardinality values.

Flags are combination of packed enums and booleans.

Flags can represent non-mutually exclusive named boolean parameters.

# General principles

File may start with fix sized header and fixed size trailer containing auxiliary 
data that should be accessed quickly or is needed to deserialize rest of the data,
rest of the file is split into pages.

Memory hierarchy - primitives composed into fields, cells, pages, sectors. 

Database files often contains multiple parts with a lookup table aiding 
navigation and pointing to the start offsets of these parts written either in 
header, trailer or some separate file.

## Page structure 

Difference between internal nodes and leaf nodes, internal nodes stores keys and pointer 
pointing to child nodes, leaf nodes stores keys and corresponding value.

In simple case triplet storing key, value and pointer to child node can be stored in page.

Downsides of triplet representation:
If new node is to be added in some position other than the rightmost all next elements 
have to be shifted to make space for it.

It does not handle variable size records and works only for fixed size data.

## Slotted pages

When storing variable sized records, main problem is free space management:
to reclaim space occupied by deleted records

Space reclamation can be simply done by rewriting the page and moving records 
but the records offset must be preserved so that the out of page pointers keep 
pointing to correct offsets.

Desirable properties of page layout
1. variable sized records can be stored with minimal overhead.
2. data reclaimation can be performed effectively
3. referenced records can be accessed correctly without regard to where
to exact location inside page, so that we can perform reordering of nodes
without worrying that out of page pointers may break.

Organization technique called slot directory or slotted page can be used.
This organize page into collection of slots and cells and split out pointers and 
cells in two independent memory regions on different sides of page, each grows in 
opposite directions toward each other.

Now we only need to reorganize pointers addressing the cells to maintain the order.
Deleting record can be done by nullifying the pointer or by removing it

How this satisfies our desired properties 
1. only overhead incurred is pointer array 
2. data reclamation can be performed by rewriting page's cells in efficient order
3. from outside the page cells are addressed by their IDs to their actual location
inside the page is internal to the page 

# Cell layout

Using primitives construct cells, compose cells into pages and tree out of pages.

At cell level we differentiate between 2 types of cells: key cells and key-value cells

Key cells store key and a pointer to page containing records between two neighboring keys.

Key value cells store key and data record associated with it.

Within same page all cells are of uniform type, similarly all values inside a page 
is either fixed size or variable sized but not both.

We can store some metadata related to values stored at page level inside key cell
so we don't have to store it repeatedly in all cells.

To compose a key cell

ex: 
cell type - can be inferred from the page metadata,
key size, 
id of child page this key is pointing to, 
key bytes

fixed size cell will have no length specifiers

To compose a key-value cell

ex: 
cell type - can be inferred from the page metadata,
key size, 
value size, 
key bytes, 
data record bytes

Pages have a fixed size, and are managed by page cache, thus we only need to
store page id, which is later translated into actual offset in the file using 
lookup table. Cell offsets are page local and are computed relative to the page
start offset. this way using a lower cardinality integer makes the representation
more compact.

# Combining cells into slotted pages 

Cells are appended in the right most side, offsets/pointers are kept in left side.

# Managing variable size data

Removing an item from the page do not have to remove the cell and reorganize
rest of the cells but only nullify the offset or pointer. Instead, cell can be marked
available in in-memory availability list and total amount of available/freed memory is updated.

Availability list stores pointers to free segments and their size. while inserting 
a record we first have to check if it can **fit** in any freed segment.

Fit can be calculated based on the strategies:

First fit - might cause more fragmentation as space remained after using the first 
big enough segment, might be too small to store anything

Best fit - best segment is searched for which will leave with minimal fragmentation

If any continuous segments are not available but the total space is enough to store the value
page is defragmented 

To improve locality some implementations, store key and values separately at leaf level
keeping the keys together improves locality during search over keys, corresponding value 
can be found by accessing corresponding index in the value page, in case of variable size
values additional offset calculation has to be performed.

# Checksuming

Disk may get damaged; data may get corrupted to find out these problems preemptively
and to prevent this corrupted data from propogating error to other data or subsystems
checksums or some redundancy checks can be used.

Checksums provide weakest guarantee, and are not able to detect multi-bit corruption.
CRCs can detect burst errors which is more common during network transmissions. 

Before writing the page into memory its checksum is calculated and stored along with
page, when reading the page next time, checksum is re-calculated and compared with 
the stored one, if they differ underlying data has changed.

Checksums are calculated at page level, as to calculate it at file level is inefficient
and in case of data modification checksum involving whole file's data will have to be 
calculated again, this also allows to detect and proceed only on affected data.
