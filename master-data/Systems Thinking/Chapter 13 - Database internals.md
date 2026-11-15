---
title: Distributed transactions.
author: Alex Petrov
date: 2026-10-22
status: inprogress
description: 
---

Atomic operations are explained in terms of state transitions: the database was in state A before a particular transaction was started by the time 
if finished the state went from state A to state B. Transactions are stateless, this gives us flexibility in terms of scheduling and execution: 
transactions can be reordered and even retried.

Main focus is to determine permissible **histories** to model and represent possible interleaving execution scenarios. History is said to be serializable
if it is equivalent to some history that executes these transactions sequentially. 

Distributed transactions require coordinator between nodes, distributed commit and rollback protocols. We have to first execute the transaction and 
only then make its results visible. Transaction is a set of operations, an atomic unit of execution. Transaction atomicity implies that all its results
become visible or none of them do. To ensure atomicity, transactions should be recoverable. If the transaction cannot complete, is aborted or times out, 
its results have to be rolled back completely. Unsuccessful nonrecoverable transaction can leave database in inconsistent state.

Handling network partitions and node failures is important, atomicity requirement holds not only for local operations but also for operations executed 
on other nodes, changes have to be durably propagated to all of the nodes involved in the transaction or none of them.

# Making operations appear atomic 

Class of algorithms **atomic commitment** is used to make multiple operations appear atomic. It does not allow disagreement between the participants, 
if even one of the participant votes against it, the transaction will not commit. Even the failed processes have to reach the same conclusion as the 
rest of the cohort.
