---
title: Distribute systems.
author: Alex Petrov
date: 2026-10-12
status: inprogress
description: Fallacies and difficulties in distributed systems.
---

In distribute systems we have multiple **participants** communicating with each other by exchanging **messages**, through **communication links**
between them. Processes can access time using a **clock**, it can be **logical clock** like monotonically increasing counter, or a **physical 
clock (wall clock)** like one accessible thorough operating system, which have some physical notion to it.

Due to inherent difficulties and complexity involved in communication links between nodes, everything in distribute systems is unreliable.
Communication channels may break, delay or reorder messages, this makes knowing the exact state of the remote process more complicated.

**Distribute algorithms** are specially designed algorithms have notion of local and remote state and execution and work despite unreliable 
network and component failures. Algorithms are described in terms of **state** and **steps** with **transitions** between them. Each process
executes algorithm steps locally, and these local executions combinedly constitutes distributes execution over several participants.

Algorithms defines participant roles, messages passed, timing assumptions, states, transitions, failure models.

Distributed algorithms serves many purposes:

**Coordination** - supervise and direct the execution on several participant processes.

**Cooperation** - multiple participant comes together to complete a shared task.

**Dissemination** - information is spread across interested parties rapidly and reliably by message passing.

**Consensus** - participant processes comes on a unanimous agreement.

There is few common things between concurrent and distributed algorithms.

As soon as we allow more than one thread to access the resource we have to face concurrency issues, unless it is explicitly handled, there 
might be multiple possible outputs. 

**Consistency models** describe execution order or concurrent operations and defines order in which changes are made visible to other 
participants, using various consistency models we can significantly reduce number of possible states system can be in.

Concurrent operations have shared memory by which they can communicate, this can be imitated by introducing single source of truth database 
for distributed system, but even communication between this database node and processes is unreliable.

**Synchrony** describes whether the system is asynchronous or some timing assumptions are there. This timing assumptions allows us to define 
timeouts and retries.

We can define **failure models** to describe ways in which failures can occur before deciding on ways to solve and handle them.

**Fault tolerance** describes system reliability, capability of system to keep operating coreectly in case of failures.

# Fallacies of distributed systems 

## Processing

We cannot assume that processing is instantaneous, local execution may take time and taking just network latency in account is not enough.
Moreover, requests might be received but not processed immediately - put into pending queue.

**Backpressure** strategy is to slow down the producers sending messages faster than the rate at which consumer can handle it.

Use of process local queues:

**Decoupling** - message receipt and processing is separated.

**Pipelining** - messages at different stages can be handled separately.

**Handling short time bursts** - overall system latency increases as more messages sits idle in queue, but it is much better than responding
with failure or retries.

## Clocks and times 

It is necessary to always account for clock drifts between processes and the time required for message to get received and processed.

Above assumptions are almost always false. Below ones are best described as not always true.

## State consistency 

Distribute systems do not always guarantee strict state consistency, sometimes replicas are allowed to diverge. This is later handled by 
**conflict resolution** and **read time data repair** leading to eventual consistency.

## Local and remote executions 

Most apparent issue with remote execution is latency - remote calls are many times more costlier than local calls due to network round trips.
Interleaving remote and local execution or hiding remote calls in API may lead to performance degradation and unintended side effects.

## Need to handle failures 

Nodes will mostly be up, but its not the case always. So we have to handle cases where nodes might fail.

## Network partitions and partial failures 

Network partition is when two groups of servers have not way to communicate with each other. In this case both groups keep processing 
requests individually and at the end have different states.

Sometimes communications links may have asymmetric failures. What if the request was received by the process but was never acknowledge as the 
response was lost or delayed. Sender will not have any information regarding state of the request, is it processed or not? Should sender 
retry the same request? 

## Cascading failures 

It is when failure in one part of the system leads to failure in some other part of the system. This may propagate recursively taking down 
the whole system.

**Circuit breakers** monitors failures and allows fallback mechanisms to gradually steer away from failing processes giving it time to 
recover and handle failures gracefully.

When the connection to one of the server fails, the client starts reconnection loop. If the system is already under heavy load, these 
additional retries will only make situation worse. We can introduce **backoff strategy**, instead of retrying immediately client will wait 
for sometime. **Jitter** - tiny random time difference is added to cooling period to make sure that all clients do not retry at the same time.

# Distribute systems abstractions 



