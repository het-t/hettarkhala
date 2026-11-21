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


## Paxos algorithm

Paxos algorithm can be split into two phases: voting and replication. Proposer is point of contact it receives a value that should be decided upon, 
attempts to collect votes from the quorum of acceptors. When done, acceptors distribute the information about the agreed value to the learners, 
ratifying the result. Learners increases replication factor of the agreed value.

Only one proposer can collect the majority of votes, under some circumstances votes may get split evenly between the proposers, and neither one of 
them will be able to collect a majority during this round, forcing them to restart.

## Quorums in Paxos 

Used to make sure that some of participants can fail, but still can proceed as long as we can collect votes from the alive ones.

Quorum is the minimum number of votes required for the operation to be performed, this number usually constitutes majority of participants.

Once sufficient number of participants accept the proposal, the value is guaranteed to be accepted by the protocol.

## Failure scenarios

If the original proposer fails during second phase, before broadcasting the value to all the acceptors. New proposer may pick up and commit the 
value, distributing it to the other participants. If the failed proposer has sent accept message to even a single acceptor, later proposer can pick 
that up and finish the broadcasting, the original proposer might not even be aware of this.

This holds true only when the later proposer has some overlap with failed proposer, and that the acceptor in possession of failed proposal is 
available.

# Multi-Paxos 

Classic Paxos algorithm requires propose round for each replication round, only after the proposer is established for the round, which happens after 
a majority of the acceptors respond with a Promise to the proposer's Prepare, it can start the replication. We can introduce concept of distinguished 
proposer - leader to avoid repeating proposal phase for each replication round.

Leases can be used to ensure that we don't end up reading stale records from failed node that have restarted. Leases requires that clock drifts of 
participants is under some upper bound.

# Fast Paxos 

Classic Paxos algorithm has a condition, where during the replication phase, the proposer can pick any value it has collected during the propose 
phase. Fast Paxos has two types of rounds: classic - where the algorithm proceeds the same way as the classic version and fast - where it allows 
acceptors to accept other values.

In this algorithm we refer proposer that has collected a sufficient number of responses during the propose phase as a **coordinator** and reserve 
term **proposer** for all other proposers.

In fast round, if the coordinator is permitted to pick its own value during the replication phase, it can issue *Any* message to acceptors. Acceptors 
in this case are allowed to treat *any* proposer's value as if it is a classic round and they received a message with this value from the coordinator.

Fast round decreases total round trips by at least one. But is prone to *collisions*, which occurs if two or more proposers attempt to use the fast 
step and acceptors receive different values. In such cases coordinator has to intervene and start a new round, to let acceptors **Propose** 
converging single state.

# Egalitarian Paxos

Using a distinguished leader makes system prone to failures - new leader has to be elected when leader fails. Leader has to handle disproportionate 
load. One way to handle avoid putting entire system's load onto single leader is to partition data in non-overlapping segments each with its own 
leader. This way each segment can be scaled separately as per the need. But across the partition operations will require atomic commitment. 

Instead of using a leader and proposal numbers for sequencing commands, we can use a leader responsible for the commit of the *specific* command and 
establish the order by looking up and setting dependencies. This is called Egalitarian Paxos.

EPaxos starts with a *pre-accept* phase, during which process becomes a leader for the specific proposal.
Every proposal has to include: 
*Dependencies* - all commands that potentially interfere with a current proposal, but are not necessarily already committed.
*A sequence number* - this breaks cycles between dependencies. It is set with a value larger than any sequence number of the known dependencies. 

After collecting this information it forwards a **Pre-Accept** message to *fast quorum* of replicas. Replicas check their local command logs update 
the proposal dependencies based on their view of potentially conflicting proposals, and send their information back to the leader. If leader receives 
responses from a fast quorum of replicas, and their dependency lists are in agreement with each other and the leader itself, it can commit the 
command.

If leader does not receive enough responses or if the command lists received from the replicas differ and contain interfering commands, it updates 
its proposal with a new dependency list and a sequence number. New dependency list is based on previous replica responses and combines all collected 
dependencies. 

There is two possible scenarios: 

*Fast path* - when dependencies match and the leader can safely proceed with the command phase with only a fast quorum of replicas.

*Slow path* - when there is a disagreement between the replicas and their command lists have to be updated before the leader can proceed with a 
commit.

EPaxos uses proposal numbers, which prevent stale messages from being propagated. Sequence numbers consist of any *epoch* - identifier of the current 
cluster configuration that changes when nodes leave and join the cluster, a monotonically incremented node-local counter, and a replica ID. If 
replica receives a proposal with a sequence number lower than one it has already seen, it negatively acknowledges the proposal, and sends the highest 
sequence number and an updated command list known to it in response.

# Flexible Paxos 

Is it necessary to contact the majority of servers during every execution step?

Do all quorums have to intersect? 

In other words, does a quorum we use to pick a distinguished proposer, a quorum we use to decide on a value, and 
every execution instance have to have nodes in common?

In Paxos we only require the group of nodes from the first phase to overlap with the group from the second phase.

Instead of defining quorums as majority, we can treat as non-empty group of nodes. If we define total number of participants as N, number of nodes 
required for the propose phase to succeed as Q1 and the number of nodes required for the accept phase to succeed as Q2, we only need to ensure that 
Q1 + Q2 > N. Since the second phase is usually more common than the first one, Q2 can contain only N/2 acceptors, as long as Q1 is adjusted to be 
correspondingly larger. This is called Flexible Paxos.

If we have five acceptors, as long as we require collecting votes from four of them to win the election round, we can allow the leader to wait for 
responses from two nodes during the replication stage.

It allows trading availability for latency: we reduce the number of nodes participating in the second phase but have to collect more votes, requiring 
more participants to be available during the leader election phase. This configuration can continue the replication phase and tolerate failures up to 
N - Q2 nodes, as long as the current leader is stable and new election round is not required.

# Generalized solution to consensus

Instead of splitting roles between the participants and having decision rounds, we can use a simple set of concepts and rules to achieve guarantees 
of a single-decree Paxos.

We have a client and a set of servers. Each server has multiple registers. A register has an index identifying it, can be written only once, and it 
can be in one of three states: unwritten, containing the value and containing nil.

Registers with the same index located on different servers from a *register set*. Each register can have one or more quorums. Depending on the state of the registers in it, a quorum can be in one of the undecided (Any and maybe v) or decided (none and decided v) states:

*Any* - depending on future operations, this quorum set can decide on any value.

*Maybe v* - if this quorum reaches a decision, its decision can only be v.

*None* - this quorum cannot decide on the value.

*Decided v* - this quorum has decided on the value v.

























