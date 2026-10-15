---
title: File formats.
author: Alex Petrov
date: 2026-10-03
status: inprogress
description: Layout designing techniques for cells and pages.
---

pointer management in on-disk data structures
operations causing complexity in B-Tree and LSM

# Binary encoding

data layout 
encoding, serialization and deserialization protocols
for multibyte data use same byte order - endianness for both encoding and decoding
big endian, small endian

## Primitive types 

numbers strings date are primitive types and can be represented in their raw
binary forms

for multibyte data use same byte order - endianness for both encoding and decoding
big endian, small endian

records consists of combinations of primitive values

when transmitting data over network or storing it on disk byte sequence can be used
thus serialization and deserialization has to be performed

UCSD string or Pascal string
null terminated string

## Bit-packed data: Booleans, Enums and Flags
bits wastage to display booleans which can have only two values 
that can be represented by a single bit.

Enums used to represent low-cardinality values

flags are combination of packed enums and booleans

flags can represent non-mutually exclusive named boolean parameters

# General principles

file may start with fix sized header and fix sized trailer containing auxiliary 
data that hould be accessed quickly or is needed to deserialize rest of the data

rest of the file is split into pages

heirarchy - primitives fields cells pages sectors 

database files often contians multiple parts with a lookup table aiding 
navigation and pointing to the start offsets of these parts written either in 
header, trailer or some separate file.

## Page structure 

difference between internal nodes and leaf nodes

in simple case triplet storing key, value and pointer to child node can be stored
in page

downsides

if node is to be added in some position other than the rightmost all next elements 
have to be shifted to make space for new element

does not handle variable size records and works only for fixed size data


## Slotted pages

When storing variable sized records main problem is free space management:
to reclaim space occupied by deleted records

space reclaimation can be simply done by rewriting the page and moving records 
but the records offset must be preserved so that the out of page pointers keep 
pointing to correct offsets

desirable properties of page layout
1. variable sized records can be stored with minimal overhead.
2. data reclaimation can be performed effectively
3. referenced records can be accessed correctly without regard to where
to exact location inside page

organization technique called slot directory of slotted page can be used 
organize page into collection of slots and cells and split out pointers and 
cells in two independent memory regions on different sides of page 

now we only need to reorganize pointers addressing the cells to maintain the order
deleting record can be done by nullifying the pointer or by removing it

how this satisfies our desired properties 
1. only overhead incurred is pointer aray 
2. data reclaimation can be performed by rewriting page's cells in efficient order
3. from outside the page cells are adderesed by their IDs to their actual location
inside the page is internal to the page 

# Cell layout

using primitives construct cells, compose cells into pages and tree out of pages

at cell level we differentiate between 2 types of cells: key cells and key-value cells

key cells store key and a pointer to page containing records between two neighboring keys

key value cells store key and data record associated with it

within same page all cells are of uniform type, similarly all values inside a page 
is either fix sized or variable sized but not both

so we can store some metadata related to values stored at page level inside key cell
so we don't have to store it repeatedly in all cells

to compose a key cell

ex: cell type - can be inferred from the page metadata,
key size, id of child page this key is pointing to, key bytes

fixed size cell will have no length specifiers

to compose a key-value cell

ex: cell type - can be inferred from the page metadata,
key size, value size, key bytes, data record bytes

pages have a fixed size, and are managed by page cache, thus we only need to
store page id, which is later translated into actual offset in the file using 
lookup table. Cell offsets are page local and are computed relative to the page
start offset. this way using a lower cardinality integer makes the representation
more compact.

# Combining cells into slotted pages 

cells are appended in the right most side, offsets/pointers are kept in left side.

# Managing variable size data

removing an item from the page do not have to remove the cell and reorganize
rest of the cells, but only nullify the offset or pointer. instead cell can be marked
available in in-memory availability list and total amount of available/freed memory is udpated

availability list stores pointers to free segements and their size. while inserting 
a record we first have to check if it can fit in any freed segment.

Fit can be calculated based on the strategy

First fit - might cause more fragmentation as space remained after using the first 
big enough segment, might be too small to store anything

Best fit - best segment is searched for which will leave with minimal fragementaiton

If any continuous segments are not available but the total space is enough to store the value
page is defragmented 

to improve locality some implementations store key and values separately at leaf level
keeping the keys together improves locality during search over keys, corresponding value 
can be found by accessing corresponding index in the value page, in case of variable size
values additional offset calculation has to be performed

# Checksuming

disk may get damaged, data may get corrupted to find out this problems preemptively
and to prevent this corrupted data from propogating error to other data or subsystems
checksums or some redundancy checks can be used

checksums - weakest guarantee, not able to detect multi-bit corruption
CRCs can detect burst errors

before writing the page into memory its checksum is calculated and stored along with
page, when reading the page next time, checksum is re-calculated and compared with 
the stored one

checksums are calculated at page level, as to calculate it at file level is inefficient
and in case of data modification checksum involving whole file's data will have to be 
calculated again. this also allows to detect and proceed only on affected data.




