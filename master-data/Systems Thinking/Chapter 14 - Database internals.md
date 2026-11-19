---
title: Consensus.
author: Alex Petrov
date: 2026-10-24
status: inprogress
description: 
---

Distributed consensus algorithms allow multiple processes to reach an agreement on a value. Consensus is extremely useful for putting events
in a particular order, and ensuring consistency among the participants. Using consensus, we can have a system where processes move from one 
values to the next one without losing certainty about which values the clients observe.

Consensus algorithms have three properties: 

**Agreement** - the decision value is the same for all correct processes.

**Validity** - the decided value was proposed by one of the processes.

**Termination** - all correct processes eventually reach the decision.

# Broadcast

**Broadcast** is a communication abstraction often used in distributed systems. Broadcast algorithms are used to disseminate information 
among a set of processes.

Most straightforward way to broadcast messages is through a **best effort broadcast**, the sender is responsible for ensuring message delivery 
to all the targets. If it fails, the other participants do not try to rebroadcast the message, and in the case of coordinator crash, it fails
silently.

More **reliable** broadcast, has to guarantee that all correct processes receive the same message, even when the sender crashes during 
transmission.

Naive version of reliable broadcast uses a failure detector and a fallback mechanism. The most straightforward fallback mechanism is to 
allow every process that received the message to forward it to every other process it is aware of. When the source process fails, other 
processes detect the failure and continue broadcasting the message, effectively **flooding** the network with N2 messages. If the sender fails
other processes pick up and delivers message to the rest of processes.

# Atomic broadcast

Flooding system with messages ensures message delivery, but it does not guarantee any order, if we need to deliver messages in order, we have to 
use the **atomic broadcast (total order multicast)** which guarantees both reliable delivery and total order.

Reliable broadcast ensures processes agrees on the set of messages delivered, atomic broadcast also ensures they agree on the same sequence of
messages i.e. message delivery order is same for every target.

Atomic broadcast has two properties:

**Atomicity** - processes have to agree on the set of received messages. Either all nonfailed processes deliver the message or none od.

**Order** - all nonfailed processes deliver the messages in the same order.

# Virtual synchrony 

Atomic broadcast helps to deliver totally ordered messages to **static** group of processes; virtual synchrony delivers totally ordered messages 
to a **dynamic** group of peers.

Processes are organized into groups. As long as the group exists, messages are delivered to all of its members in the same order. 
Each message is uniquely associated with the group it has originated from.


**Receipt** - when a group member receives the message 
**Delivery** - when all the group members receive the message 
If the message was sent in one view, it can be **delivered** only in the same view. Received messages remain pending in the queue until the 
process is notified about successful delivery.

Some total order broadcast algorithms order messages by using a single process - sequence, that is responsible for determining the order. Such
algorithms are easy to implement but requires detection of leader failures for liveness. Using sequencer can improve performance, since we do 
not need to establish consensus between processes for every message, and can use a sequence-local view instead.

# Zookeeper atomic broadcast - ZAB

Processes in ZAB can take one of two roles: **leader** and **follower**. Leader is a temporary role, it drives the process by executing algorithm 
steps, broadcasts messages to followers and establishes the event order. To write new record or execute reads that observe the most recent values,
clients connect to one of the nodes in the cluster. If the node happens to be the leader, it will handle the request. Otherwise, it forwards the
request to the leader.

To guarantee leader uniqueness, the protocol timeline is split into **epochs**, identified with a unique monotonically and incrementally 
sequenced number. During any epoch, there can be only one leader.  Prospective leader is found using any election algorithm, as long as it chooses
a process that is up with a high probability. 

**Discovery** - the prospective leader learns about the latest epoch known by every other process, and proposes a new epoch that is greater than 
the current epoch of any follower. Followers respond to the epoch proposal with the identifier of the latest transaction seen in the previous epoch.
After this step, no process will accept broadcast proposals for the earlier epochs.

**Synchronization** - this phase is used to recover from the previous leader's failure and bring lagging followers up to speed. Leader sends a 
message to the followers proposing itself as a leader for the new epoch and collects their acknowledgements. After this step, followers will not 
accept attempts to become the epoch leader from any other processes. During synchronization new leader ensures that followers have the same history
and delivers committed proposals from established leaders of earlier epochs. These proposals are delivered before any proposal from the new 
epoch is delivered.

**Broadcast** - Once followers are back in sync, active messaging starts. Leader receives client messages, establishes their order, and 
broadcasts them to the followers, it sends a new proposal, waits for a quorum of followers to respond with acknowledgements and finally commit it. 

Both leaders and followers rely on heartbeats to determine the liveness of the remote processes. If the leader does not receive heartbeats from
the quorum of followers, it steps down as a leader, and restarts the election process. If one of the followers has determined the leader crashed, 
it starts a new election process.

During synchronization phase, followers respond with a highest committed proposal, the leader can simply choose the node with the highest 
proposal for recovery, and this can be the only node messages have to be copied from.

# Paxos

Participants in Paxos can take one of three roles: proposers, acceptors and learners.

**Proposers** - receive values from clients, create proposals to accept these values, and attempt to collect votes from acceptors.

**Acceptors** - vote to accept or reject the values proposed by the proposer. For fault tolerance presence of multiple acceptors is required, 
only a quorum of acceptor votes is required to accept the proposal. 

**Learners** - take role of replicas, storing the outcomes of the accepted proposals.

Any participant can take any role, and most implementations colocate them.

Every proposal consists of value, proposed by the client, and a unique monotonically increasing proposal number.

## Paxos algorithm 

It can be split into two phases: **voting** and **replication**.

During propose phase, proposer sends a **prepare(n)** message to a majority of acceptors and attempts to collect their votes.

When the acceptor receives the prepare request, it has to respond, preserving the following invariants 

- if the acceptor has not responded to prepare request with higher sequence number yet, it promises that it will not accept any proposal with
  a lower sequence number.
- if this acceptor has already accepted any other proposal earlier, it responds with a promise message, notifying the proposer that it has already
  accepted the proposal with a sequence number m.
- if the acceptor has already responded to a prepare request with a higher sequence number, it notifies the proposer about the existence of a higher
  numbered proposal.
- acceptor can respond to more than one prepare request, as long as the later one has a higher sequence number.

During replication phase, after collecting majority of votes, proposer can start the replication, it commits the proposal by sending acceptors an 
`Accept(n, v)` message with value v and proposal number n. 
 
The goal of the first algorithm phase is to establish a leader of the round and understand which value is going to be accepted, allowing the leader
to proceed with the second phase - broadcasting the value.

