---
title: Failure detection.
author: Alex Petrov
date: 2026-10-15
status: finished
description: Pings, heartbeats, gossip, SWIM, phi-accural.
---

For a system to appropriately react to failures, 
failures should be detected in timely manner.

Detecting failures in asynchronous systems is extremely difficult 
as it is impossible to tell whether the process is working slow
or has failed.

Dead, failed, crashed - process that has stopped executing.

Unresponsive, slow, faulty - **suspected** process working slower.

Slowness is indistinguishable from failure, hence there is always a
tradeoff between wrongly marking slow process as failed(false positive)
and delaying marking unresponsive alive process as dead(false negative).

**Failure detector** is a local subsystem responsible for identifying 
failed or unreachable processes to exclude from the algorithm while 
guarantying liveness and preserving safety.

**Liveness** guarantees that a specific intended event **must** occur.
If a process is dead, failure detector must mark it failed.

**Safety** guarantees that a specific unintended event **must not** occur.
If failure detector has marked some process as failed, it has to be 
in fact dead.

**Completeness** - every nonfaulty member should eventually notice the process failure, 
and the algorithm should be able to make progress and eventually 
reach its final result.

Algorithm can be judged by its **efficiency** - how quickly it marks
processes, and **accuracy** - how correctly processes are marked. These 
parameters are in fact tunable, and inversely correlated to each other.
Efficient failure detector algorithm cannot be very accurate and vice versa.

# Heartbeats and pings

**Ping** sends messages to remote processes checking if they are still
alive by expective a response within a specified time period.

**Heartbeat** actively notifies its peers that it is still running
by sending messages to them.

Each process maintains a list of other processes and update it with 
the last response time for each process. If a process fails to respond
to a ping message for a longer time, it is marked as **suspected**.

Both are ultimately same things main difference is who is sender and receiver, 
and what is the message.

# Timeout-free failure detector

Hear-beat a timeout-free failure detector is an algorithm that only 
counts heartbeats and allows the application to detect process failures
based on the data in the heartbeat counter vectors.

Algorithm assumes that each process is aware of the existence of all 
other processes in the network.

Each process maintains a list of neighbors and counters associated 
with them. Processes start by sending heartbeat messages to their 
neighbors. Each message contains a path that the heartbeat has traveled
so far. 

When the process receives a new heartbeat message, it increments counters
for all participants present in the path and sends the heartbeat to the 
ones that are not present there, appending itself to the path. Propagation 
stops as soon as all participants receives the heartbeat.

Heartbeat counters represents global and normalized view of the system.
We might end up marking a process reachable even when the direct link
between processes is faulty.

# Outsourced heartbeats 

**Scalable weakly consistent infection-style process group 
membership protocol (SWIM)** uses outsourced heartbeats. It does 
not require processes to be aware of all other processes in the 
network, only a subset of connected peers.

Process selects a target and send it a direct ping, if the 
target fails to respond to this ping in configured timeout, 
sender requests indirect probes through randomly selected 
multiple intermediaries which attempts to ping the target on 
behalf of original sender. If they receive acknowledgement from 
the target, it is relayed to the original sender, otherwise the 
target is marked as suspected.

This accounts for both direct and indirect reachability. It does 
not require broadcasting messages to a broad group of peers. The 
requests can be sent in parallel hence more information can be 
collected in less time.

## Phi-Accural failure detector

Previous approaches treats process status as binary value - 
either up or down. Phi-accural has a continuous state, it 
captures the probability of the monitored process's crash.

It maintains a sliding window, collecting arrival times of the 
most recent heartbeats from the peer processes. This information 
is used to approximate arrival time of the next heartbeat, 
compare this approximation with the actual arrival time and 
compute the suspicion level (phi): how certain the failure 
detector is about the failure, given the current network 
condition.

It can be viewed as set of three subssytems:

**Monitoring** - collecting liveness information through pings, 
heartbeats or request-response sampling.

**Interpretation** - making decision on whether or not the 
process should be marked as suspected. 

**Action** - callback executed whenever the process is marked 
suspected.

Collected arrival times are expected to follow normal 
distribution, from which distribution parameters mean and 
variance is calculated, which are then used to calculate how 
likely we are to make right decision about process's liveness.

## Gossip and failure detection

It uses gossip to collect and distribute states of neighboring 
processes.

Each member maintains a list of other members, their **heartbeat 
counters** and **timestamps** specifying when the heartbeat 
counter was incremented for the last time.

Periodically each member updates its counter and distributes its 
list to a random peer, upon receiving it, node merges the list 
with its own list.

Nodes periodically check the list of states and heartbeat 
counters. If any node's counter is not updated since long, it is 
marked failed. This timeout should be configured carefully to 
reduce probability of false-positives.

## Reversing failure detection problem statement

Propagating information about failures is not always possible, 
and propagating it by notifying every member might be expensive, 
one of the approaches called **FUSE - failure notification 
service**.

This approach arranges all active processes in groups, if one of 
the group becomes unavailable, all participant detects the 
failure. Every time a single process failure is detected it is 
turned into group failure and then propagate.

Processes in group periodically send ping messages to other 
members, querying whether they're still alive. If one of the 
process fails to respond the member that has initiated this ping 
will in turns stop responding to ping messages itself.

Absence of communication is used as failure propagation. 
Applications can use their own definitions of propagated 
failures.
