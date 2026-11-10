---
title: Distribute systems.
author: Alex Petrov
date: 2026-10-12
status: finished
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

## Links 

### Fair-loss link

Two processes are connected with a **link**. After the message 
$$M$$ is sent, from the sender's perspective the message can be in 
the following states: not yet delivered but will be at some point 
in time, irrecoverably lost during transport, successfully 
deivbered to the remote process.

Sender have no way to find out if the message is already delivered. 

Properties:

- Fair loss: if both sender and recipient are correct and the sender keeps retransmitting the message infinitely many times, it will eventually be delivered.

- Finite duplication: send messages won't be delivered infinitely many times.

- No creation: link will not come up with messages.

We can introduce message acknowledgements to get more clarity in 
terms of message status. Receivers notifies the sender that it has 
received the message. To distinguish between messages **sequence 
numbers** - monotonically increasing message identifiers are used.

Even the acknowledgement messages can be lost during transmission, 
to solve this problem and provide delivery guarantees, we can try 
**retransmits** - sender sends message and then wait for specified 
time period and then retries. This is called **stubborn link** 
because sender keeps resending the message again and again 
indefinitely.

Retransmits can cause duplication, and it is only safe if the 
operation is idempotent.

## Message order

Messages can arrive out of order and because of retransmits some 
messages can arrive more than once. We can use sequence numbers to 
ensure ordering at recepient's side.

This type of link is called a **perfect link**.

Properties of perfect link:

**Reliable delivery** - every message send once by the correct process A to the correct process B, will eventually be delivered.

**No duplication** - no message is delivered more than once.

**No creation** - link do not come up with any message.

# FLP impossibility 

Consensus protocol describes a system that given multiple processes starting at its initial state, brings all of the processes to the decision state. It has to preserve 3 properties:

**Agreement** - decision the protocol arrives at has to be unanimous. 

**Validity** - agreed value has to be proposed by one of the participants, system should not just come up with the value.

**Termination** - agreement is final only if there are no processes that did not reach the decision state.

FLP impossibility says that given a completely asynchronous system, 
we can not use any timeouts, and there is no reliable way to check 
if some process has crashed or running slow, there exists no 
protocol that can guarantee consensus in bounded time.  No 
completely asynchronous consensus algorithm can tolerate 
unannounced crash of even a single remote process.

# System synchrony

Processes cannot have arbitrarily different processing speeds and 
links do not take indefinitely long to deliver messages. Hence the 
assumptions can be loosened up and system can be though of as 
partially synchronous - that exhibits some of the properties of the 
synchronous system, but the bounds of message delivery clock drift, 
and relative processing speeds might not be exact and hold only 
**most of the times**.

This allows us to use timeouts, and loose timing assumptions, which further allows us to use leader election, consensus, failure-detection etc, but they results in failures if the timing assumptions don't hold up.

# Failure models

Failure models describes exactly how processes can crash in distribute systems.

## Crash faults

Simplest way for a process to crash is by stopping the execution of 
any further steps required by the algorithm and not sending any 
messages to other processes. 

**Crash-stops** prescribes that once the process has crashed, it 
remains in that state. It do not discourage recovery or try to 
prevent it, but once the process has crashed it is not allowed in 
current round of negotiations, but can participant in next 
instances.

**Crash-recovery** assume that process can recover at later point, 
and picks up processing from where it left off. This possibility of 
recovery requires introducing a durable state and recovery protocol 
into the system. Algorithms that allow crash-recovery need to take 
all possible recovery states into consideration.

## Omission faults

It assumes that the process skips some of the algorithm steps, or 
is not able to execute them, or this execution is not visible to 
other participants, or it cannot send or receive messages to and 
from other participants. It captures network partitions between the 
processes caused by fault network links or network congestion.

## Arbitrary faults

Hardest class of failures to overcome is arbitrary or Byzantine 
faults - process continues executing the algorithm steps, but in a 
way that contradicts the algorithm.
