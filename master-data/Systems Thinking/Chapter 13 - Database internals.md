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

Atomic commitment solved problem of reaching an agreement on whether or not to execute the proposed transaction. Cohorts cannot choose, influence or 
change the proposed transaction or suggest any alternatives, they can simply vote on whether or not they are willing to execute it.

In databases **transaction manager** subsystem is responsible for scheduling, coordinating, executing and tracking transactions. It ensures that node-
local visibility guarantees are consistent with the visibility prescribed by distributed atomic operations.

# Two-phase commit 

2PC executes in two phases, during the first phase, decided value is distributed and votes are collected. During second phase, nodes makes the results of the first phase visible.

2PC asumes the presence of the **leader** to hold the state and collect votes, it is a primary point of reference for the agreement round, rest of the 
nodes are called cohorts. Coordinator and cohort keep local operation logs for each executed step. Participants vote to accept or reject some value, 
proposed by the coordinator.

**Prepare** - coordinator notifies cohorts about new transaction by **Propose** message. Cohorts make a decision on whether or not they can commit the 
part of the transaction that applies to them. Cohorts notifiy their decision to coordinator. All decisions taken by cohorts are persisted in the 
coordinator log and each cohort keeps a copy of its decision locally.

**Commit/abort** - if even a one of the cohorts votes to abort the transaction, the coordinator sends **Abort** message to all cohorts. If all cohorts 
have voted positively coordinator send them **Commit** message.

During each step coordinator and cohorts have to write the results of each operation to durable storage to be able to reconstruct the state and 
recover in case of local failures, and be able to forward and replay results for other participants.

During the **prepare** phase, transaction contents (operations, identifiers, other metadata) are transferred from the coordinator to the cohorts. The 
transaction is executed by the cohorts locally and is left in a **partially committed** state making it ready for the coordinator to finalize 
execution during the next phase by either committing or aborting it.

## Cohort failures in 2PC

If any cohort fails during prepare phase, coordinator will abort the transaction, and cohorts will rollback pre-committed data.

If cohort fails after sending vote to commit, it has to learn about the actual outcome of the vote before it can serve values correctly, since the 
coordinator might have committed or aborted the transaction depending on other cohorts' decisions. When node gets up, it uses its own logs and 
coordinator's logs to come out of inconsistent state, during which it cannot serve any requests.

## Coordinator failures in 2PC

If cohort fails to get response from the coordinator, it should attempt to find which decision was made by the coordinator. This can be done by 
retrying on coordinator, use backup of coordinator's logs, or the decision can be replicated from peer. 

If coordinator fails after collecting votes, but before broadcasting the results, cohorts end up in a state of uncertainty. Because of this property 
the algorithm is called **blocking atomic commitment algorithm**. If the coordinator never recovers, its replacement has to recollect votes from the 
cohorts and proceed with the final decision.

# Three-phase commit

It makes atomic commitment protocol robust against coordinator failures and avoid undecided states, it added extra step and timeouts on both sides. It 
assumes synchronous model and that communication failures are not possible.

**Propose** - coordinator sends out a proposed value and collects the votes.

**Prepare** - the coordinator notifies cohorts about the vote results, if the vote has passed and all cohorts have decided to commit, the coordinator 
sends a prepare message instructing them to prepare to commit. Otherwise abort message is send and the ruond completes.

**Commit** - cohorts are notified by the coordinator to commit the transaction.

## Coordinator failures in 3PC 

Unlike 2PC, in case of coordinator failure in 3PC, cohorts don't end up in inconsistent state, they wait for coordinator to come back until timeout 
and then proceed to rollback.

Worst-case scenario for 3PC is network partition, some nodes successfully move to the prepared state and now can proceed with commit after the 
timeout. Some cannot communicate with the coordinator and will abort after the timeout. This results in a split brain - some nodes proceed with a 
commit and some abort, all according to the protocol, leaving participants in an inconsistent and contradictory state.

Compared to 2PC, it has larger message overhead, introduces potential contradictions and does not work well in the presence of network partitions.








